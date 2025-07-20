// src/lib/userAccess.ts
import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

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
  }> {
    const access = await this.getUserAccess(userId);

    if (!access || !access.isActive) {
      return {
        hasAccess: false,
        attemptsRemaining: 0,
        maxAttempts: 0,
        canRetake: false,
      };
    }

    return {
      hasAccess: access.examTypes.includes(examType),
      attemptsRemaining: access.remainingAttempts,
      maxAttempts: access.maxAttempts,
      canRetake: access.retakeAllowed,
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
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error consuming attempt:", error);
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
        completedAt: new Date(),
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
