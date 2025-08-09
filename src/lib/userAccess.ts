// src/lib/userAccess.ts
import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, Timestamp, deleteDoc } from "firebase/firestore";

export interface UserAccess {
  userId: string;
  planType: string;
  isActive: boolean;
  purchaseDate: Date;
  maxAttempts: number;
  remainingAttempts: number;
  paymentReference: string;
  paymentProvider: string;
  amount: number;
  currency: string;
  customerEmail: string;
  transactionId: string;
  retakeAllowed: boolean;
  examTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Security & access control fields
  revokedAt?: Date;
  revokedReason?: string;
  suspendedAt?: Date;
  suspensionEndDate?: Date;
  suspensionReason?: string;
  restoredAt?: Date;
}

export interface MockExamAttempt {
  userId: string;
  examType: string; // "RN", "RM", "RPHN"
  paper: number; // 1 or 2
  attemptNumber: number; // 1, 2, or 3
  score: number;
  totalQuestions: number;
  timeSpent: number;
  startedAt: Date;
  completedAt: Date;
  answers: Record<string, string>;
}

export class UserAccessManager {
  async getUserAccess(userId: string): Promise<UserAccess | null> {
    try {
      const accessRef = doc(db, "userAccess", userId);
      const accessSnap = await getDoc(accessRef);

      if (!accessSnap.exists()) {
        return null;
      }

      const data = accessSnap.data();
      return {
        ...data,
        purchaseDate: data.purchaseDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as UserAccess;
    } catch (error) {
      console.error("Error fetching user access:", error);
      return null;
    }
  }

  async checkExamAccess(
    userId: string,
    examType: string
  ): Promise<{
    hasAccess: boolean;
    attemptsRemaining: number;
    maxAttempts: number;
    canRetake: boolean;
    accessStatus: 'active' | 'revoked' | 'suspended' | 'inactive';
    statusReason?: string;
  }> {
    const access = await this.getUserAccess(userId);

    if (!access) {
      return {
        hasAccess: false,
        attemptsRemaining: 0,
        maxAttempts: 0,
        canRetake: false,
        accessStatus: 'inactive',
        statusReason: 'No access record found',
      };
    }

    // Check if account is revoked
    if (access.revokedAt) {
      return {
        hasAccess: false,
        attemptsRemaining: 0,
        maxAttempts: access.maxAttempts,
        canRetake: false,
        accessStatus: 'revoked',
        statusReason: access.revokedReason,
      };
    }

    // Check if account is suspended
    if (access.suspendedAt && access.suspensionEndDate && new Date() < access.suspensionEndDate) {
      return {
        hasAccess: false,
        attemptsRemaining: access.remainingAttempts,
        maxAttempts: access.maxAttempts,
        canRetake: access.retakeAllowed,
        accessStatus: 'suspended',
        statusReason: access.suspensionReason,
      };
    }

    // Check if account is inactive
    if (!access.isActive) {
      return {
        hasAccess: false,
        attemptsRemaining: 0,
        maxAttempts: access.maxAttempts,
        canRetake: false,
        accessStatus: 'inactive',
        statusReason: 'Account is inactive',
      };
    }

    return {
      hasAccess: access.examTypes.includes(examType),
      attemptsRemaining: access.remainingAttempts,
      maxAttempts: access.maxAttempts,
      canRetake: access.retakeAllowed,
      accessStatus: 'active',
    };
  }

  async consumeAttempt(userId: string): Promise<boolean> {
    try {
      const accessRef = doc(db, "userAccess", userId);
      const access = await this.getUserAccess(userId);

      if (!access || access.remainingAttempts <= 0) {
        return false;
      }

      await updateDoc(accessRef, {
        remainingAttempts: access.remainingAttempts - 1,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error("Error consuming attempt:", error);
      return false;
    }
  }

  // SECURITY: Critical access control methods
  async revokeUserAccess(userId: string, reason?: string): Promise<boolean> {
    try {
      const accessRef = doc(db, "userAccess", userId);
      const access = await this.getUserAccess(userId);

      if (!access) {
        console.warn(`Attempted to revoke access for non-existent user: ${userId}`);
        return false;
      }

      // Completely remove the access record - user appears as if they never had access
      await deleteDoc(accessRef);

      console.log(`Access completely removed for user: ${userId}, reason: ${reason || "Admin action"}`);
      return true;
    } catch (error) {
      console.error("Error revoking user access:", error);
      return false;
    }
  }

  async suspendUserAccess(userId: string, suspensionEndDate: Date, reason?: string): Promise<boolean> {
    try {
      const accessRef = doc(db, "userAccess", userId);
      const access = await this.getUserAccess(userId);

      if (!access) {
        console.warn(`Attempted to suspend access for non-existent user: ${userId}`);
        return false;
      }

      await updateDoc(accessRef, {
        isActive: false,
        suspendedAt: Timestamp.now(),
        suspensionEndDate,
        suspensionReason: reason || "Account suspended by admin",
        updatedAt: Timestamp.now(),
      });

      console.log(`Access suspended for user: ${userId} until ${suspensionEndDate}, reason: ${reason || "Admin action"}`);
      return true;
    } catch (error) {
      console.error("Error suspending user access:", error);
      return false;
    }
  }

  async restoreUserAccess(userId: string): Promise<boolean> {
    try {
      const accessRef = doc(db, "userAccess", userId);
      const access = await this.getUserAccess(userId);

      if (!access) {
        console.warn(`Attempted to restore access for non-existent user: ${userId}`);
        return false;
      }

      // Clear suspension and revocation flags
      await updateDoc(accessRef, {
        isActive: true,
        suspendedAt: null,
        suspensionEndDate: null,
        suspensionReason: null,
        revokedAt: null,
        revokedReason: null,
        restoredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`Access restored for user: ${userId}`);
      return true;
    } catch (error) {
      console.error("Error restoring user access:", error);
      return false;
    }
  }

  async recordMockExamAttempt(
    userId: string,
    examType: string,
    paper: number,
    score: number,
    totalQuestions: number,
    timeSpent: number,
    answers: Record<string, string>
  ): Promise<string | null> {
    try {
      // Get current attempts for this exam type and paper
      const attemptId = `${userId}_${examType}_paper${paper}_${Date.now()}`;

      const attemptData: MockExamAttempt = {
        userId,
        examType,
        paper,
        attemptNumber: await this.getNextAttemptNumber(userId, examType, paper),
        score,
        totalQuestions,
        timeSpent,
        startedAt: new Date(Date.now() - timeSpent),
        completedAt: Timestamp.now().toDate(),
        answers,
      };

      const attemptRef = doc(db, "mockExamAttempts", attemptId);
      await setDoc(attemptRef, attemptData);

      // Consume an attempt
      await this.consumeAttempt(userId);

      return attemptId;
    } catch (error) {
      console.error("Error recording mock exam attempt:", error);
      return null;
    }
  }

  private async getNextAttemptNumber(
    userId: string,
    examType: string,
    paper: number
  ): Promise<number> {
    // For simplicity, we'll determine attempt number based on remaining attempts
    // This is a simplified approach - in production, you might want to query existing attempts
    const access = await this.getUserAccess(userId);
    if (!access) return 1;

    const used = access.maxAttempts - access.remainingAttempts;
    return Math.floor(used / 2) + 1; // Each exam type has 2 papers, so divide by 2
  }

  async getMockExamHistory(
    userId: string,
    examType?: string
  ): Promise<MockExamAttempt[]> {
    try {
      // In a real implementation, you'd query the mockExamAttempts collection
      // For now, return empty array as this is primarily for the payment flow
      return [];
    } catch (error) {
      console.error("Error fetching mock exam history:", error);
      return [];
    }
  }

  async getExamStats(userId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    examTypeStats: Record<
      string,
      {
        attempts: number;
        averageScore: number;
        bestScore: number;
      }
    >;
  }> {
    try {
      // Simplified stats - in production, you'd aggregate from attempts collection
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        examTypeStats: {},
      };
    } catch (error) {
      console.error("Error fetching exam stats:", error);
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        examTypeStats: {},
      };
    }
  }
}

export const userAccessManager = new UserAccessManager();
