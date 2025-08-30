// src/lib/rmUserAccessClient.ts
// Client-side RM User Access functions that call API endpoints

export interface RMUserAccessClient {
  id: string;
  userId: string;
  userEmail: string;
  examCategory: "RM";
  hasAccess: boolean;
  accessMethod: "payment" | "access_code" | "admin_grant";
  accessGrantedAt: Date;
  accessExpiresAt?: Date;
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentMethod: "flutterwave" | "paystack" | "manual";
    transactionId: string;
    paymentDate: Date;
    paymentStatus: "pending" | "completed" | "failed";
  };
  accessCodeInfo?: {
    code: string;
    redeemedAt: Date;
    codeType: "single_use" | "multi_use";
  };
  rmAttempts: {
    [examId: string]: {
      attemptId: string;
      completed: boolean;
      score?: number;
      submittedAt?: Date;
    };
  };
  adminSettings: {
    maxAttempts?: number;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class RMUserAccessClientManager {
  private static instance: RMUserAccessClientManager;

  public static getInstance(): RMUserAccessClientManager {
    if (!RMUserAccessClientManager.instance) {
      RMUserAccessClientManager.instance = new RMUserAccessClientManager();
    }
    return RMUserAccessClientManager.instance;
  }

  /**
   * Check if user has RM access (client-side)
   */
  async hasRMAccess(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/check-rm-access?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error("Error checking RM access:", error);
      return false;
    }
  }

  /**
   * Get RM user access details (client-side)
   */
  async getRMUserAccess(userId: string): Promise<RMUserAccessClient | null> {
    try {
      const response = await fetch(`/api/check-rm-access?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.hasAccess || !data.accessData) {
        return null;
      }

      // Convert date strings back to Date objects
      const accessData = data.accessData;
      return {
        ...accessData,
        accessGrantedAt: new Date(accessData.accessGrantedAt),
        accessExpiresAt: accessData.accessExpiresAt
          ? new Date(accessData.accessExpiresAt)
          : undefined,
        createdAt: new Date(accessData.createdAt),
        updatedAt: new Date(accessData.updatedAt),
        lastLoginAt: accessData.lastLoginAt
          ? new Date(accessData.lastLoginAt)
          : undefined,
        paymentInfo: accessData.paymentInfo
          ? {
              ...accessData.paymentInfo,
              paymentDate: new Date(accessData.paymentInfo.paymentDate),
            }
          : undefined,
        accessCodeInfo: accessData.accessCodeInfo
          ? {
              ...accessData.accessCodeInfo,
              redeemedAt: new Date(accessData.accessCodeInfo.redeemedAt),
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error getting RM user access:", error);
      return null;
    }
  }

  /**
   * Check if user can start RM exam (client-side)
   */
  async canStartRMExam(
    userId: string,
    examId: string
  ): Promise<{
    canStart: boolean;
    reason?: string;
    attemptsUsed?: number;
    maxAttempts?: number;
  }> {
    try {
      const response = await fetch("/api/can-start-rm-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, examId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking if user can start RM exam:", error);
      return {
        canStart: false,
        reason: "Error checking exam eligibility",
      };
    }
  }
}

// Export singleton instance
export const rmUserAccessClientManager =
  RMUserAccessClientManager.getInstance();
