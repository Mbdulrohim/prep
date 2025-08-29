// src/lib/rmUserAccess.ts
// RM User Access Management - Completely separate from current userAccess system

import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from "firebase/firestore";

export interface RMUserAccess {
  id: string; // userId
  userId: string;
  userEmail: string;
  examCategory: "RM";
  
  // Access information
  hasAccess: boolean;
  accessMethod: "payment" | "access_code" | "admin_grant";
  accessGrantedAt: Date;
  accessExpiresAt?: Date; // Admin can set expiration
  
  // Payment information (separate from RN payments)
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentMethod: "flutterwave" | "paystack" | "manual";
    transactionId: string;
    paymentDate: Date;
    paymentStatus: "pending" | "completed" | "failed";
  };
  
  // Access code information (separate from RN access codes)
  accessCodeInfo?: {
    code: string;
    redeemedAt: Date;
    codeType: "single_use" | "multi_use";
  };
  
  // RM-specific attempt tracking
  rmAttempts: {
    [examId: string]: {
      attemptId: string;
      completed: boolean;
      score: number;
      percentage: number;
      attemptDate: Date;
      timeSpent: number;
      canRetry: boolean; // Admin configurable
    };
  };
  
  // Admin-configurable settings
  adminSettings: {
    maxAttempts: number; // Default 1, admin can modify
    customExpirationDate?: Date;
    notes?: string; // Admin notes
    specialPermissions?: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

class RMUserAccessManager {
  private static instance: RMUserAccessManager;
  
  static getInstance(): RMUserAccessManager {
    if (!RMUserAccessManager.instance) {
      RMUserAccessManager.instance = new RMUserAccessManager();
    }
    return RMUserAccessManager.instance;
  }
  
  /**
   * Check if user has RM access
   */
  async hasRMAccess(userId: string): Promise<boolean> {
    try {
      console.log("🔍 Checking RM access for user:", userId);
      const accessDoc = await getDoc(doc(db, "rmUserAccess", userId));
      
      if (!accessDoc.exists()) {
        console.log("❌ No RM access document found for user:", userId);
        return false;
      }
      
      const access = accessDoc.data() as RMUserAccess;
      console.log("📄 Found RM access document:", {
        hasAccess: access.hasAccess,
        accessMethod: access.accessMethod,
        accessGrantedAt: access.accessGrantedAt,
        accessExpiresAt: access.accessExpiresAt,
      });
      
      // Check if access is valid and not expired
      if (!access.hasAccess) {
        console.log("❌ RM access is disabled for user:", userId);
        return false;
      }
      
      // Check expiration if set
      if (access.accessExpiresAt) {
        const now = new Date();
        const expiresAt = access.accessExpiresAt instanceof Date 
          ? access.accessExpiresAt 
          : new Date(access.accessExpiresAt);
          
        if (now > expiresAt) {
          console.log("❌ RM access expired for user:", userId, "expired at:", expiresAt);
          return false;
        }
      }
      
      console.log("✅ RM access confirmed for user:", userId);
      return true;
    } catch (error) {
      console.error("❌ Error checking RM access:", error);
      return false;
    }
  }
  
  /**
   * Grant RM access via payment
   */
  async grantRMAccessViaPayment(
    userId: string,
    userEmail: string,
    paymentInfo: RMUserAccess['paymentInfo']
  ): Promise<void> {
    try {
      console.log("💰 Granting RM access via payment for user:", userId, "email:", userEmail);
      
      const accessData: RMUserAccess = {
        id: userId,
        userId,
        userEmail,
        examCategory: "RM",
        hasAccess: true,
        accessMethod: "payment",
        accessGrantedAt: new Date(),
        paymentInfo,
        rmAttempts: {},
        adminSettings: {
          maxAttempts: 1, // Default, admin can modify
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log("💾 Saving RM access data:", accessData);
      await setDoc(doc(db, "rmUserAccess", userId), accessData);
      console.log("✅ RM access saved successfully for user:", userId);
    } catch (error) {
      console.error("❌ Error granting RM access via payment:", error);
      throw error;
    }
  }
  
  /**
   * Grant RM access via access code
   */
  async grantRMAccessViaCode(
    userId: string,
    userEmail: string,
    accessCodeInfo: RMUserAccess['accessCodeInfo']
  ): Promise<void> {
    try {
      const accessData: RMUserAccess = {
        id: userId,
        userId,
        userEmail,
        examCategory: "RM",
        hasAccess: true,
        accessMethod: "access_code",
        accessGrantedAt: new Date(),
        accessCodeInfo,
        rmAttempts: {},
        adminSettings: {
          maxAttempts: 1,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, "rmUserAccess", userId), accessData);
    } catch (error) {
      console.error("Error granting RM access via code:", error);
      throw error;
    }
  }
  
  /**
   * Admin grant RM access
   */
  async adminGrantRMAccess(
    userId: string,
    userEmail: string,
    adminSettings: RMUserAccess['adminSettings'],
    grantedByAdmin: string
  ): Promise<void> {
    try {
      const accessData: RMUserAccess = {
        id: userId,
        userId,
        userEmail,
        examCategory: "RM",
        hasAccess: true,
        accessMethod: "admin_grant",
        accessGrantedAt: new Date(),
        rmAttempts: {},
        adminSettings: {
          ...adminSettings,
          notes: `Granted by admin: ${grantedByAdmin}`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, "rmUserAccess", userId), accessData);
    } catch (error) {
      console.error("Error admin granting RM access:", error);
      throw error;
    }
  }
  
  /**
   * Get RM user access details
   */
  async getRMUserAccess(userId: string): Promise<RMUserAccess | null> {
    try {
      console.log("🔍 Getting RM user access for:", userId);
      const accessDoc = await getDoc(doc(db, "rmUserAccess", userId));
      
      if (!accessDoc.exists()) {
        console.log("❌ No RM access document found for user:", userId);
        return null;
      }
      
      console.log("📄 Raw RM access document data:", accessDoc.data());
      
      const data = accessDoc.data();
      
      // Convert Firestore timestamps to Date objects
      const processedData = {
        ...data,
        accessGrantedAt: data.accessGrantedAt?.toDate ? data.accessGrantedAt.toDate() : new Date(data.accessGrantedAt),
        accessExpiresAt: data.accessExpiresAt?.toDate ? data.accessExpiresAt.toDate() : data.accessExpiresAt ? new Date(data.accessExpiresAt) : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
        paymentInfo: data.paymentInfo ? {
          ...data.paymentInfo,
          paymentDate: data.paymentInfo.paymentDate?.toDate ? data.paymentInfo.paymentDate.toDate() : new Date(data.paymentInfo.paymentDate)
        } : undefined,
        accessCodeInfo: data.accessCodeInfo ? {
          ...data.accessCodeInfo,
          redeemedAt: data.accessCodeInfo.redeemedAt?.toDate ? data.accessCodeInfo.redeemedAt.toDate() : new Date(data.accessCodeInfo.redeemedAt)
        } : undefined,
      } as RMUserAccess;
      
      console.log("✅ Processed RM access data:", processedData);
      return processedData;
    } catch (error) {
      console.error("❌ Error getting RM user access:", error);
      return null;
    }
  }
  
  /**
   * Update RM attempt information
   */
  async updateRMAttempt(
    userId: string,
    examId: string,
    attemptData: RMUserAccess['rmAttempts'][string]
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "rmUserAccess", userId), {
        [`rmAttempts.${examId}`]: attemptData,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating RM attempt:", error);
      throw error;
    }
  }
  
  /**
   * Check if user can start RM exam
   */
  async canStartRMExam(userId: string, examId: string): Promise<{
    canStart: boolean;
    reason?: string;
    attemptsUsed?: number;
    maxAttempts?: number;
  }> {
    try {
      const access = await this.getRMUserAccess(userId);
      
      if (!access || !access.hasAccess) {
        return { 
          canStart: false, 
          reason: "No RM access. Please purchase RM exam access." 
        };
      }
      
      // Check if access expired
      if (access.accessExpiresAt && new Date() > new Date(access.accessExpiresAt)) {
        return { 
          canStart: false, 
          reason: "RM access has expired." 
        };
      }
      
      // Check attempt limits
      const attempts = Object.keys(access.rmAttempts).length;
      const maxAttempts = access.adminSettings.maxAttempts;
      
      if (attempts >= maxAttempts) {
        return { 
          canStart: false, 
          reason: "Maximum attempts reached for RM exams.",
          attemptsUsed: attempts,
          maxAttempts
        };
      }
      
      // Check if specific exam already attempted
      if (access.rmAttempts[examId] && access.rmAttempts[examId].completed) {
        if (!access.rmAttempts[examId].canRetry) {
          return { 
            canStart: false, 
            reason: "This RM exam has already been completed." 
          };
        }
      }
      
      return { 
        canStart: true,
        attemptsUsed: attempts,
        maxAttempts
      };
    } catch (error) {
      console.error("Error checking RM exam eligibility:", error);
      return { 
        canStart: false, 
        reason: "Error checking exam eligibility." 
      };
    }
  }
  
  /**
   * Get all RM users (admin function)
   */
  async getAllRMUsers(): Promise<RMUserAccess[]> {
    try {
      const q = query(collection(db, "rmUserAccess"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as RMUserAccess);
    } catch (error) {
      console.error("Error getting all RM users:", error);
      return [];
    }
  }
  
  /**
   * Revoke RM access (admin function)
   */
  async revokeRMAccess(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "rmUserAccess", userId), {
        hasAccess: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error revoking RM access:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const rmUserAccessManager = RMUserAccessManager.getInstance();
