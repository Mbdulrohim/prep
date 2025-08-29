// src/lib/standaloneRMExams.ts
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
  Timestamp,
} from "firebase/firestore";
import { RMQuestion } from "./rmExamData";

export interface StandaloneRMExam {
  id: string;
  title: string;
  description?: string;
  paper: 'A' | 'B' | 'C' | 'D';
  questions: RMQuestion[];
  timeLimit: number; // exam duration in minutes (e.g., 150)
  totalQuestions: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  // Payment and access control
  requiresPayment: boolean;
  price: number;
  currency: string;
  // Scheduling
  availableDate?: Date;
  examWindowMinutes?: number;
  isScheduled: boolean;
  masterToggle: boolean;
  // RM specific properties
  examType: "rm-exam";
  difficulty: 'easy' | 'medium' | 'hard';
  passingScore: number; // percentage required to pass
}

export interface StandaloneRMAttempt {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userUniversity: string;
  examId: string;
  examTitle: string;
  paper: 'A' | 'B' | 'C' | 'D';
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  isCompleted: boolean;
  submittedAt?: Date;
  // Payment verification
  hasPaidAccess: boolean;
  paymentReference?: string;
  accessGrantedAt?: Date;
  accessExpiresAt?: Date;
}

class StandaloneRMExamManager {
  private collection = collection(db, "standaloneRMExams");
  private attemptsCollection = collection(db, "standaloneRMAttempts");

  // Helper function to convert Firestore timestamps to dates
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  }

  // Create a new standalone RM exam
  async createStandaloneRMExam(examData: Omit<StandaloneRMExam, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newExam: StandaloneRMExam = {
        ...examData,
        id: `rm-${examData.paper}-${Date.now()}`,
        createdAt: new Date(),
      };

      await setDoc(doc(this.collection, newExam.id), newExam);
      console.log(`✅ Created standalone RM exam: ${newExam.id}`);
      return newExam.id;
    } catch (error) {
      console.error("Error creating standalone RM exam:", error);
      throw error;
    }
  }

  // Get all active RM exams
  async getActiveRMExams(): Promise<StandaloneRMExam[]> {
    try {
      const q = query(
        this.collection,
        where("isActive", "==", true),
        where("masterToggle", "==", true),
        orderBy("paper")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as StandaloneRMExam;
        return {
          ...data,
          createdAt: this.convertTimestamp(data.createdAt),
          availableDate: data.availableDate ? this.convertTimestamp(data.availableDate) : undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching active RM exams:", error);
      return [];
    }
  }

  // Get RM exam by ID
  async getRMExamById(examId: string): Promise<StandaloneRMExam | null> {
    try {
      const docRef = doc(this.collection, examId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as StandaloneRMExam;
        return {
          ...data,
          createdAt: this.convertTimestamp(data.createdAt),
          availableDate: data.availableDate ? this.convertTimestamp(data.availableDate) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching RM exam:", error);
      return null;
    }
  }

  // Get RM exams by paper
  async getRMExamsByPaper(paper: 'A' | 'B' | 'C' | 'D'): Promise<StandaloneRMExam[]> {
    try {
      const q = query(
        this.collection,
        where("paper", "==", paper),
        where("isActive", "==", true),
        where("masterToggle", "==", true),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data() as StandaloneRMExam,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        availableDate: doc.data().availableDate?.toDate(),
      }));
    } catch (error) {
      console.error("Error fetching RM exams by paper:", error);
      return [];
    }
  }

  // Check if user has paid access to RM exam
  async checkUserAccess(userId: string, examId: string): Promise<boolean> {
    try {
      const exam = await this.getRMExamById(examId);
      if (!exam) return false;

      // If exam doesn't require payment, allow access
      if (!exam.requiresPayment) return true;

      // Check if user has valid paid access
      const q = query(
        this.attemptsCollection,
        where("userId", "==", userId),
        where("examId", "==", examId),
        where("hasPaidAccess", "==", true)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return false;

      // Check if access hasn't expired
      const attempt = snapshot.docs[0].data() as StandaloneRMAttempt;
      if (attempt.accessExpiresAt) {
        const now = new Date();
        const expiresAt = this.convertTimestamp(attempt.accessExpiresAt);
        return now < expiresAt;
      }

      return true;
    } catch (error) {
      console.error("Error checking user access:", error);
      return false;
    }
  }

  // Grant paid access to user
  async grantUserAccess(
    userId: string, 
    userEmail: string, 
    userName: string, 
    userUniversity: string,
    examId: string,
    paymentReference: string,
    accessDurationDays: number = 30
  ): Promise<boolean> {
    try {
      const exam = await this.getRMExamById(examId);
      if (!exam) return false;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (accessDurationDays * 24 * 60 * 60 * 1000));

      const accessRecord: Partial<StandaloneRMAttempt> = {
        id: `access-${userId}-${examId}-${Date.now()}`,
        userId,
        userEmail,
        userName,
        userUniversity,
        examId,
        examTitle: exam.title,
        paper: exam.paper,
        hasPaidAccess: true,
        paymentReference,
        accessGrantedAt: now,
        accessExpiresAt: expiresAt,
        startTime: now,
        timeSpent: 0,
        score: 0,
        percentage: 0,
        totalQuestions: exam.totalQuestions,
        correctAnswers: 0,
        wrongAnswers: 0,
        unansweredQuestions: exam.totalQuestions,
        userAnswers: [],
        flaggedQuestions: [],
        isCompleted: false,
      };

      await setDoc(doc(this.attemptsCollection, accessRecord.id!), accessRecord);
      console.log(`✅ Granted RM access to user ${userId} for exam ${examId}`);
      return true;
    } catch (error) {
      console.error("Error granting user access:", error);
      return false;
    }
  }

  // Start RM exam attempt
  async startRMExamAttempt(
    userId: string,
    userEmail: string,
    userName: string,
    userUniversity: string,
    examId: string
  ): Promise<string | null> {
    try {
      // Check if user has access
      const hasAccess = await this.checkUserAccess(userId, examId);
      if (!hasAccess) {
        throw new Error("User does not have access to this exam");
      }

      const exam = await this.getRMExamById(examId);
      if (!exam) throw new Error("Exam not found");

      // Check if user already has an active attempt
      const existingAttempt = await this.getUserActiveAttempt(userId, examId);
      if (existingAttempt && !existingAttempt.isCompleted) {
        return existingAttempt.id;
      }

      const attemptId = `attempt-${userId}-${examId}-${Date.now()}`;
      const attempt: StandaloneRMAttempt = {
        id: attemptId,
        userId,
        userEmail,
        userName,
        userUniversity,
        examId,
        examTitle: exam.title,
        paper: exam.paper,
        startTime: new Date(),
        timeSpent: 0,
        score: 0,
        percentage: 0,
        totalQuestions: exam.totalQuestions,
        correctAnswers: 0,
        wrongAnswers: 0,
        unansweredQuestions: exam.totalQuestions,
        userAnswers: new Array(exam.totalQuestions).fill(null),
        flaggedQuestions: [],
        isCompleted: false,
        hasPaidAccess: true,
        paymentReference: "", // Will be updated from access record
      };

      await setDoc(doc(this.attemptsCollection, attemptId), attempt);
      console.log(`✅ Started RM exam attempt: ${attemptId}`);
      return attemptId;
    } catch (error) {
      console.error("Error starting RM exam attempt:", error);
      return null;
    }
  }

  // Get user's active attempt for an exam
  async getUserActiveAttempt(userId: string, examId: string): Promise<StandaloneRMAttempt | null> {
    try {
      const q = query(
        this.attemptsCollection,
        where("userId", "==", userId),
        where("examId", "==", examId),
        where("isCompleted", "==", false),
        orderBy("startTime", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as StandaloneRMAttempt;
      return {
        ...data,
        startTime: this.convertTimestamp(data.startTime),
        endTime: data.endTime ? this.convertTimestamp(data.endTime) : undefined,
        submittedAt: data.submittedAt ? this.convertTimestamp(data.submittedAt) : undefined,
        accessGrantedAt: data.accessGrantedAt ? this.convertTimestamp(data.accessGrantedAt) : undefined,
        accessExpiresAt: data.accessExpiresAt ? this.convertTimestamp(data.accessExpiresAt) : undefined,
      };
    } catch (error) {
      console.error("Error fetching user active attempt:", error);
      return null;
    }
  }

  // Submit RM exam attempt
  async submitRMExamAttempt(
    attemptId: string,
    userAnswers: (number | null)[],
    flaggedQuestions: number[],
    timeSpent: number
  ): Promise<boolean> {
    try {
      const attemptRef = doc(this.attemptsCollection, attemptId);
      const attemptSnap = await getDoc(attemptRef);

      if (!attemptSnap.exists()) {
        throw new Error("Attempt not found");
      }

      const attempt = attemptSnap.data() as StandaloneRMAttempt;
      const exam = await this.getRMExamById(attempt.examId);

      if (!exam) {
        throw new Error("Exam not found");
      }

      // Calculate score
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unansweredQuestions = 0;

      userAnswers.forEach((answer, index) => {
        if (answer === null) {
          unansweredQuestions++;
        } else if (answer === exam.questions[index]?.correctAnswer) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      });

      const score = correctAnswers;
      const percentage = (correctAnswers / exam.totalQuestions) * 100;

      // Update attempt
      await updateDoc(attemptRef, {
        endTime: new Date(),
        submittedAt: new Date(),
        timeSpent,
        userAnswers,
        flaggedQuestions,
        score,
        percentage,
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        isCompleted: true,
      });

      console.log(`✅ Submitted RM exam attempt: ${attemptId}`);
      return true;
    } catch (error) {
      console.error("Error submitting RM exam attempt:", error);
      return false;
    }
  }

  // Get user's exam history
  async getUserExamHistory(userId: string): Promise<StandaloneRMAttempt[]> {
    try {
      const q = query(
        this.attemptsCollection,
        where("userId", "==", userId),
        where("isCompleted", "==", true),
        orderBy("submittedAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as StandaloneRMAttempt;
        return {
          ...data,
          startTime: this.convertTimestamp(data.startTime),
          endTime: data.endTime ? this.convertTimestamp(data.endTime) : undefined,
          submittedAt: data.submittedAt ? this.convertTimestamp(data.submittedAt) : undefined,
          accessGrantedAt: data.accessGrantedAt ? this.convertTimestamp(data.accessGrantedAt) : undefined,
          accessExpiresAt: data.accessExpiresAt ? this.convertTimestamp(data.accessExpiresAt) : undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching user exam history:", error);
      return [];
    }
  }

  // Get leaderboard for a specific exam
  async getExamLeaderboard(examId: string, limit: number = 50): Promise<StandaloneRMAttempt[]> {
    try {
      const q = query(
        this.attemptsCollection,
        where("examId", "==", examId),
        where("isCompleted", "==", true),
        orderBy("percentage", "desc"),
        orderBy("timeSpent", "asc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data() as StandaloneRMAttempt;
        return {
          ...data,
          startTime: this.convertTimestamp(data.startTime),
          endTime: data.endTime ? this.convertTimestamp(data.endTime) : undefined,
          submittedAt: data.submittedAt ? this.convertTimestamp(data.submittedAt) : undefined,
          accessGrantedAt: data.accessGrantedAt ? this.convertTimestamp(data.accessGrantedAt) : undefined,
          accessExpiresAt: data.accessExpiresAt ? this.convertTimestamp(data.accessExpiresAt) : undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching exam leaderboard:", error);
      return [];
    }
  }

  // Update exam status (admin function)
  async updateExamStatus(examId: string, isActive: boolean, masterToggle: boolean): Promise<boolean> {
    try {
      const examRef = doc(this.collection, examId);
      await updateDoc(examRef, {
        isActive,
        masterToggle,
      });

      console.log(`✅ Updated exam ${examId} status: active=${isActive}, toggle=${masterToggle}`);
      return true;
    } catch (error) {
      console.error("Error updating exam status:", error);
      return false;
    }
  }

  // Update entire exam (admin function)
  async updateStandaloneRMExam(examId: string, updates: Partial<StandaloneRMExam>): Promise<boolean> {
    try {
      const examRef = doc(this.collection, examId);
      // Remove id and createdAt from updates to prevent overwriting them
      const { id, createdAt, ...allowedUpdates } = updates;
      
      await updateDoc(examRef, allowedUpdates);
      console.log(`✅ Updated exam ${examId}`);
      return true;
    } catch (error) {
      console.error("Error updating exam:", error);
      return false;
    }
  }
}

// Export singleton instance
export const standaloneRMExamManager = new StandaloneRMExamManager();
