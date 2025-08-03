// src/lib/standaloneWeeklyAssessments.ts
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
  description?: string;
  questions: ParsedQuestion[];
  timeLimit: number; // exam duration in minutes (e.g., 90)
  totalQuestions: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  // Simplified scheduling - timed exam window
  availableDate?: Date; // When exam window opens (if scheduled)
  examWindowMinutes?: number; // Total window duration (e.g., 100 = 90 exam + 10 buffer)
  isScheduled: boolean;
  masterToggle: boolean;
  // Standalone properties - NO exam category links
  assessmentType: "weekly-assessment"; // Always this value
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
  timeSpent: number;
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
  averageTimeSpent: number;
  topScore: number;
  completionRate: number;
  lastUpdated: Date;
}

class StandaloneWeeklyAssessmentManager {
  private static instance: StandaloneWeeklyAssessmentManager;

  static getInstance(): StandaloneWeeklyAssessmentManager {
    if (!StandaloneWeeklyAssessmentManager.instance) {
      StandaloneWeeklyAssessmentManager.instance =
        new StandaloneWeeklyAssessmentManager();
    }
    return StandaloneWeeklyAssessmentManager.instance;
  }

  // Create a new standalone weekly assessment
  async createStandaloneAssessment(
    title: string,
    description: string | undefined,
    questions: ParsedQuestion[],
    createdBy: string,
    options?: {
      timeLimit?: number; // exam duration (default 90)
      examWindowMinutes?: number; // total window (default 100)
      totalQuestions?: number;
      availableDate?: Date;
      isActive?: boolean;
      masterToggle?: boolean;
    }
  ): Promise<string> {
    try {
      // First, deactivate any current active assessment
      await this.deactivateCurrentAssessment();

      const timeLimit = options?.timeLimit || 90; // exam duration
      const examWindowMinutes = options?.examWindowMinutes || 100; // total window
      const totalQuestions =
        options?.totalQuestions || Math.min(questions.length, 150);
      const selectedQuestions = questions.slice(0, totalQuestions);

      // Validate questions array doesn't contain undefined elements
      const hasUndefinedQuestions = selectedQuestions.some(q => q === undefined || q === null);
      if (hasUndefinedQuestions) {
        console.error("ERROR: Questions array contains undefined elements:", selectedQuestions);
        throw new Error("Questions array contains undefined elements");
      }

      // Validate each question has required fields
      selectedQuestions.forEach((question, index) => {
        if (!question.id || !question.text || !question.options || question.correctAnswer === undefined) {
          console.error(`Invalid question at index ${index}:`, question);
          throw new Error(`Question at index ${index} is missing required fields`);
        }
      });

      const assessmentData: Omit<StandaloneWeeklyAssessment, "id"> = {
        title: title,
        description: description || "", // Handle undefined by using empty string
        questions: selectedQuestions,
        timeLimit: timeLimit,
        totalQuestions: totalQuestions,
        isActive: options?.isActive ?? false,
        createdAt: new Date(),
        createdBy: createdBy,
        isScheduled: Boolean(options?.availableDate),
        masterToggle: options?.masterToggle ?? true,
        assessmentType: "weekly-assessment",
        examWindowMinutes: examWindowMinutes,
      };

      // Clean the data to remove any undefined values before sending to Firebase
      const cleanAssessmentData: any = {};
      
      // Debug: Log the raw assessment data first
      console.log("Raw assessment data before cleaning:", assessmentData);
      console.log("Options provided:", options);
      
      // Only add defined values with explicit validation and logging
      if (assessmentData.title) {
        cleanAssessmentData.title = assessmentData.title;
        console.log("✓ Added title:", assessmentData.title);
      }
      if (assessmentData.description !== undefined) {
        cleanAssessmentData.description = assessmentData.description;
        console.log("✓ Added description:", assessmentData.description);
      }
      if (assessmentData.questions) {
        // Clean questions array to ensure Firebase compatibility
        const cleanQuestions = assessmentData.questions.map((q: any, index: number) => {
          const cleanQuestion: any = {};
          
          // Only add defined fields to each question
          if (q.id !== undefined) cleanQuestion.id = q.id;
          if (q.text !== undefined) cleanQuestion.text = q.text;
          if (q.options !== undefined) cleanQuestion.options = q.options;
          if (q.correctAnswer !== undefined) cleanQuestion.correctAnswer = q.correctAnswer;
          if (q.explanation !== undefined) cleanQuestion.explanation = q.explanation;
          if (q.category !== undefined) cleanQuestion.category = q.category;
          if (q.difficulty !== undefined) cleanQuestion.difficulty = q.difficulty;
          
          // Check for undefined values in this question
          const undefinedInQuestion = Object.entries(cleanQuestion).filter(([key, value]) => value === undefined);
          if (undefinedInQuestion.length > 0) {
            console.error(`🚨 Question ${index} has undefined fields:`, undefinedInQuestion);
          }
          
          return cleanQuestion;
        });
        
        cleanAssessmentData.questions = cleanQuestions;
        console.log("✓ Added questions:", cleanQuestions.length, "questions (cleaned)");
      }
      if (assessmentData.timeLimit) {
        cleanAssessmentData.timeLimit = assessmentData.timeLimit;
        console.log("✓ Added timeLimit:", assessmentData.timeLimit);
      }
      if (assessmentData.totalQuestions) {
        cleanAssessmentData.totalQuestions = assessmentData.totalQuestions;
        console.log("✓ Added totalQuestions:", assessmentData.totalQuestions);
      }
      if (assessmentData.isActive !== undefined) {
        cleanAssessmentData.isActive = assessmentData.isActive;
        console.log("✓ Added isActive:", assessmentData.isActive);
      }
      if (assessmentData.createdAt) {
        cleanAssessmentData.createdAt = assessmentData.createdAt;
        console.log("✓ Added createdAt:", assessmentData.createdAt);
      }
      if (assessmentData.createdBy) {
        cleanAssessmentData.createdBy = assessmentData.createdBy;
        console.log("✓ Added createdBy:", assessmentData.createdBy);
      }
      if (assessmentData.isScheduled !== undefined) {
        cleanAssessmentData.isScheduled = assessmentData.isScheduled;
        console.log("✓ Added isScheduled:", assessmentData.isScheduled);
      }
      if (assessmentData.masterToggle !== undefined) {
        cleanAssessmentData.masterToggle = assessmentData.masterToggle;
        console.log("✓ Added masterToggle:", assessmentData.masterToggle);
      }
      if (assessmentData.assessmentType) {
        cleanAssessmentData.assessmentType = assessmentData.assessmentType;
        console.log("✓ Added assessmentType:", assessmentData.assessmentType);
      }
      if (assessmentData.examWindowMinutes) {
        cleanAssessmentData.examWindowMinutes = assessmentData.examWindowMinutes;
        console.log("✓ Added examWindowMinutes:", assessmentData.examWindowMinutes);
      }

      // Only add availableDate if it's defined
      if (options?.availableDate) {
        cleanAssessmentData.availableDate = options.availableDate;
        console.log("✓ Added availableDate:", options.availableDate);
      }

      console.log("Final clean assessment data being saved:", cleanAssessmentData);
      
      // Final safety check - check for undefined values
      const undefinedFields = Object.entries(cleanAssessmentData).filter(([key, value]) => value === undefined);
      if (undefinedFields.length > 0) {
        console.error("🚨 ERROR: Found undefined fields:", undefinedFields);
        throw new Error(`Cannot save data with undefined fields: ${undefinedFields.map(([key]) => key).join(', ')}`);
      }

      // Additional debugging - check for nested undefined values in questions array
      if (cleanAssessmentData.questions && Array.isArray(cleanAssessmentData.questions)) {
        console.log("🔍 Checking questions array for undefined values...");
        cleanAssessmentData.questions.forEach((question: any, index: number) => {
          Object.entries(question).forEach(([key, value]) => {
            if (value === undefined) {
              console.error(`🚨 Found undefined value in question ${index}, field: ${key}`);
            }
          });
        });
      }

      // Check for invalid date objects
      if (cleanAssessmentData.createdAt && !(cleanAssessmentData.createdAt instanceof Date)) {
        console.error("🚨 createdAt is not a valid Date object:", cleanAssessmentData.createdAt);
      }
      if (cleanAssessmentData.availableDate && !(cleanAssessmentData.availableDate instanceof Date)) {
        console.error("🚨 availableDate is not a valid Date object:", cleanAssessmentData.availableDate);
      }

      // Log all field types for debugging
      console.log("🔍 Field types before Firebase save:");
      Object.entries(cleanAssessmentData).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = ${value}`);
      });

      console.log("🔍 About to call addDoc with collection: standaloneWeeklyAssessments");
      
      let docRef;
      try {
        docRef = await addDoc(
          collection(db, "standaloneWeeklyAssessments"),
          cleanAssessmentData
        );
        console.log("✅ Successfully created document with ID:", docRef.id);
      } catch (firebaseError: any) {
        console.error("🚨 Firebase addDoc error details:");
        console.error("Error code:", firebaseError.code);
        console.error("Error message:", firebaseError.message);
        console.error("Error stack:", firebaseError.stack);
        console.error("Data that caused the error:", JSON.stringify(cleanAssessmentData, null, 2));
        throw firebaseError;
      }

      console.log("Standalone weekly assessment created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating standalone weekly assessment:", error);
      throw error;
    }
  }

  // Get the current active standalone weekly assessment
  async getCurrentStandaloneAssessment(): Promise<StandaloneWeeklyAssessment | null> {
    try {
      const q = query(
        collection(db, "standaloneWeeklyAssessments"),
        where("isActive", "==", true),
        where("masterToggle", "==", true),
        where("assessmentType", "==", "weekly-assessment"),
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

      // Check if assessment is currently available based on timed window
      if (assessment.isScheduled && assessment.availableDate) {
        const availabilityInfo = await this.getAssessmentAvailabilityInfo(assessment.id);
        if (!availabilityInfo.isAvailable) return null;
      }

      return assessment;
    } catch (error) {
      console.error(
        "Error getting current standalone weekly assessment:",
        error
      );
      return null;
    }
  }

  // Get current assessment for admin (ignores scheduling)
  async getCurrentAssessmentForAdmin(): Promise<StandaloneWeeklyAssessment | null> {
    try {
      const q = query(
        collection(db, "standaloneWeeklyAssessments"),
        where("isActive", "==", true),
        where("assessmentType", "==", "weekly-assessment"),
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
      console.error("Error getting current assessment for admin:", error);
      return null;
    }
  }

  // Get all previous standalone assessments
  async getPreviousStandaloneAssessments(): Promise<
    StandaloneWeeklyAssessment[]
  > {
    try {
      const q = query(
        collection(db, "standaloneWeeklyAssessments"),
        where("assessmentType", "==", "weekly-assessment"),
        where("isActive", "==", false),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        availableDate: doc.data().availableDate?.toDate(),
      })) as StandaloneWeeklyAssessment[];
    } catch (error) {
      console.error("Error getting previous standalone assessments:", error);
      return [];
    }
  }

  // Deactivate current assessment
  async deactivateCurrentAssessment(): Promise<void> {
    try {
      const current = await this.getCurrentAssessmentForAdmin();
      if (current) {
        await updateDoc(doc(db, "standaloneWeeklyAssessments", current.id), {
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
      description?: string;
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
      if (scheduleData.description !== undefined)
        updateData.description = scheduleData.description;

      updateData.updatedAt = new Date();

      await updateDoc(
        doc(db, "standaloneWeeklyAssessments", assessmentId),
        updateData
      );
      console.log("Assessment schedule updated:", assessmentId);
    } catch (error) {
      console.error("Error updating assessment schedule:", error);
      throw error;
    }
  }

  // Toggle master switch
  async toggleMasterSwitch(
    assessmentId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "standaloneWeeklyAssessments", assessmentId), {
        masterToggle: enabled,
        updatedAt: new Date(),
      });
      console.log(`Assessment ${assessmentId} master toggle set to:`, enabled);
    } catch (error) {
      console.error("Error toggling master switch:", error);
      throw error;
    }
  }

  // Check if assessment is available and calculate remaining time
  async getAssessmentAvailabilityInfo(assessmentId: string): Promise<{
    isAvailable: boolean;
    remainingTimeMinutes: number;
    windowStatus: "not-started" | "active" | "closing-soon" | "closed";
    examDuration: number;
  }> {
    try {
      const assessmentDoc = await getDoc(
        doc(db, "standaloneWeeklyAssessments", assessmentId)
      );
      if (!assessmentDoc.exists()) {
        return {
          isAvailable: false,
          remainingTimeMinutes: 0,
          windowStatus: "closed",
          examDuration: 90,
        };
      }

      const assessment = assessmentDoc.data() as StandaloneWeeklyAssessment;

      // Check master toggle and active status
      if (!assessment.masterToggle || !assessment.isActive) {
        return {
          isAvailable: false,
          remainingTimeMinutes: 0,
          windowStatus: "closed",
          examDuration: assessment.timeLimit,
        };
      }

      // If not scheduled, it's always available with full time
      if (!assessment.isScheduled || !assessment.availableDate) {
        return {
          isAvailable: true,
          remainingTimeMinutes: assessment.timeLimit,
          windowStatus: "active",
          examDuration: assessment.timeLimit,
        };
      }

      const now = new Date();
      const examStart = assessment.availableDate;
      const examWindowMinutes = assessment.examWindowMinutes || 100;
      const examEnd = new Date(
        examStart.getTime() + examWindowMinutes * 60 * 1000
      );

      // Check if exam window hasn't started yet
      if (now < examStart) {
        return {
          isAvailable: false,
          remainingTimeMinutes: 0,
          windowStatus: "not-started",
          examDuration: assessment.timeLimit,
        };
      }

      // Check if exam window has ended
      if (now > examEnd) {
        return {
          isAvailable: false,
          remainingTimeMinutes: 0,
          windowStatus: "closed",
          examDuration: assessment.timeLimit,
        };
      }

      // Calculate remaining time in the window
      const elapsedMinutes = Math.floor(
        (now.getTime() - examStart.getTime()) / (60 * 1000)
      );
      const windowRemainingMinutes = examWindowMinutes - elapsedMinutes;

      // Student gets the minimum of: exam duration OR remaining window time
      const availableTimeForStudent = Math.min(
        assessment.timeLimit,
        windowRemainingMinutes
      );

      // Determine window status
      let windowStatus: "active" | "closing-soon" = "active";
      if (windowRemainingMinutes <= 15) {
        // Last 15 minutes
        windowStatus = "closing-soon";
      }

      return {
        isAvailable: availableTimeForStudent > 0,
        remainingTimeMinutes: Math.max(0, availableTimeForStudent),
        windowStatus,
        examDuration: assessment.timeLimit,
      };
    } catch (error) {
      console.error("Error checking assessment availability info:", error);
      return {
        isAvailable: false,
        remainingTimeMinutes: 0,
        windowStatus: "closed",
        examDuration: 90,
      };
    }
  }

  // Check if assessment is available (simplified version)
  async isAssessmentAvailable(assessmentId: string): Promise<boolean> {
    const info = await this.getAssessmentAvailabilityInfo(assessmentId);
    return info.isAvailable;
  }

  // Get formatted exam window info for display
  async getExamWindowDisplayInfo(assessmentId: string): Promise<{
    status: string;
    timeInfo: string;
    canStart: boolean;
    availableMinutes: number;
  }> {
    const info = await this.getAssessmentAvailabilityInfo(assessmentId);
    
    let status = "";
    let timeInfo = "";
    
    switch (info.windowStatus) {
      case 'not-started':
        status = "Not Started";
        timeInfo = "Exam window has not opened yet";
        break;
      case 'active':
        status = "Available";
        timeInfo = `${info.remainingTimeMinutes} minutes available`;
        break;
      case 'closing-soon':
        status = "Closing Soon";
        timeInfo = `Only ${info.remainingTimeMinutes} minutes left!`;
        break;
      case 'closed':
        status = "Closed";
        timeInfo = "Exam window has ended";
        break;
    }

    return {
      status,
      timeInfo,
      canStart: info.isAvailable && info.remainingTimeMinutes > 0,
      availableMinutes: info.remainingTimeMinutes
    };
  }

  // Get all assessments with status
  async getAllAssessmentsWithStatus(): Promise<
    (StandaloneWeeklyAssessment & { isAvailable: boolean })[]
  > {
    try {
      const q = query(
        collection(db, "standaloneWeeklyAssessments"),
        where("assessmentType", "==", "weekly-assessment"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const assessments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        availableDate: doc.data().availableDate?.toDate(),
      })) as StandaloneWeeklyAssessment[];

      // Add availability status
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

  // Submit assessment attempt
  async submitStandaloneAssessmentAttempt(
    attempt: Omit<StandaloneAssessmentAttempt, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const attemptData: Omit<StandaloneAssessmentAttempt, "id"> = {
        ...attempt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(
        collection(db, "standaloneAssessmentAttempts"),
        attemptData
      );

      console.log("Standalone assessment attempt submitted:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error submitting standalone assessment attempt:", error);
      throw error;
    }
  }

  // Get user's attempt for current assessment
  async getUserAttemptForCurrentAssessment(
    userId: string
  ): Promise<StandaloneAssessmentAttempt | null> {
    try {
      const currentAssessment = await this.getCurrentStandaloneAssessment();
      if (!currentAssessment) return null;

      const q = query(
        collection(db, "standaloneAssessmentAttempts"),
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

  // Get specific attempt by ID for review (with permission check)
  async getStandaloneAssessmentAttemptForReview(
    attemptId: string,
    userId: string
  ): Promise<StandaloneAssessmentAttempt | null> {
    try {
      const attemptDoc = await getDoc(
        doc(db, "standaloneAssessmentAttempts", attemptId)
      );

      if (!attemptDoc.exists()) {
        return null;
      }

      const attemptData = attemptDoc.data();

      // Security check - user can only view their own attempts
      if (attemptData.userId !== userId) {
        console.error("Access denied: User trying to access another user's attempt");
        return null;
      }

      return {
        id: attemptDoc.id,
        ...attemptData,
        startTime: attemptData.startTime?.toDate() || new Date(),
        endTime: attemptData.endTime?.toDate(),
        createdAt: attemptData.createdAt?.toDate() || new Date(),
        updatedAt: attemptData.updatedAt?.toDate() || new Date(),
      } as StandaloneAssessmentAttempt;
    } catch (error) {
      console.error("Error getting attempt for review:", error);
      return null;
    }
  }

  // Get assessment by ID (for review purposes)
  async getStandaloneAssessmentById(
    assessmentId: string
  ): Promise<StandaloneWeeklyAssessment | null> {
    try {
      const assessmentDoc = await getDoc(
        doc(db, "standaloneWeeklyAssessments", assessmentId)
      );

      if (!assessmentDoc.exists()) {
        return null;
      }

      return {
        id: assessmentDoc.id,
        ...assessmentDoc.data(),
        createdAt: assessmentDoc.data().createdAt?.toDate() || new Date(),
        availableDate: assessmentDoc.data().availableDate?.toDate(),
      } as StandaloneWeeklyAssessment;
    } catch (error) {
      console.error("Error getting assessment by ID:", error);
      return null;
    }
  }

  // Get assessment stats
  async getStandaloneAssessmentStats(
    assessmentId: string
  ): Promise<StandaloneAssessmentStats> {
    try {
      const q = query(
        collection(db, "standaloneAssessmentAttempts"),
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
      console.error("Error getting standalone assessment stats:", error);
      throw error;
    }
  }

  // Get leaderboard
  async getStandaloneAssessmentLeaderboard(
    assessmentId?: string,
    limitCount: number = 20
  ): Promise<StandaloneAssessmentAttempt[]> {
    try {
      let targetAssessmentId = assessmentId;

      if (!targetAssessmentId) {
        const currentAssessment = await this.getCurrentStandaloneAssessment();
        if (!currentAssessment) return [];
        targetAssessmentId = currentAssessment.id;
      }

      const q = query(
        collection(db, "standaloneAssessmentAttempts"),
        where("assessmentId", "==", targetAssessmentId),
        where("completed", "==", true),
        orderBy("percentage", "desc"),
        orderBy("timeSpent", "asc"),
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
      console.error("Error getting standalone assessment leaderboard:", error);
      return [];
    }
  }

  // Reactivate a previous assessment
  async reactivateStandaloneAssessment(assessmentId: string): Promise<void> {
    try {
      // First deactivate current assessment
      await this.deactivateCurrentAssessment();

      // Then activate the selected assessment
      await updateDoc(doc(db, "standaloneWeeklyAssessments", assessmentId), {
        isActive: true,
        masterToggle: true,
      });

      console.log("Standalone assessment reactivated:", assessmentId);
    } catch (error) {
      console.error("Error reactivating standalone assessment:", error);
      throw error;
    }
  }
}

export const standaloneWeeklyAssessmentManager =
  StandaloneWeeklyAssessmentManager.getInstance();
