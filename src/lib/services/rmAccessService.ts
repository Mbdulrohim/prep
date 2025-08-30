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
        type: codeData.examCategory || 'rm',
        isUsed: false,
        examAccess: {
          paper1: true,
          paper2: true,
          attempts: codeData.maxUses || 1,
          expiryDate: (codeData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString()
        },
        metadata: {
          description: codeData.description,
          generatedBy: 'admin'
        }
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

      // Find the access code
      const accessCode = await accessCodeRepo.findOne({
        where: { code: code.toUpperCase(), isUsed: false }
      });

      if (!accessCode) {
        return { success: false, message: 'Invalid access code' };
      }

      // Check if code has expired
      if (accessCode.examAccess?.expiryDate && new Date() > new Date(accessCode.examAccess.expiryDate)) {
        return {
          success: false,
          message: 'Access code has expired'
        };
      }

      // Check if code has already been used
      if (accessCode.isUsed) {
        return {
          success: false,
          message: 'Access code has already been used'
        };
      }

      // Mark code as used
      accessCode.isUsed = true;
      accessCode.usedBy = userId;
      accessCode.usedAt = new Date();
      
      await accessCodeRepo.save(accessCode);

      return {
        success: true,
        message: 'Access code redeemed successfully',
        accessGranted: true
      };
    } catch (error) {
      console.error('Error redeeming access code:', error);
      return {
        success: false,
        message: 'Failed to redeem access code'
      };
    }
  }

  /**
   * Check user access for exam category
   */
  async checkUserAccess(userId: string, examCategory: string): Promise<{
    hasAccess: boolean;
    message: string;
    expiresAt?: Date;
  }> {
    try {
      // For now, return basic access (this would be more complex with real UserAccess entity)
      return {
        hasAccess: true,
        message: 'User has access',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error('Error checking user access:', error);
      return {
        hasAccess: false,
        message: 'Failed to check access'
      };
    }
  }

  /**
   * Grant access via payment
   */
  async grantAccessViaPayment(paymentData: PaymentData): Promise<{
    success: boolean;
    message: string;
    userAccessId?: string;
  }> {
    try {
      // For now, just return success (would integrate with UserAccess and Payment entities)
      return {
        success: true,
        message: 'Access granted via payment',
        userAccessId: 'temp-id'
      };
    } catch (error) {
      console.error('Error granting access via payment:', error);
      return {
        success: false,
        message: 'Failed to grant access via payment'
      };
    }
  }

  /**
   * Generate bulk access codes
   */
  async generateBulkAccessCodes(count: number, examCategory: string, prefix?: string): Promise<AccessCode[]> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      const codes: AccessCode[] = [];

      for (let i = 0; i < count; i++) {
        const codeString = `${prefix || 'RM'}${Date.now()}${i.toString().padStart(3, '0')}`;
        
        const accessCode = accessCodeRepo.create({
          code: codeString.toUpperCase(),
          type: examCategory || 'rm',
          isUsed: false,
          examAccess: {
            paper1: true,
            paper2: true,
            attempts: 1,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          metadata: {
            description: `Bulk generated code for ${examCategory}`,
            generatedBy: 'admin',
            batchId: `batch-${Date.now()}`
          }
        });

        codes.push(await accessCodeRepo.save(accessCode));
      }

      return codes;
    } catch (error) {
      console.error('Error generating bulk access codes:', error);
      throw new Error('Failed to generate bulk access codes');
    }
  }

  /**
   * Get all access codes
   */
  async getAccessCodes(): Promise<AccessCode[]> {
    try {
      const accessCodeRepo = await this.getAccessCodeRepo();
      return await accessCodeRepo.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error getting access codes:', error);
      return [];
    }
  }
}

export const rmAccessService = new RMAccessService();
