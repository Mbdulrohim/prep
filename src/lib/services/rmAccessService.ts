import { getRepository } from '../database';
import { AccessCode } from '../entities/AccessCode';
import { UserAccess } from '../entities/UserAccess';
import { Payment } from '../entities/Payment';
import { Repository } from 'typeorm';

export interface AccessCodeData {
  code: string;
  examCategory: string;
  codeType: 'single_use' | 'multi_use';
  maxUses?: number;
  expiresAt?: Date;
  description?: string;
}

export interface PaymentData {
  userId: string;
  examCategory: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
}

export class RMAccessService {
  private accessCodeRepo: Repository<AccessCode> | null = null;
  private userAccessRepo: Repository<UserAccess> | null = null;
  private paymentRepo: Repository<Payment> | null = null;

  private async getAccessCodeRepo(): Promise<Repository<AccessCode>> {
    if (!this.accessCodeRepo) {
      this.accessCodeRepo = await getRepository(AccessCode);
    }
    return this.accessCodeRepo;
  }

  private async getUserAccessRepo(): Promise<Repository<UserAccess>> {
    if (!this.userAccessRepo) {
      this.userAccessRepo = await getRepository(UserAccess);
    }
    return this.userAccessRepo;
  }

  private async getPaymentRepo(): Promise<Repository<Payment>> {
    if (!this.paymentRepo) {
      this.paymentRepo = await getRepository(Payment);
    }
    return this.paymentRepo;
  }

  /**
   * Create a new access code
   */
  async createAccessCode(codeData: AccessCodeData): Promise<AccessCode> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      
      const accessCode = accessCodeRepo.create({
        code: codeData.code.toUpperCase(),
        examCategory: codeData.examCategory,
        codeType: codeData.codeType,
        maxUses: codeData.maxUses || 1,
        usedCount: 0,
        expiresAt: codeData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        description: codeData.description,
        isActive: true
      });

      return await accessCodeRepo.save(accessCode);
    } catch (error) {
      console.error('Error creating access code:', error);
      throw new Error('Failed to create access code');
    }
  }

  /**
   * Validate and redeem access code
   */
  async redeemAccessCode(userId: string, userEmail: string, code: string): Promise<{
    success: boolean;
    message: string;
    accessGranted?: boolean;
  }> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      const userAccessRepo = await this.getUserAccessRepo();

      // Find the access code
      const accessCode = await accessCodeRepo.findOne({
        where: { code: code.toUpperCase(), isActive: true }
      });

      if (!accessCode) {
        return { success: false, message: 'Invalid access code' };
      }

      // Check if code has expired
      if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
        return { success: false, message: 'Access code has expired' };
      }

      // Check if code has reached max uses
      if (accessCode.maxUses && accessCode.usedCount >= accessCode.maxUses) {
        return { success: false, message: 'Access code has been fully used' };
      }

      // Check if user already has access to this exam category
      const existingAccess = await userAccessRepo.findOne({
        where: { 
          userId, 
          examCategory: accessCode.examCategory,
          status: 'active'
        }
      });

      if (existingAccess) {
        return { 
          success: false, 
          message: 'You already have access to this exam category' 
        };
      }

      // Grant access to user
      const userAccess = userAccessRepo.create({
        userId,
        userEmail,
        examCategory: accessCode.examCategory,
        accessType: 'code',
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days access
        accessCodeId: accessCode.id
      });

      await userAccessRepo.save(userAccess);

      // Update access code usage
      await accessCodeRepo.update(
        { id: accessCode.id },
        { usedCount: accessCode.usedCount + 1 }
      );

      return {
        success: true,
        message: 'Access code redeemed successfully',
        accessGranted: true
      };

    } catch (error) {
      console.error('Error redeeming access code:', error);
      throw new Error('Failed to redeem access code');
    }
  }

  /**
   * Check if user has access to exam category
   */
  async checkUserAccess(userId: string, examCategory: string): Promise<{
    hasAccess: boolean;
    accessType?: string;
    expiresAt?: Date;
  }> {
    try {
      const userAccessRepo = await this.getUserAccessRepo();
      
      const userAccess = await userAccessRepo.findOne({
        where: { userId, examCategory, status: 'active' }
      });

      if (!userAccess) {
        return { hasAccess: false };
      }

      // Check if access has expired
      if (userAccess.expiresAt && new Date() > userAccess.expiresAt) {
        // Update status to expired
        await userAccessRepo.update(
          { id: userAccess.id },
          { status: 'expired' }
        );
        return { hasAccess: false };
      }

      return {
        hasAccess: true,
        accessType: userAccess.accessType,
        expiresAt: userAccess.expiresAt
      };

    } catch (error) {
      console.error('Error checking user access:', error);
      throw new Error('Failed to check user access');
    }
  }

  /**
   * Get all access codes (admin function)
   */
  async getAccessCodes(): Promise<AccessCode[]> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      return await accessCodeRepo.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching access codes:', error);
      throw new Error('Failed to fetch access codes');
    }
  }

  /**
   * Generate bulk access codes
   */
  async generateBulkAccessCodes(
    prefix: string,
    count: number,
    examCategory: string,
    codeType: 'single_use' | 'multi_use' = 'single_use',
    maxUses: number = 1
  ): Promise<AccessCode[]> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      const codes: AccessCode[] = [];

      for (let i = 1; i <= count; i++) {
        const code = `${prefix}${i.toString().padStart(3, '0')}`;
        
        const accessCode = accessCodeRepo.create({
          code,
          examCategory,
          codeType,
          maxUses,
          usedCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          description: `Bulk generated code ${i} of ${count}`,
          isActive: true
        });

        codes.push(accessCode);
      }

      return await accessCodeRepo.save(codes);
    } catch (error) {
      console.error('Error generating bulk access codes:', error);
      throw new Error('Failed to generate bulk access codes');
    }
  }
}

export const rmAccessService = new RMAccessService();
