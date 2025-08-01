// src/lib/weeklyAssessments.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { ParsedQuestion } from "./documentParser";

export interface WeeklyAssessment {
  id: string;
  title: string;
  questions: ParsedQuestion[];
  timeLimit: number; // in minutes, fixed at 90
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  totalQuestions: number; // fixed at 150
}

export interface WeeklyAssessmentAttempt {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userUniversity: string;
  assessmentId: string;
  assessmentTitle: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  totalQuestions: number;
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  completed: boolean;
  submitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyAssessmentStats {
  assessmentId: string;
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  averageTimeSpent: number; // in minutes
  topScore: number;
  completionRate: number;
  lastUpdated: Date;
}

class WeeklyAssessmentManager {
  private static instance: WeeklyAssessmentManager;

  static getInstance(): WeeklyAssessmentManager {
    if (!WeeklyAssessmentManager.instance) {
      WeeklyAssessmentManager.instance = new WeeklyAssessmentManager();
    }
    return WeeklyAssessmentManager.instance;
  }

  // Create a new weekly assessment
  async createWeeklyAssessment(
    title: string,
    questions: ParsedQuestion[],
    createdBy: string
  ): Promise<string> {
    try {
      // First, deactivate any current active assessment
      await this.deactivateCurrentAssessment();

      // Ensure exactly 150 questions
      const selectedQuestions = questions.slice(0, 150);
      
      const assessment: Omit<WeeklyAssessment, "id"> = {
        title,
        questions: selectedQuestions,
        timeLimit: 90, // Fixed at 90 minutes
        totalQuestions: 150, // Fixed at 150 questions
        isActive: true,
        createdAt: new Date(),
        createdBy,
      };

      const docRef = await addDoc(collection(db, "weeklyAssessments"), assessment);
      
      console.log("Weekly assessment created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating weekly assessment:", error);
      throw error;
    }
  }

  // Get the current active weekly assessment
  async getCurrentWeeklyAssessment(): Promise<WeeklyAssessment | null> {
    try {
      const q = query(
        collection(db, "weeklyAssessments"),
        where("isActive", "==", true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as WeeklyAssessment;
    } catch (error) {
      console.error("Error getting current weekly assessment:", error);
      return null;
    }
  }

  // Get all previous weekly assessments
  async getPreviousWeeklyAssessments(): Promise<WeeklyAssessment[]> {
    try {
      const q = query(
        collection(db, "weeklyAssessments"),
        where("isActive", "==", false),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as WeeklyAssessment[];
    } catch (error) {
      console.error("Error getting previous weekly assessments:", error);
      return [];
    }
  }

  // Deactivate current assessment
  async deactivateCurrentAssessment(): Promise<void> {
    try {
      const current = await this.getCurrentWeeklyAssessment();
      if (current) {
        await updateDoc(doc(db, "weeklyAssessments", current.id), {
          isActive: false
        });
      }
    } catch (error) {
      console.error("Error deactivating current assessment:", error);
      throw error;
    }
  }

  // Reactivate a previous assessment
  async reactivateAssessment(assessmentId: string): Promise<void> {
    try {
      // First deactivate current assessment
      await this.deactivateCurrentAssessment();
      
      // Then activate the selected assessment
      await updateDoc(doc(db, "weeklyAssessments", assessmentId), {
        isActive: true
      });
      
      console.log("Assessment reactivated:", assessmentId);
    } catch (error) {
      console.error("Error reactivating assessment:", error);
      throw error;
    }
  }

  // Submit a weekly assessment attempt
  async submitWeeklyAssessmentAttempt(
    attempt: Omit<WeeklyAssessmentAttempt, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const attemptData: Omit<WeeklyAssessmentAttempt, "id"> = {
        ...attempt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "weeklyAssessmentAttempts"), attemptData);
      
      console.log("Weekly assessment attempt submitted:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error submitting weekly assessment attempt:", error);
      throw error;
    }
  }

  // Get user's attempt for current assessment
  async getUserAttemptForCurrentAssessment(userId: string): Promise<WeeklyAssessmentAttempt | null> {
    try {
      const currentAssessment = await this.getCurrentWeeklyAssessment();
      if (!currentAssessment) return null;

      const q = query(
        collection(db, "weeklyAssessmentAttempts"),
        where("userId", "==", userId),
        where("assessmentId", "==", currentAssessment.id),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as WeeklyAssessmentAttempt;
    } catch (error) {
      console.error("Error getting user attempt:", error);
      return null;
    }
  }

  // Get weekly assessment stats
  async getWeeklyAssessmentStats(assessmentId: string): Promise<WeeklyAssessmentStats> {
    try {
      const q = query(
        collection(db, "weeklyAssessmentAttempts"),
        where("assessmentId", "==", assessmentId),
        where("completed", "==", true)
      );

      const snapshot = await getDocs(q);
      const attempts = snapshot.docs.map(doc => doc.data());

      if (attempts.length === 0) {
        return {
          assessmentId,
          totalAttempts: 0,
          averageScore: 0,
          averagePercentage: 0,
          averageTimeSpent: 0,
          topScore: 0,
          completionRate: 0,
          lastUpdated: new Date(),
        };
      }

      const totalAttempts = attempts.length;
      const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
      const totalPercentage = attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
      const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);
      const topScore = Math.max(...attempts.map(attempt => attempt.score || 0));

      return {
        assessmentId,
        totalAttempts,
        averageScore: totalScore / totalAttempts,
        averagePercentage: totalPercentage / totalAttempts,
        averageTimeSpent: (totalTimeSpent / totalAttempts) / 60, // Convert to minutes
        topScore,
        completionRate: 100, // All fetched attempts are completed
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Error getting weekly assessment stats:", error);
      throw error;
    }
  }

  // Get weekly assessment leaderboard
  async getWeeklyAssessmentLeaderboard(assessmentId?: string, limitCount: number = 20): Promise<WeeklyAssessmentAttempt[]> {
    try {
      let targetAssessmentId = assessmentId;
      
      // If no assessment ID provided, use current assessment
      if (!targetAssessmentId) {
        const currentAssessment = await this.getCurrentWeeklyAssessment();
        if (!currentAssessment) return [];
        targetAssessmentId = currentAssessment.id;
      }

      const q = query(
        collection(db, "weeklyAssessmentAttempts"),
        where("assessmentId", "==", targetAssessmentId),
        where("completed", "==", true),
        orderBy("percentage", "desc"),
        orderBy("timeSpent", "asc"), // Secondary sort by time (faster is better)
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as WeeklyAssessmentAttempt[];
    } catch (error) {
      console.error("Error getting weekly assessment leaderboard:", error);
      return [];
    }
  }
}

export const weeklyAssessmentManager = WeeklyAssessmentManager.getInstance();
