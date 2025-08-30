// src/lib/rmUserAccessAdmin.ts
// RM User Access Management - Server-side using Firebase Admin SDK

import { adminDb } from "@/lib/firebase-admin";

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

class RMUserAccessAdminManager {
  private static instance: RMUserAccessAdminManager;
  
  static getInstance(): RMUserAccessAdminManager {
    if (!RMUserAccessAdminManager.instance) {
      RMUserAccessAdminManager.instance = new RMUserAccessAdminManager();
    }
    return RMUserAccessAdminManager.instance;
  }
  
  /**
   * Check if user has RM access using Admin SDK
   */
  async hasRMAccess(userId: string): Promise<boolean> {
    try {
      console.log("🔍 [ADMIN] Checking RM access for user:", userId);
      const accessDoc = await adminDb.collection("rmUserAccess").doc(userId).get();
      
      if (!accessDoc.exists) {
        console.log("❌ [ADMIN] No RM access document found for user:", userId);
        return false;
      }
      
      const access = accessDoc.data() as RMUserAccess;
      console.log("📄 [ADMIN] Found RM access document:", {
        hasAccess: access.hasAccess,
        accessMethod: access.accessMethod,
        accessGrantedAt: access.accessGrantedAt,
      });
      
      return access.hasAccess;
    } catch (error) {
      console.error("❌ [ADMIN] Error checking RM access:", error);
      return false;
    }
  }
  
  /**
   * Get RM user access data using Admin SDK
   */
  async getRMUserAccess(userId: string): Promise<RMUserAccess | null> {
    try {
      const accessDoc = await adminDb.collection("rmUserAccess").doc(userId).get();
      
      if (!accessDoc.exists) {
        return null;
      }
      
      const data = accessDoc.data();
      return {
        ...data,
        accessGrantedAt: data.accessGrantedAt?.toDate() || new Date(),
        accessExpiresAt: data.accessExpiresAt?.toDate(),
        paymentInfo: data.paymentInfo ? {
          ...data.paymentInfo,
          paymentDate: data.paymentInfo.paymentDate?.toDate() || new Date()
        } : undefined,
        accessCodeInfo: data.accessCodeInfo ? {
          ...data.accessCodeInfo,
          redeemedAt: data.accessCodeInfo.redeemedAt?.toDate() || new Date()
        } : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate(),
      } as RMUserAccess;
    } catch (error) {
      console.error("❌ [ADMIN] Error getting RM user access:", error);
      return null;
    }
  }
  
  /**
   * Grant RM access via payment using Admin SDK
   */
  async grantRMAccessViaPayment(
    userId: string,
    userEmail: string,
    paymentInfo: RMUserAccess['paymentInfo']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💰 [ADMIN] Granting RM access via payment for user:", userId, "email:", userEmail);
      
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
      
      console.log("💾 [ADMIN] Saving RM access data:", accessData);
      await adminDb.collection("rmUserAccess").doc(userId).set(accessData);
      console.log("✅ [ADMIN] RM access saved successfully for user:", userId);
      
      return { success: true };
    } catch (error) {
      console.error("❌ [ADMIN] Error granting RM access via payment:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
  
  /**
   * Grant RM access via access code using Admin SDK
   */
  async grantRMAccessViaCode(
    userId: string,
    userEmail: string,
    accessCodeInfo: RMUserAccess['accessCodeInfo']
  ): Promise<void> {
    try {
      console.log("🔑 [ADMIN] Granting RM access via access code for user:", userId);
      
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
      
      await adminDb.collection("rmUserAccess").doc(userId).set(accessData);
      console.log("✅ [ADMIN] RM access via code saved successfully for user:", userId);
    } catch (error) {
      console.error("❌ [ADMIN] Error granting RM access via code:", error);
      throw error;
    }
  }
  
  /**
   * Update user's last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await adminDb.collection("rmUserAccess").doc(userId).update({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("❌ [ADMIN] Error updating last login:", error);
    }
  }
  
  /**
   * Remove RM access (admin function)
   */
  async removeRMAccess(userId: string): Promise<void> {
    try {
      console.log("🗑️ [ADMIN] Removing RM access for user:", userId);
      await adminDb.collection("rmUserAccess").doc(userId).delete();
      console.log("✅ [ADMIN] RM access removed successfully for user:", userId);
    } catch (error) {
      console.error("❌ [ADMIN] Error removing RM access:", error);
      throw error;
    }
  }
  
  /**
   * Update admin settings for a user
   */
  async updateAdminSettings(
    userId: string,
    adminSettings: Partial<RMUserAccess['adminSettings']>
  ): Promise<void> {
    try {
      await adminDb.collection("rmUserAccess").doc(userId).update({
        adminSettings,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("❌ [ADMIN] Error updating admin settings:", error);
      throw error;
    }
  }
}

export const rmUserAccessAdminManager = RMUserAccessAdminManager.getInstance();
