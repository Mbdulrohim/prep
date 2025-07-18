// src/lib/examSchedule.ts
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

export interface ExamSchedule {
  id: string;
  examType: "RN" | "RM" | "RPHN";
  paper: "paper1" | "paper2";
  scheduledDate: Date | null;
  isActive: boolean;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ExamScheduleManager {
  private static instance: ExamScheduleManager;

  static getInstance(): ExamScheduleManager {
    if (!ExamScheduleManager.instance) {
      ExamScheduleManager.instance = new ExamScheduleManager();
    }
    return ExamScheduleManager.instance;
  }

  // Initialize default exam schedules
  async initializeDefaultSchedules(): Promise<void> {
    const examTypes = ["RN", "RM", "RPHN"] as const;
    const papers = ["paper1", "paper2"] as const;

    for (const examType of examTypes) {
      for (const paper of papers) {
        const scheduleId = `${examType}_${paper}`;
        const existingSchedule = await this.getSchedule(scheduleId);
        
        if (!existingSchedule) {
          const schedule: ExamSchedule = {
            id: scheduleId,
            examType,
            paper,
            scheduledDate: null, // Will be set by admin
            isActive: false,
            duration: 120, // 2 hours
            totalQuestions: 50,
            passingScore: 70,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await setDoc(doc(db, "examSchedules", scheduleId), schedule);
        }
      }
    }
  }

  // Get schedule for specific exam
  async getSchedule(scheduleId: string): Promise<ExamSchedule | null> {
    const scheduleDoc = await getDoc(doc(db, "examSchedules", scheduleId));
    if (scheduleDoc.exists()) {
      const data = scheduleDoc.data();
      return {
        ...data,
        scheduledDate: data.scheduledDate ? (data.scheduledDate.toDate ? data.scheduledDate.toDate() : new Date(data.scheduledDate)) : null,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as ExamSchedule;
    }
    return null;
  }

  // Get all schedules
  async getAllSchedules(): Promise<ExamSchedule[]> {
    const schedulesCollection = collection(db, "examSchedules");
    const snapshot = await getDocs(schedulesCollection);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        scheduledDate: data.scheduledDate ? (data.scheduledDate.toDate ? data.scheduledDate.toDate() : new Date(data.scheduledDate)) : null,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as ExamSchedule;
    });
  }

  // Update exam schedule (admin only)
  async updateSchedule(
    scheduleId: string,
    updates: Partial<Pick<ExamSchedule, 'scheduledDate' | 'isActive' | 'duration' | 'totalQuestions' | 'passingScore'>>
  ): Promise<void> {
    await updateDoc(doc(db, "examSchedules", scheduleId), {
      ...updates,
      updatedAt: new Date()
    });
  }

  // Check if exam is available for taking
  async isExamAvailable(examType: string, paper: string): Promise<boolean> {
    const scheduleId = `${examType}_${paper}`;
    const schedule = await this.getSchedule(scheduleId);
    
    if (!schedule || !schedule.isActive || !schedule.scheduledDate) {
      return false;
    }

    const now = new Date();
    return now >= schedule.scheduledDate;
  }

  // Get exam status message
  async getExamStatusMessage(examType: string, paper: string): Promise<string> {
    const scheduleId = `${examType}_${paper}`;
    const schedule = await this.getSchedule(scheduleId);
    
    if (!schedule) {
      return "Exam schedule not found";
    }

    if (!schedule.isActive) {
      return "Exam is currently inactive";
    }

    if (!schedule.scheduledDate) {
      return "Exam date not set yet - Check back later";
    }

    const now = new Date();
    if (now < schedule.scheduledDate) {
      return `Exam scheduled for ${schedule.scheduledDate.toLocaleDateString()}`;
    }

    return "Exam is available now";
  }
}

export const examScheduleManager = ExamScheduleManager.getInstance();
