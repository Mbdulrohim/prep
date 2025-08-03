// src/lib/weeklyAssessments.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
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

export interface StandaloneWeeklyAssessment {
  id: string;
  title: string;
  questions: ParsedQuestion[];
  timeLimit: number; // in minutes
  totalQuestions: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  // Simplified scheduling - only availability date
  availableDate?: Date; // When assessment becomes available (if scheduled)
  isScheduled: boolean; // Whether this assessment uses scheduled availability
  masterToggle: boolean; // Override for instant enable/disable
  // Standalone properties - NO exam category links
  assessmentType: "weekly-assessment"; // Always this value
  description?: string; // Optional description for admins
}

export interface StandaloneAssessmentAttempt {
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

export interface StandaloneAssessmentStats {
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
    createdBy: string,
    options?: {
      timeLimit?: number;
      totalQuestions?: number;
      availableDate?: Date;
      isScheduled?: boolean;
    }
  ): Promise<string> {
    try {
      // First, deactivate any current active assessment
      await this.deactivateCurrentAssessment();

      // Use provided options or defaults
      const timeLimit = options?.timeLimit || 90;
      const totalQuestions =
        options?.totalQuestions || Math.min(questions.length, 150);
      const selectedQuestions = questions.slice(0, totalQuestions);

            const assessment: Omit<StandaloneWeeklyAssessment, "id"> = {
        title,
        questions: selectedQuestions,
        timeLimit,
        totalQuestions,
        isActive: true,
        isScheduled: options?.isScheduled || false,
        masterToggle: true,
        availableDate: options?.availableDate,
        assessmentType: "weekly-assessment",
        createdAt: new Date(),
        createdBy,
      };

      const docRef = await addDoc(
        collection(db, "weeklyAssessments"),
        assessment
      );

      console.log("Weekly assessment created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating weekly assessment:", error);
      throw error;
    }
  }

  // Get the current active weekly assessment that's available to students
  async getCurrentWeeklyAssessment(): Promise<StandaloneWeeklyAssessment | null> {
    try {
      const q = query(
        collection(db, "weeklyAssessments"),
        where("isActive", "==", true),
        where("masterToggle", "==", true),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docData = snapshot.docs[0];
      const assessment = {
        id: docData.id,
        ...docData.data(),
        createdAt: docData.data().createdAt?.toDate() || new Date(),
        availableDate: docData.data().availableDate?.toDate(),
      } as StandaloneWeeklyAssessment;

      // Check if assessment is currently available based on schedule
      if (assessment.isScheduled) {
        const now = new Date();
        if (assessment.availableDate && now < assessment.availableDate) return null;
      }

      return assessment;
    } catch (error) {
      console.error("Error getting current weekly assessment:", error);
      return null;
    }
  }

  // Get the current active assessment for admin purposes (ignores scheduling)
  async getCurrentWeeklyAssessmentForAdmin(): Promise<StandaloneWeeklyAssessment | null> {
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
        availableDate: doc.data().availableDate?.toDate(),
      } as StandaloneWeeklyAssessment;
    } catch (error) {
      console.error("Error getting current weekly assessment:", error);
      return null;
    }
  }

  // Get all previous weekly assessments
  async getPreviousWeeklyAssessments(): Promise<StandaloneWeeklyAssessment[]> {
    try {
      const q = query(
        collection(db, "weeklyAssessments"),
        where("isActive", "==", false),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StandaloneWeeklyAssessment[];
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
          isActive: false,
        });
      }
    } catch (error) {
      console.error("Error deactivating current assessment:", error);
      throw error;
    }
  }

  // Update assessment schedule
  async updateAssessmentSchedule(
    assessmentId: string,
    scheduleData: {
      startDate?: Date;
      endDate?: Date;
      isScheduled?: boolean;
      timeLimit?: number;
      totalQuestions?: number;
    }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (scheduleData.startDate !== undefined)
        updateData.startDate = scheduleData.startDate;
      if (scheduleData.endDate !== undefined)
        updateData.endDate = scheduleData.endDate;
      if (scheduleData.isScheduled !== undefined)
        updateData.isScheduled = scheduleData.isScheduled;
      if (scheduleData.timeLimit !== undefined)
        updateData.timeLimit = scheduleData.timeLimit;
      if (scheduleData.totalQuestions !== undefined)
        updateData.totalQuestions = scheduleData.totalQuestions;

      updateData.updatedAt = new Date();

      await updateDoc(doc(db, "weeklyAssessments", assessmentId), updateData);
      console.log("Assessment schedule updated:", assessmentId);
    } catch (error) {
      console.error("Error updating assessment schedule:", error);
      throw error;
    }
  }

  // Toggle master switch for immediate enable/disable
  async toggleMasterSwitch(
    assessmentId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "weeklyAssessments", assessmentId), {
        masterToggle: enabled,
        updatedAt: new Date(),
      });
      console.log(`Assessment ${assessmentId} master toggle set to:`, enabled);
    } catch (error) {
      console.error("Error toggling master switch:", error);
      throw error;
    }
  }

  // Check if assessment is currently available to students
  async isAssessmentAvailable(assessmentId: string): Promise<boolean> {
    try {
      const assessmentDoc = await getDoc(
        doc(db, "weeklyAssessments", assessmentId)
      );
      if (!assessmentDoc.exists()) return false;

      const assessment = assessmentDoc.data() as StandaloneWeeklyAssessment;

      // Check master toggle first
      if (!assessment.masterToggle) return false;

      // Check if assessment is active
      if (!assessment.isActive) return false;

      // If scheduled, check availability date
      if (assessment.isScheduled) {
        const now = new Date();
        if (assessment.availableDate && now < assessment.availableDate) return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking assessment availability:", error);
      return false;
    }
  }

  // Get all assessments with their availability status
  async getAllAssessmentsWithStatus(): Promise<
    (StandaloneWeeklyAssessment & { isAvailable: boolean })[]
  > {
    try {
      const q = query(
        collection(db, "weeklyAssessments"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const assessments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        availableDate: doc.data().availableDate?.toDate(),
      })) as StandaloneWeeklyAssessment[];

      // Add availability status to each assessment
      const assessmentsWithStatus = await Promise.all(
        assessments.map(async (assessment) => ({
          ...assessment,
          isAvailable: await this.isAssessmentAvailable(assessment.id),
        }))
      );

      return assessmentsWithStatus;
    } catch (error) {
      console.error("Error getting assessments with status:", error);
      return [];
    }
  }

  // Reactivate a previous assessment
  async reactivateAssessment(assessmentId: string): Promise<void> {
    try {
      // First deactivate current assessment
      await this.deactivateCurrentAssessment();

      // Then activate the selected assessment
      await updateDoc(doc(db, "weeklyAssessments", assessmentId), {
        isActive: true,
      });

      console.log("Assessment reactivated:", assessmentId);
    } catch (error) {
      console.error("Error reactivating assessment:", error);
      throw error;
    }
  }

  // Submit a weekly assessment attempt
  async submitWeeklyAssessmentAttempt(
    attempt: Omit<StandaloneAssessmentAttempt, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const attemptData: Omit<StandaloneAssessmentAttempt, "id"> = {
        ...attempt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(
        collection(db, "weeklyAssessmentAttempts"),
        attemptData
      );

      console.log("Weekly assessment attempt submitted:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error submitting weekly assessment attempt:", error);
      throw error;
    }
  }

  // Get user's attempt for current assessment
  async getUserAttemptForCurrentAssessment(
    userId: string
  ): Promise<StandaloneAssessmentAttempt | null> {
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
      } as StandaloneAssessmentAttempt;
    } catch (error) {
      console.error("Error getting user attempt:", error);
      return null;
    }
  }

  // Get weekly assessment stats
  async getWeeklyAssessmentStats(
    assessmentId: string
  ): Promise<StandaloneAssessmentStats> {
    try {
      const q = query(
        collection(db, "weeklyAssessmentAttempts"),
        where("assessmentId", "==", assessmentId),
        where("completed", "==", true)
      );

      const snapshot = await getDocs(q);
      const attempts = snapshot.docs.map((doc) => doc.data());

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
      const totalScore = attempts.reduce(
        (sum, attempt) => sum + (attempt.score || 0),
        0
      );
      const totalPercentage = attempts.reduce(
        (sum, attempt) => sum + (attempt.percentage || 0),
        0
      );
      const totalTimeSpent = attempts.reduce(
        (sum, attempt) => sum + (attempt.timeSpent || 0),
        0
      );
      const topScore = Math.max(
        ...attempts.map((attempt) => attempt.score || 0)
      );

      return {
        assessmentId,
        totalAttempts,
        averageScore: totalScore / totalAttempts,
        averagePercentage: totalPercentage / totalAttempts,
        averageTimeSpent: totalTimeSpent / totalAttempts / 60, // Convert to minutes
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
  async getWeeklyAssessmentLeaderboard(
    assessmentId?: string,
    limitCount: number = 20
  ): Promise<StandaloneAssessmentAttempt[]> {
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

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as StandaloneAssessmentAttempt[];
    } catch (error) {
      console.error("Error getting weekly assessment leaderboard:", error);
      return [];
    }
  }
}

export const weeklyAssessmentManager = WeeklyAssessmentManager.getInstance();
