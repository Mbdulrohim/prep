"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Define the structure of your data
interface ExamAttempt {
  id: string;
  userId: string;
  examType: string;
  score: number;
  completedAt: { toDate: () => Date };
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
}

// Define the structure of the calculated stats
interface UserStats {
  totalExamsCompleted: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number; // Placeholder for now
  totalTimeSpent: number;
}

interface ExamProgress {
  examType: string;
  name: string;
  progress: number;
  completed: boolean;
  bestScore: number;
  attemptsCount: number;
  isUnlocked: boolean;
  lastAttempt: Date | null;
}

export interface RecentActivity {
  id: string;
  type: "exam" | "purchase" | "achievement";
  description: string;
  timestamp: Date;
  score?: number;
  examName?: string;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [examProgress, setExamProgress] = useState<ExamProgress[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refreshData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const attemptsRef = collection(db, "examAttempts");
      const q = query(
        attemptsRef,
        where("userId", "==", user.uid),
        orderBy("completedAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const attempts: ExamAttempt[] = [];
      querySnapshot.forEach((doc) => {
        attempts.push({ id: doc.id, ...doc.data() } as ExamAttempt);
      });

      // --- Calculate Overall Stats ---
      const completedAttempts = attempts.filter((a) => a.score !== undefined);
      if (completedAttempts.length > 0) {
        const totalScore = completedAttempts.reduce(
          (sum, a) => sum + a.score,
          0
        );
        const bestScore = Math.max(...completedAttempts.map((a) => a.score));
        const totalTimeMinutes = Math.round(
          completedAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / 60
        );

        setStats({
          totalExamsCompleted: completedAttempts.length,
          averageScore: totalScore / completedAttempts.length,
          bestScore: bestScore,
          currentStreak: 0, // Implement streak logic later
          totalTimeSpent: totalTimeMinutes,
        });
      } else {
        setStats({
          totalExamsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          currentStreak: 0,
          totalTimeSpent: 0,
        });
      }

      // --- Calculate Progress Per Exam Type ---
      const progressMap = new Map<string, ExamProgress>();
      // Define your exams here
      const examTypes = [
        { id: "rn-paper-1", name: "RN Paper 1" },
        { id: "rn-paper-2", name: "RN Paper 2" },
        { id: "rm", name: "Registered Midwifery" },
        { id: "rphn", name: "Public Health Nursing" },
      ];

      examTypes.forEach((exam) => {
        const attemptsForExam = completedAttempts.filter(
          (a) => a.examType === exam.id
        );
        const bestScore =
          attemptsForExam.length > 0
            ? Math.max(...attemptsForExam.map((a) => a.score))
            : 0;

        progressMap.set(exam.id, {
          examType: exam.id,
          name: exam.name,
          progress: bestScore, // Simple progress based on best score
          completed: bestScore > 0,
          bestScore: bestScore,
          attemptsCount: attemptsForExam.length,
          isUnlocked: true, // Add unlock logic later
          lastAttempt:
            attemptsForExam.length > 0 && attemptsForExam[0].completedAt && typeof attemptsForExam[0].completedAt.toDate === 'function'
              ? attemptsForExam[0].completedAt.toDate()
              : null,
        });
      });
      setExamProgress(Array.from(progressMap.values()));

      // --- Set Recent Activity ---
      // Set the recent activity data
      setRecentActivity(
        completedAttempts.slice(0, 5).map((a) => ({
          id: a.id,
          type: "exam" as const,
          description: `Completed ${a.examType} exam`,
          timestamp: a.completedAt && typeof a.completedAt.toDate === 'function' 
            ? a.completedAt.toDate() 
            : new Date(),
          score: a.score,
          examName: a.examType,
        }))
      );
    } catch (e) {
      console.error("Error fetching user stats:", e);
      setError("Could not load your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { stats, examProgress, recentActivity, loading, error, refreshData };
}
