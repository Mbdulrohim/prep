// src/lib/rmExamAttempts.ts
// RM Exam Attempts Management - Completely separate from current examAttempts system

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
  orderBy,
  limit
} from "firebase/firestore";
import { RMQuestion } from "./rmExamData";
import { rmUserAccessManager } from "./rmUserAccess";

export interface RMExamAttempt {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userUniversity: string;
  
  // Exam information
  examId: string;
  examCategory: "RM";
  paper: string; // "paper-1", "paper-2", etc. - admin configurable
  examTitle: string;
  
  // Questions and answers
  assignedQuestions: RMQuestion[];
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  
  // Timing information
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  durationMinutes: number; // exam duration set by admin
  
  // Results
  completed: boolean;
  submitted: boolean;
  autoSubmitted?: boolean; // if submitted due to time limit
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  missedQuestions: number[];
  
  // Review information
  canReview: boolean;
  reviewedQuestions: number[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

class RMExamAttemptManager {
  private static instance: RMExamAttemptManager;
  
  static getInstance(): RMExamAttemptManager {
    if (!RMExamAttemptManager.instance) {
      RMExamAttemptManager.instance = new RMExamAttemptManager();
    }
    return RMExamAttemptManager.instance;
  }
  
  /**
   * Create a new RM exam attempt
   */
  async createRMExamAttempt(attemptData: Omit<RMExamAttempt, 'id'>): Promise<string> {
    try {
      const attemptId = `rm_${attemptData.userId}_${attemptData.examId}_${Date.now()}`;
      
      const rmExamAttempt: RMExamAttempt = {
        id: attemptId,
        ...attemptData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to separate collection 'rmExamAttempts'
      await setDoc(doc(db, "rmExamAttempts", attemptId), rmExamAttempt);
      
      return attemptId;
    } catch (error) {
      console.error("Error creating RM exam attempt:", error);
      throw error;
    }
  }
  
  /**
   * Start a new RM exam attempt
   */
  async startRMExamAttempt(
    userId: string,
    userEmail: string,
    userName: string,
    userUniversity: string,
    examId: string,
    examTitle: string,
    paper: string,
    assignedQuestions: RMQuestion[],
    durationMinutes: number
  ): Promise<{ success: boolean; attemptId?: string; error?: string }> {
    try {
      // Check if user can start RM exam
      const eligibility = await rmUserAccessManager.canStartRMExam(userId, examId);
      
      if (!eligibility.canStart) {
        return { success: false, error: eligibility.reason };
      }
      
      const attemptId = `rm_${userId}_${examId}_${Date.now()}`;
      
      const rmExamAttempt: RMExamAttempt = {
        id: attemptId,
        userId,
        userEmail,
        userName,
        userUniversity,
        examId,
        examCategory: "RM",
        paper,
        examTitle,
        assignedQuestions,
        userAnswers: new Array(assignedQuestions.length).fill(null),
        flaggedQuestions: [],
        startTime: new Date(),
        timeSpent: 0,
        durationMinutes,
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
      await setDoc(doc(db, "rmExamAttempts", attemptId), rmExamAttempt);
      
      return { success: true, attemptId };
    } catch (error) {
      console.error("Error starting RM exam attempt:", error);
      return { success: false, error: "Failed to start RM exam attempt" };
    }
  }
  
  /**
   * Submit RM exam attempt
   */
  async submitRMExamAttempt(
    attemptId: string,
    userAnswers: (number | null)[],
    timeSpent: number,
    autoSubmitted: boolean = false
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const attemptDoc = await getDoc(doc(db, "rmExamAttempts", attemptId));
      if (!attemptDoc.exists()) {
        return { success: false, error: "RM exam attempt not found" };
      }
      
      const attempt = attemptDoc.data() as RMExamAttempt;
      
      // Calculate results
      const results = this.calculateRMResults(
        attempt.assignedQuestions,
        userAnswers
      );
      
      const endTime = new Date();
      
      const updatedAttempt: Partial<RMExamAttempt> = {
        userAnswers,
        endTime,
        timeSpent,
        completed: true,
        submitted: true,
        autoSubmitted,
        score: results.score,
        percentage: results.percentage,
        correctAnswers: results.correctAnswers,
        wrongAnswers: results.wrongAnswers,
        unanswered: results.unanswered,
        missedQuestions: results.missedQuestions,
        updatedAt: new Date(),
      };
      
      // Update exam attempt
      await updateDoc(doc(db, "rmExamAttempts", attemptId), updatedAttempt);
      
      // Update RM user access with attempt results
      await rmUserAccessManager.updateRMAttempt(attempt.userId, attempt.examId, {
        attemptId,
        completed: true,
        score: results.score,
        percentage: results.percentage,
        attemptDate: endTime,
        timeSpent,
        canRetry: false, // Default - admin can modify
      });
      
      return { 
        success: true, 
        results: {
          ...results,
          attemptId,
          examTitle: attempt.examTitle,
          timeSpent,
          autoSubmitted,
        }
      };
    } catch (error) {
      console.error("Error submitting RM exam attempt:", error);
      return { success: false, error: "Failed to submit RM exam attempt" };
    }
  }
  
  /**
   * Calculate RM exam results
   */
  private calculateRMResults(
    questions: RMQuestion[],
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
    
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      if (userAnswer === null || userAnswer === undefined) {
        unanswered++;
        missedQuestions.push(index);
      } else if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers++;
        missedQuestions.push(index);
      }
    });
    
    const totalQuestions = questions.length;
    const score = correctAnswers;
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
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
   * Get RM exam attempt by ID
   */
  async getRMExamAttempt(attemptId: string): Promise<RMExamAttempt | null> {
    try {
      const attemptDoc = await getDoc(doc(db, "rmExamAttempts", attemptId));
      
      if (!attemptDoc.exists()) {
        return null;
      }
      
      return attemptDoc.data() as RMExamAttempt;
    } catch (error) {
      console.error("Error getting RM exam attempt:", error);
      return null;
    }
  }
  
  /**
   * Get user's RM exam attempts
   */
  async getUserRMExamAttempts(userId: string): Promise<RMExamAttempt[]> {
    try {
      const q = query(
        collection(db, "rmExamAttempts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as RMExamAttempt);
    } catch (error) {
      console.error("Error getting user RM exam attempts:", error);
      return [];
    }
  }
  
  /**
   * Get RM exam attempt for review
   */
  async getRMExamAttemptForReview(
    attemptId: string,
    userId: string
  ): Promise<RMExamAttempt | null> {
    try {
      const attempt = await this.getRMExamAttempt(attemptId);
      
      if (!attempt || attempt.userId !== userId) {
        return null;
      }
      
      if (!attempt.completed || !attempt.canReview) {
        return null;
      }
      
      return attempt;
    } catch (error) {
      console.error("Error getting RM exam attempt for review:", error);
      return null;
    }
  }
  
  /**
   * Update RM exam progress during exam
   */
  async updateRMExamProgress(
    attemptId: string,
    progressData: {
      userAnswers?: (number | null)[];
      flaggedQuestions?: number[];
      timeSpent?: number;
      updatedAt?: Date;
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {
        ...progressData,
        updatedAt: progressData.updatedAt || new Date(),
      };
      
      // Calculate unanswered count
      if (progressData.userAnswers) {
        updateData.unanswered = progressData.userAnswers.filter(answer => answer === null).length;
      }
      
      await updateDoc(doc(db, "rmExamAttempts", attemptId), updateData);
      return true;
    } catch (error) {
      console.error("Error updating RM exam progress:", error);
      return false;
    }
  }
  
  /**
   * Mark RM question as reviewed
   */
  async markRMQuestionAsReviewed(
    attemptId: string,
    questionIndex: number
  ): Promise<boolean> {
    try {
      const attemptDoc = await getDoc(doc(db, "rmExamAttempts", attemptId));
      
      if (!attemptDoc.exists()) {
        return false;
      }
      
      const attempt = attemptDoc.data() as RMExamAttempt;
      const reviewedQuestions = attempt.reviewedQuestions || [];
      
      if (!reviewedQuestions.includes(questionIndex)) {
        reviewedQuestions.push(questionIndex);
        
        await updateDoc(doc(db, "rmExamAttempts", attemptId), {
          reviewedQuestions,
          updatedAt: new Date(),
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error marking RM question as reviewed:", error);
      return false;
    }
  }
  
  /**
   * Get all RM exam attempts (admin function)
   */
  async getAllRMExamAttempts(): Promise<RMExamAttempt[]> {
    try {
      const q = query(
        collection(db, "rmExamAttempts"),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as RMExamAttempt);
    } catch (error) {
      console.error("Error getting all RM exam attempts:", error);
      return [];
    }
  }
  
  /**
   * Get RM exam statistics (admin function)
   */
  async getRMExamStatistics(): Promise<{
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    passRate: number; // percentage with 70% or higher
    averageTimeSpent: number;
  }> {
    try {
      const attempts = await this.getAllRMExamAttempts();
      const completedAttempts = attempts.filter(a => a.completed);
      
      if (completedAttempts.length === 0) {
        return {
          totalAttempts: attempts.length,
          completedAttempts: 0,
          averageScore: 0,
          passRate: 0,
          averageTimeSpent: 0,
        };
      }
      
      const totalScore = completedAttempts.reduce((sum, a) => sum + a.percentage, 0);
      const averageScore = totalScore / completedAttempts.length;
      
      const passedAttempts = completedAttempts.filter(a => a.percentage >= 70);
      const passRate = (passedAttempts.length / completedAttempts.length) * 100;
      
      const totalTimeSpent = completedAttempts.reduce((sum, a) => sum + a.timeSpent, 0);
      const averageTimeSpent = totalTimeSpent / completedAttempts.length;
      
      return {
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore,
        passRate,
        averageTimeSpent,
      };
    } catch (error) {
      console.error("Error getting RM exam statistics:", error);
      return {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
      };
    }
  }
}

// Export singleton instance
export const rmExamAttemptManager = RMExamAttemptManager.getInstance();
