// src/lib/accessCodes.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

export interface AccessCode {
  id: string;
  code: string;
  examCategory: "RN" | "RM" | "RPHN" | "ALL";
  papers: string[];
  validFor: number; // days
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date | Timestamp;
  expiresAt: Date | Timestamp;
  description?: string;
}

export interface AccessCodeUsage {
  id: string;
  codeId: string;
  code: string;
  userId: string;
  userEmail: string;
  usedAt: Date;
  examCategory: string;
  papers: string[];
}

class AccessCodeManager {
  private static instance: AccessCodeManager;

  static getInstance(): AccessCodeManager {
    if (!AccessCodeManager.instance) {
      AccessCodeManager.instance = new AccessCodeManager();
    }
    return AccessCodeManager.instance;
  }

  // Generate a unique access code
  private generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new access code
  async createAccessCode(
    examCategory: "RN" | "RM" | "RPHN" | "ALL",
    papers: string[],
    validFor: number = 90,
    maxUses: number = 1,
    description?: string,
    createdBy?: string
  ): Promise<AccessCode> {
    const code = this.generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validFor * 24 * 60 * 60 * 1000);

    const accessCode: AccessCode = {
      id: code,
      code,
      examCategory,
      papers,
      validFor,
      maxUses,
      currentUses: 0,
      isActive: true,
      createdBy: createdBy || "admin",
      createdAt: now,
      expiresAt,
      description,
    };

    await setDoc(doc(db, "accessCodes", code), accessCode);
    return accessCode;
  }

  // Validate and redeem an access code
  async redeemAccessCode(
    code: string,
    userId: string,
    userEmail: string
  ): Promise<{ success: boolean; message: string; accessCode?: AccessCode }> {
    try {
      const codeDoc = await getDoc(doc(db, "accessCodes", code.toUpperCase()));

      if (!codeDoc.exists()) {
        return { success: false, message: "Invalid access code" };
      }

      const accessCode = { ...codeDoc.data(), id: codeDoc.id } as AccessCode;

      // Check if code is active
      if (!accessCode.isActive) {
        return {
          success: false,
          message: "This access code has been deactivated",
        };
      }

      // Check if code has expired
      const expiresAt =
        accessCode.expiresAt instanceof Date
          ? accessCode.expiresAt
          : (accessCode.expiresAt as any).toDate();
      if (new Date() > expiresAt) {
        return { success: false, message: "This access code has expired" };
      }

      // Check if code has reached max uses
      if (accessCode.currentUses >= accessCode.maxUses) {
        return {
          success: false,
          message: "This access code has reached its usage limit",
        };
      }

      // Check if user has already used this code
      const usageQuery = query(
        collection(db, "accessCodeUsage"),
        where("codeId", "==", code.toUpperCase()),
        where("userId", "==", userId)
      );
      const usageSnapshot = await getDocs(usageQuery);

      if (!usageSnapshot.empty) {
        return {
          success: false,
          message: "You have already used this access code",
        };
      }

      // Redeem the code
      await this.processCodeRedemption(accessCode, userId, userEmail);

      return {
        success: true,
        message: "Access code redeemed successfully!",
        accessCode,
      };
    } catch (error) {
      console.error("Error redeeming access code:", error);
      return {
        success: false,
        message: "An error occurred while redeeming the code",
      };
    }
  }

  // Process the actual redemption
  private async processCodeRedemption(
    accessCode: AccessCode,
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      // Update access code usage count
      const codeRef = doc(db, "accessCodes", accessCode.id);
      await updateDoc(codeRef, {
        currentUses: accessCode.currentUses + 1,
      });

      // Record the usage
      const usageId = `${accessCode.id}_${userId}_${Date.now()}`;
      const usageData: AccessCodeUsage = {
        id: usageId,
        codeId: accessCode.id,
        code: accessCode.code,
        userId,
        userEmail,
        usedAt: new Date(),
        examCategory: accessCode.examCategory,
        papers: accessCode.papers,
      };

      await setDoc(doc(db, "accessCodeUsage", usageId), usageData);

      // Grant user access
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + accessCode.validFor);

      const userAccessData = {
        hasAccess: true,
        examCategory: accessCode.examCategory,
        papers: accessCode.papers,
        accessGrantedAt: new Date(),
        expiryDate,
        grantedBy: "access_code",
        accessCodeUsed: accessCode.code,
        userEmail,
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "userAccess", userId), userAccessData);
    } catch (error) {
      console.error("Error processing code redemption:", error);
      throw error;
    }
  }

  // Get all access codes (admin only)
  async getAllAccessCodes(): Promise<AccessCode[]> {
    try {
      const codesQuery = query(
        collection(db, "accessCodes"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(codesQuery);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt:
            data.createdAt instanceof Date
              ? data.createdAt
              : data.createdAt?.toDate() || new Date(),
          expiresAt:
            data.expiresAt instanceof Date
              ? data.expiresAt
              : data.expiresAt?.toDate() || new Date(),
        } as AccessCode;
      });
    } catch (error) {
      console.error("Error fetching access codes:", error);
      return [];
    }
  }

  // Deactivate an access code
  async deactivateAccessCode(codeId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, "accessCodes", codeId), {
        isActive: false,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Error deactivating access code:", error);
      return false;
    }
  }

  // Get access code usage statistics
  async getCodeUsageStats(codeId: string): Promise<AccessCodeUsage[]> {
    try {
      const usageQuery = query(
        collection(db, "accessCodeUsage"),
        where("codeId", "==", codeId),
        orderBy("usedAt", "desc")
      );
      const snapshot = await getDocs(usageQuery);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          usedAt:
            data.usedAt instanceof Date
              ? data.usedAt
              : data.usedAt?.toDate() || new Date(),
        } as AccessCodeUsage;
      });
    } catch (error) {
      console.error("Error fetching code usage stats:", error);
      return [];
    }
  }
}

export const accessCodeManager = AccessCodeManager.getInstance();
