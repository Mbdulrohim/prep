// src/lib/examAttempts.ts
// Comprehensive exam attempt management system

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface ExamAttempt {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userUniversity: string;
  examId: string;
  examCategory: "RN" | "RM" | "RPHN";
  paper: "paper-1" | "paper-2";
  assignedQuestions: Question[];
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  completed: boolean;
  submitted: boolean;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  missedQuestions: number[];
  canReview: boolean;
  reviewedQuestions: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string | number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examId?: string;
  category?: string;
  difficulty?: string;
  topics?: string[];
  paper?: string;
  flagged?: boolean;
}

export interface UserAccess {
  userId: string;
  userEmail: string;
  userName: string;
  userUniversity: string;
  examCategory: "RN" | "RM" | "RPHN";
  papers: ("paper-1" | "paper-2")[];
  accessGrantedAt: Date;
  expiryDate: Date;
  isActive: boolean;
  attemptsMade: {
    [examId: string]: {
      attemptId: string;
      completed: boolean;
      score: number;
      attemptDate: Date;
    };
  };
  maxAttempts: number;
  remainingAttempts: number;
  accessCode: string;
  lastLoginAt?: Date;
  isRestricted: boolean;
  restrictionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ExamAttemptManager {
  private static instance: ExamAttemptManager;

  static getInstance(): ExamAttemptManager {
    if (!ExamAttemptManager.instance) {
      ExamAttemptManager.instance = new ExamAttemptManager();
    }
    return ExamAttemptManager.instance;
  }

  /**
   * Check if user can start a new exam
   */
  async canUserStartExam(
    userId: string,
    examId: string
  ): Promise<{
    canStart: boolean;
    reason?: string;
    existingAttempt?: ExamAttempt;
  }> {
    try {
      // First check if this is an admin user
      const ADMIN_EMAILS = [
        "doyextech@gmail.com",
        "ibrahimadekunle3030@gmail.com",
        "adekunleibrahim6060@gmail.com",
      ];

      // Get user's email to check admin status
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.email && ADMIN_EMAILS.includes(userData.email)) {
          // Admin users have unlimited access
          return { canStart: true };
        }
      }

      // Check user access
      const userAccessDoc = await getDoc(doc(db, "userAccess", userId));
      if (!userAccessDoc.exists()) {
        return {
          canStart: false,
          reason:
            "No access permissions found. Please purchase exam access or redeem an access code.",
        };
      }

      const userAccess = userAccessDoc.data() as UserAccess;

      // Check if access is active
      if (!userAccess.isActive) {
        return { canStart: false, reason: "Access has been deactivated" };
      }

      // Check if user is restricted
      if (userAccess.isRestricted) {
        return {
          canStart: false,
          reason: `Access restricted: ${
            userAccess.restrictionReason || "Contact admin"
          }`,
        };
      }

      // Check expiry
      const now = new Date();
      let expiryDate: Date;
      if (userAccess.expiryDate instanceof Date) {
        expiryDate = userAccess.expiryDate;
      } else if (
        userAccess.expiryDate &&
        (userAccess.expiryDate as any).toDate
      ) {
        expiryDate = (userAccess.expiryDate as any).toDate();
      } else {
        expiryDate = new Date(userAccess.expiryDate);
      }

      if (now > expiryDate) {
        return { canStart: false, reason: "Access has expired" };
      }

      // Check if exam was already attempted
      if (userAccess.attemptsMade[examId]) {
        const existingAttemptDoc = await getDoc(
          doc(db, "examAttempts", userAccess.attemptsMade[examId].attemptId)
        );

        if (existingAttemptDoc.exists()) {
          const existingAttempt = existingAttemptDoc.data() as ExamAttempt;

          if (existingAttempt.completed) {
            return {
              canStart: false,
              reason: "Exam already completed. You can review your answers.",
              existingAttempt,
            };
          }

          // Allow continuation of incomplete exam
          return {
            canStart: true,
            existingAttempt,
          };
        }
      }

      // Check remaining attempts
      if (userAccess.remainingAttempts <= 0) {
        return { canStart: false, reason: "No remaining attempts" };
      }

      return { canStart: true };
    } catch (error) {
      console.error("Error checking exam eligibility:", error);
      return { canStart: false, reason: "System error. Please try again." };
    }
  }

  /**
   * Start a new exam attempt
   */
  async startExamAttempt(
    userId: string,
    userEmail: string,
    userName: string,
    userUniversity: string,
    examId: string,
    examCategory: "RN" | "RM" | "RPHN",
    paper: "paper-1" | "paper-2",
    assignedQuestions: Question[]
  ): Promise<{ success: boolean; attemptId?: string; error?: string }> {
    try {
      const attemptId = `${userId}_${examId}_${Date.now()}`;

      const examAttempt: ExamAttempt = {
        id: attemptId,
        userId,
        userEmail,
        userName,
        userUniversity,
        examId,
        examCategory,
        paper,
        assignedQuestions,
        userAnswers: new Array(assignedQuestions.length).fill(null),
        flaggedQuestions: [],
        startTime: new Date(),
        timeSpent: 0,
        completed: false,
        submitted: false,
        score: 0,
        percentage: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unanswered: assignedQuestions.length,
        missedQuestions: [],
        canReview: true,
        reviewedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save exam attempt
      await setDoc(doc(db, "examAttempts", attemptId), examAttempt);

      // Get current user access to update remaining attempts
      const userAccessDoc = await getDoc(doc(db, "userAccess", userId));
      const currentUserAccess = userAccessDoc.data() as UserAccess;

      // Update user access
      await updateDoc(doc(db, "userAccess", userId), {
        [`attemptsMade.${examId}`]: {
          attemptId,
          completed: false,
          score: 0,
          attemptDate: new Date(),
        },
        remainingAttempts: (currentUserAccess.remainingAttempts || 1) - 1,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, attemptId };
    } catch (error) {
      console.error("Error starting exam attempt:", error);
      return { success: false, error: "Failed to start exam attempt" };
    }
  }

  /**
   * Submit exam attempt
   */
  async submitExamAttempt(
    attemptId: string,
    userAnswers: (number | null)[],
    timeSpent: number
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const attemptDoc = await getDoc(doc(db, "examAttempts", attemptId));
      if (!attemptDoc.exists()) {
        return { success: false, error: "Exam attempt not found" };
      }

      const attempt = attemptDoc.data() as ExamAttempt;

      // Calculate results
      const results = this.calculateResults(
        attempt.assignedQuestions,
        userAnswers
      );

      const updatedAttempt: Partial<ExamAttempt> = {
        userAnswers,
        endTime: new Date(),
        timeSpent,
        completed: true,
        submitted: true,
        score: results.score,
        percentage: results.percentage,
        correctAnswers: results.correctAnswers,
        wrongAnswers: results.wrongAnswers,
        unanswered: results.unanswered,
        missedQuestions: results.missedQuestions,
        updatedAt: new Date(),
      };

      // Update exam attempt
      await updateDoc(doc(db, "examAttempts", attemptId), updatedAttempt);

      // Update user access with final results
      await updateDoc(doc(db, "userAccess", attempt.userId), {
        [`attemptsMade.${attempt.examId}.completed`]: true,
        [`attemptsMade.${attempt.examId}.score`]: results.score,
        updatedAt: new Date(),
      });

      return { success: true, results };
    } catch (error) {
      console.error("Error submitting exam attempt:", error);
      return { success: false, error: "Failed to submit exam" };
    }
  }

  /**
   * Calculate exam results
   */
  private calculateResults(
    questions: Question[],
    userAnswers: (number | null)[]
  ): {
    score: number;
    percentage: number;
    correctAnswers: number;
    wrongAnswers: number;
    unanswered: number;
    missedQuestions: number[];
  } {
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    const missedQuestions: number[] = [];

    for (let i = 0; i < questions.length; i++) {
      const userAnswer = userAnswers[i];
      const correctAnswer = questions[i].correctAnswer;

      if (userAnswer === null) {
        unanswered++;
        missedQuestions.push(i);
      } else if (userAnswer === correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers++;
        missedQuestions.push(i);
      }
    }

    const score = correctAnswers;
    const percentage = (correctAnswers / questions.length) * 100;

    return {
      score,
      percentage,
      correctAnswers,
      wrongAnswers,
      unanswered,
      missedQuestions,
    };
  }

  /**
   * Get user's exam attempts
   */
  async getUserExamAttempts(userId: string): Promise<ExamAttempt[]> {
    try {
      // First get all attempts for the user (without orderBy to avoid index requirement)
      const q = query(
        collection(db, "examAttempts"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const attempts = querySnapshot.docs.map((doc) => doc.data() as ExamAttempt);
      
      // Sort on the client side by createdAt descending
      return attempts.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error) {
      console.error("Error getting user exam attempts:", error);
      return [];
    }
  }

  /**
   * Get exam attempt for review
   */
  async getExamAttemptForReview(
    attemptId: string,
    userId: string
  ): Promise<ExamAttempt | null> {
    try {
      const attemptDoc = await getDoc(doc(db, "examAttempts", attemptId));

      if (!attemptDoc.exists()) {
        return null;
      }

      const data = attemptDoc.data();

      // Verify ownership
      if (data.userId !== userId) {
        return null;
      }

      // Convert Firestore timestamps to Date objects
      return {
        id: attemptDoc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userUniversity: data.userUniversity,
        examId: data.examId,
        examCategory: data.examCategory,
        paper: data.paper,
        assignedQuestions: data.assignedQuestions || [],
        userAnswers: data.userAnswers || [],
        flaggedQuestions: data.flaggedQuestions || [],
        startTime: data.startTime.toDate(),
        endTime: data.endTime ? data.endTime.toDate() : undefined,
        timeSpent: data.timeSpent || 0,
        completed: data.completed || false,
        submitted: data.submitted || false,
        score: data.score || 0,
        percentage: data.percentage || 0,
        correctAnswers: data.correctAnswers || 0,
        wrongAnswers: data.wrongAnswers || 0,
        unanswered: data.unanswered || 0,
        missedQuestions: data.missedQuestions || [],
        canReview: data.canReview || false,
        reviewedQuestions: data.reviewedQuestions || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } catch (error) {
      console.error("Error getting exam attempt for review:", error);
      return null;
    }
  }

  /**
   * Mark question as reviewed
   */
  async markQuestionAsReviewed(
    attemptId: string,
    questionIndex: number
  ): Promise<boolean> {
    try {
      const attemptDoc = await getDoc(doc(db, "examAttempts", attemptId));

      if (!attemptDoc.exists()) {
        return false;
      }

      const attempt = attemptDoc.data() as ExamAttempt;
      const reviewedQuestions = attempt.reviewedQuestions || [];

      if (!reviewedQuestions.includes(questionIndex)) {
        reviewedQuestions.push(questionIndex);

        await updateDoc(doc(db, "examAttempts", attemptId), {
          reviewedQuestions,
          updatedAt: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error marking question as reviewed:", error);
      return false;
    }
  }

  /**
   * Create a new exam attempt record
   */
  async createExamAttempt(attemptData: Partial<ExamAttempt>): Promise<string> {
    try {
      const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const attempt: ExamAttempt = {
        id: attemptId,
        userId: attemptData.userId!,
        userEmail: attemptData.userEmail!,
        userName: attemptData.userName!,
        userUniversity: attemptData.userUniversity!,
        examId: attemptData.examId!,
        examCategory: attemptData.examCategory!,
        paper: attemptData.paper!,
        assignedQuestions: attemptData.assignedQuestions || [],
        userAnswers: attemptData.userAnswers || [],
        flaggedQuestions: attemptData.flaggedQuestions || [],
        startTime: attemptData.startTime || new Date(),
        timeSpent: attemptData.timeSpent || 0,
        completed: false,
        submitted: false,
        score: 0,
        percentage: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unanswered: attemptData.assignedQuestions?.length || 0,
        missedQuestions: [],
        canReview: false,
        reviewedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "examAttempts", attemptId), attempt);
      console.log('Created exam attempt:', attemptId);
      
      return attemptId;
    } catch (error) {
      console.error("Error creating exam attempt:", error);
      throw error;
    }
  }

  /**
   * Update exam progress during the exam
   */
  async updateExamProgress(attemptId: string, progressData: {
    userAnswers?: (number | null)[];
    flaggedQuestions?: number[];
    timeSpent?: number;
    updatedAt?: Date;
  }): Promise<boolean> {
    try {
      const updateData: any = {
        ...progressData,
        updatedAt: progressData.updatedAt || new Date(),
      };

      // Calculate unanswered count
      if (progressData.userAnswers) {
        updateData.unanswered = progressData.userAnswers.filter(answer => answer === null).length;
      }

      await updateDoc(doc(db, "examAttempts", attemptId), updateData);
      return true;
    } catch (error) {
      console.error("Error updating exam progress:", error);
      return false;
    }
  }

  /**
   * Complete and finalize exam attempt
   */
  async completeExamAttempt(attemptId: string, finalData: {
    score: number;
    percentage: number;
    correctAnswers: number;
    wrongAnswers: number;
    unanswered: number;
    timeSpent: number;
    answers: (number | null)[];
    flaggedQuestions: number[];
    endTime: Date;
    completed: boolean;
    submitted: boolean;
    isAutoSubmit?: boolean;
  }): Promise<boolean> {
    try {
      // Get the attempt data first
      const attemptRef = doc(db, "examAttempts", attemptId);
      const attemptDoc = await getDoc(attemptRef);
      
      if (!attemptDoc.exists()) {
        throw new Error("Attempt not found");
      }
      
      const attemptData = attemptDoc.data();
      
      const updateData = {
        ...finalData,
        userAnswers: finalData.answers,
        canReview: true,
        endTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        missedQuestions: finalData.answers
          .map((answer, index) => answer === null ? index : null)
          .filter(index => index !== null),
      };

      // Update the exam attempt
      await updateDoc(attemptRef, updateData);
      
      // Also create an exam result for leaderboard compatibility
      const examResultData = {
        userId: attemptData.userId,
        userEmail: attemptData.userEmail,
        userName: attemptData.userName,
        userUniversity: attemptData.userUniversity,
        examId: attemptData.examId,
        examCategory: attemptData.examCategory,
        paper: attemptData.paper,
        score: finalData.score,
        percentage: finalData.percentage,
        correctAnswers: finalData.correctAnswers,
        wrongAnswers: finalData.wrongAnswers,
        unanswered: finalData.unanswered,
        timeSpent: finalData.timeSpent,
        totalQuestions: attemptData.assignedQuestions?.length || 0,
        isAutoSubmit: finalData.isAutoSubmit || false,
        attemptId: attemptId,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      
      // Create exam result document for leaderboard
      const examResultRef = doc(collection(db, "examResults"));
      await setDoc(examResultRef, examResultData);
      
      console.log('Completed exam attempt and created result for leaderboard:', attemptId);
      
      return true;
    } catch (error) {
      console.error("Error completing exam attempt:", error);
      return false;
    }
  }
}

// Export singleton instance
export const examAttemptManager = ExamAttemptManager.getInstance();
