// src/hooks/useRealTimeData.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  Unsubscribe,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Real-time data interfaces
export interface RealTimeExamAttempt {
  id: string;
  userId: string;
  userName: string;
  userUniversity: string;
  examId: string;
  examCategory: string;
  score: number;
  percentage: number;
  completed: boolean;
  submitted: boolean;
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
}

export interface RealTimeStats {
  totalUsers: number;
  totalAttempts: number;
  totalCompleted: number;
  averageScore: number;
  activeNow: number;
  recentActivity: RealTimeActivity[];
}

export interface RealTimeActivity {
  id: string;
  type: 'exam_completed' | 'exam_started' | 'user_registered' | 'payment_made';
  userId: string;
  userName: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface RealTimeLeaderboard {
  userId: string;
  userName: string;
  university: string;
  totalScore: number;
  totalAttempts: number;
  averageScore: number;
  rank: number;
  latestExam: Date;
}

export interface RealTimeUserData {
  // User specific real-time data
  attempts: RealTimeExamAttempt[];
  stats: {
    totalExams: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    totalTimeSpent: number;
  };
  recentActivity: RealTimeActivity[];
  position: {
    overallRank: number;
    universityRank: number;
    categoryRanks: { [key: string]: number };
  };
}

// Main real-time data hook
export function useRealTimeData() {
  const { user } = useAuth();
  
  // State for different data types
  const [globalStats, setGlobalStats] = useState<RealTimeStats | null>(null);
  const [userStats, setUserStats] = useState<RealTimeUserData | null>(null);
  const [leaderboard, setLeaderboard] = useState<RealTimeLeaderboard[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RealTimeExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cleanup refs
  const unsubscribers = useRef<Unsubscribe[]>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    unsubscribers.current.forEach((unsubscribe: Unsubscribe) => unsubscribe());
    unsubscribers.current = [];
  }, []);

  // Global stats listener
  const setupGlobalStatsListener = useCallback(() => {
    const attemptsQuery = query(
      collection(db, "examAttempts"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(attemptsQuery, (snapshot) => {
      try {
        const attempts: RealTimeExamAttempt[] = [];
        const userIds = new Set();
        let totalScore = 0;
        let completedCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const attempt: RealTimeExamAttempt = {
            id: doc.id,
            userId: data.userId,
            userName: data.userName || 'Unknown',
            userUniversity: data.userUniversity || 'Unknown',
            examId: data.examId,
            examCategory: data.examCategory,
            score: data.score || 0,
            percentage: data.percentage || 0,
            completed: data.completed || false,
            submitted: data.submitted || false,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate(),
            timeSpent: data.timeSpent || 0,
          };
          
          attempts.push(attempt);
          userIds.add(data.userId);
          
          if (attempt.completed) {
            totalScore += attempt.score;
            completedCount++;
          }
        });

        const recentActivity: RealTimeActivity[] = attempts
          .filter(attempt => attempt.completed)
          .slice(0, 10)
          .map(attempt => ({
            id: attempt.id,
            type: 'exam_completed' as const,
            userId: attempt.userId,
            userName: attempt.userName,
            description: `Completed ${attempt.examCategory} exam with ${attempt.percentage}%`,
            timestamp: attempt.endTime || attempt.startTime,
            metadata: {
              examId: attempt.examId,
              score: attempt.score,
              percentage: attempt.percentage,
            }
          }));

        setGlobalStats({
          totalUsers: userIds.size,
          totalAttempts: attempts.length,
          totalCompleted: completedCount,
          averageScore: completedCount > 0 ? totalScore / completedCount : 0,
          activeNow: attempts.filter(a => !a.completed && 
            new Date().getTime() - a.startTime.getTime() < 3 * 60 * 60 * 1000).length,
          recentActivity,
        });

        setRecentAttempts(attempts.slice(0, 20));
      } catch (error) {
        console.error('Error processing global stats:', error);
        setError('Failed to load global statistics');
      }
    });

    return unsubscribe;
  }, []);

  // User-specific stats listener
  const setupUserStatsListener = useCallback(() => {
    if (!user?.uid) return null;

    // Remove orderBy to avoid index requirement - sort on client side
    const userAttemptsQuery = query(
      collection(db, "examAttempts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(userAttemptsQuery, (snapshot) => {
      try {
        const attempts: RealTimeExamAttempt[] = [];
        let totalScore = 0;
        let bestScore = 0;
        let totalTimeSpent = 0;
        let completedCount = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const attempt: RealTimeExamAttempt = {
            id: doc.id,
            userId: data.userId,
            userName: data.userName || 'Unknown',
            userUniversity: data.userUniversity || 'Unknown',
            examId: data.examId,
            examCategory: data.examCategory,
            score: data.score || 0,
            percentage: data.percentage || 0,
            completed: data.completed || false,
            submitted: data.submitted || false,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate(),
            timeSpent: data.timeSpent || 0,
          };
          
          attempts.push(attempt);
          
          if (attempt.completed) {
            totalScore += attempt.score;
            totalTimeSpent += attempt.timeSpent;
            completedCount++;
            if (attempt.score > bestScore) {
              bestScore = attempt.score;
            }
          }
        });

        // Sort attempts by startTime descending (client-side to avoid index requirement)
        attempts.sort((a, b) => {
          const aDate = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
          const bDate = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
          return bDate.getTime() - aDate.getTime();
        });

        const recentActivity: RealTimeActivity[] = attempts
          .filter(attempt => attempt.completed)
          .slice(0, 5)
          .map(attempt => ({
            id: attempt.id,
            type: 'exam_completed' as const,
            userId: attempt.userId,
            userName: attempt.userName,
            description: `You completed ${attempt.examCategory} exam`,
            timestamp: attempt.endTime || attempt.startTime,
            metadata: {
              examId: attempt.examId,
              score: attempt.score,
              percentage: attempt.percentage,
            }
          }));

        setUserStats({
          attempts,
          stats: {
            totalExams: completedCount,
            averageScore: completedCount > 0 ? totalScore / completedCount : 0,
            bestScore,
            currentStreak: calculateStreak(attempts),
            totalTimeSpent,
          },
          recentActivity,
          position: {
            overallRank: 0, // Will be calculated from leaderboard
            universityRank: 0,
            categoryRanks: {},
          }
        });
      } catch (error) {
        console.error('Error processing user stats:', error);
        setError('Failed to load user statistics');
      }
    });

    return unsubscribe;
  }, [user?.uid]);

  // Leaderboard listener
  const setupLeaderboardListener = useCallback(() => {
    const resultsQuery = query(
      collection(db, "examResults"),
      orderBy("completedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(resultsQuery, (snapshot) => {
      try {
        const userScores = new Map<string, {
          userName: string;
          university: string;
          totalScore: number;
          totalAttempts: number;
          latestExam: Date;
        }>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId;
          
          if (!userScores.has(userId)) {
            userScores.set(userId, {
              userName: data.userName || 'Unknown',
              university: data.userUniversity || 'Unknown',
              totalScore: 0,
              totalAttempts: 0,
              latestExam: new Date(0),
            });
          }
          
          const userScore = userScores.get(userId)!;
          userScore.totalScore += data.score || 0;
          userScore.totalAttempts += 1;
          
          const examDate = data.completedAt?.toDate() || new Date();
          if (examDate > userScore.latestExam) {
            userScore.latestExam = examDate;
          }
        });

        const leaderboardData: RealTimeLeaderboard[] = Array.from(userScores.entries())
          .map(([userId, data]) => ({
            userId,
            userName: data.userName,
            university: data.university,
            totalScore: data.totalScore,
            totalAttempts: data.totalAttempts,
            averageScore: data.totalAttempts > 0 ? data.totalScore / data.totalAttempts : 0,
            rank: 0, // Will be assigned after sorting
            latestExam: data.latestExam,
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error processing leaderboard:', error);
        setError('Failed to load leaderboard');
      }
    });

    return unsubscribe;
  }, []);

  // Calculate streak
  const calculateStreak = (attempts: RealTimeExamAttempt[]): number => {
    const completed = attempts
      .filter(a => a.completed)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    let streak = 0;
    let lastDate = new Date();
    
    for (const attempt of completed) {
      const daysDiff = Math.floor((lastDate.getTime() - attempt.startTime.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        streak++;
        lastDate = attempt.startTime;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Setup all listeners
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // Setup global stats listener
      const globalUnsubscribe = setupGlobalStatsListener();
      if (globalUnsubscribe) unsubscribers.current.push(globalUnsubscribe);

      // Setup user stats listener
      const userUnsubscribe = setupUserStatsListener();
      if (userUnsubscribe) unsubscribers.current.push(userUnsubscribe);

      // Setup leaderboard listener
      const leaderboardUnsubscribe = setupLeaderboardListener();
      if (leaderboardUnsubscribe) unsubscribers.current.push(leaderboardUnsubscribe);

      setLoading(false);
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      setError('Failed to setup real-time data');
      setLoading(false);
    }

    return cleanup;
  }, [user?.uid, setupGlobalStatsListener, setupUserStatsListener, setupLeaderboardListener, cleanup]);

  return {
    globalStats,
    userStats,
    leaderboard,
    recentAttempts,
    loading,
    error,
    refresh: () => {
      cleanup();
      // Re-setup listeners will happen due to dependency changes
    }
  };
}

// Admin-specific real-time hook
export function useRealTimeAdminData() {
  const [adminStats, setAdminStats] = useState<any>(null);
  const [liveUsers, setLiveUsers] = useState<any[]>([]);
  const [liveFeedback, setLiveFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const unsubscribers = useRef<Unsubscribe[]>([]);

  const cleanup = useCallback(() => {
    unsubscribers.current.forEach((unsubscribe: Unsubscribe) => unsubscribe());
    unsubscribers.current = [];
  }, []);

  useEffect(() => {
    // Real-time exam attempts for admin
    const attemptsUnsubscribe = onSnapshot(
      query(collection(db, "examAttempts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const attempts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
          };
        });

        const stats = {
          totalAttempts: attempts.length,
          completedAttempts: attempts.filter((a: any) => a.completed).length,
          activeAttempts: attempts.filter((a: any) => !a.completed).length,
          averageScore: attempts.filter((a: any) => a.completed).reduce((sum: number, a: any) => sum + (a.score || 0), 0) / 
                       Math.max(1, attempts.filter((a: any) => a.completed).length),
        };

        setAdminStats(stats);
      }
    );

    // Real-time feedback
    const feedbackUnsubscribe = onSnapshot(
      query(collection(db, "feedback"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const feedback = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        setLiveFeedback(feedback);
      }
    );

    // Real-time user access
    const usersUnsubscribe = onSnapshot(
      query(collection(db, "userAccess"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          expiryDate: doc.data().expiryDate?.toDate(),
        }));
        setLiveUsers(users);
      }
    );

    unsubscribers.current.push(attemptsUnsubscribe, feedbackUnsubscribe, usersUnsubscribe);
    setLoading(false);

    return cleanup;
  }, [cleanup]);

  return {
    adminStats,
    liveUsers,
    liveFeedback,
    loading,
    refresh: cleanup
  };
}
