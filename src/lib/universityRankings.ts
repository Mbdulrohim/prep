// src/lib/universityRankings.ts
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

export interface UniversityRanking {
  universityId: string;
  universityName: string;
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  topPerformers: number; // Students with >80% score
  excellentPerformers: number; // Students with >90% score
  averageTimeSpent: number; // In minutes
  completionRate: number; // Percentage of completed exams
  rank: number;
}

export interface UniversityStats {
  examCategory: string;
  paper: string;
  rankings: UniversityRanking[];
  lastUpdated: Date;
}

class UniversityRankingManager {
  private static instance: UniversityRankingManager;

  static getInstance(): UniversityRankingManager {
    if (!UniversityRankingManager.instance) {
      UniversityRankingManager.instance = new UniversityRankingManager();
    }
    return UniversityRankingManager.instance;
  }

  async calculateUniversityRankings(
    examCategory?: string,
    paper?: string
  ): Promise<UniversityRanking[]> {
    try {
      console.log("Calculating university rankings...", { examCategory, paper });

      // Build query constraints
      const constraints: any[] = [
        where("completed", "==", true),
        where("submitted", "==", true)
      ];

      if (examCategory) {
        constraints.push(where("examCategory", "==", examCategory));
      }

      if (paper) {
        constraints.push(where("paper", "==", paper));
      }

      // Get all exam attempts
      const attemptsRef = collection(db, "examAttempts");
      const q = query(attemptsRef, ...constraints);
      const snapshot = await getDocs(q);

      console.log(`Found ${snapshot.docs.length} exam attempts`);

      // Group attempts by university
      const universityData: Record<string, {
        name: string;
        attempts: any[];
        students: Set<string>;
      }> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const universityId = this.normalizeUniversityId(data.userUniversity || data.universityId || "not-specified");
        const universityName = data.userUniversity || "Not Specified";

        if (!universityData[universityId]) {
          universityData[universityId] = {
            name: universityName,
            attempts: [],
            students: new Set(),
          };
        }

        universityData[universityId].attempts.push(data);
        universityData[universityId].students.add(data.userId);
      });

      // Calculate rankings for each university
      const rankings: UniversityRanking[] = [];

      Object.entries(universityData).forEach(([universityId, data]) => {
        const attempts = data.attempts;
        const totalAttempts = attempts.length;
        const totalStudents = data.students.size;

        if (totalAttempts === 0) return;

        // Calculate statistics
        const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
        const totalPercentage = attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
        const totalCorrectAnswers = attempts.reduce((sum, attempt) => sum + (attempt.correctAnswers || 0), 0);
        const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.totalQuestions || 0), 0);
        const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);

        const averageScore = totalScore / totalAttempts;
        const averagePercentage = totalPercentage / totalAttempts;
        const averageTimeSpent = totalTimeSpent / totalAttempts / 60; // Convert to minutes

        // Count top performers
        const topPerformers = attempts.filter(attempt => (attempt.percentage || 0) > 80).length;
        const excellentPerformers = attempts.filter(attempt => (attempt.percentage || 0) > 90).length;

        // Calculate completion rate (all fetched attempts are completed, so this is 100% for now)
        const completionRate = 100;

        rankings.push({
          universityId,
          universityName: data.name,
          totalStudents,
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          totalCorrectAnswers,
          totalQuestions,
          topPerformers,
          excellentPerformers,
          averageTimeSpent: Math.round(averageTimeSpent * 100) / 100,
          completionRate,
          rank: 0, // Will be assigned after sorting
        });
      });

      // Sort by average percentage (descending) and assign ranks
      rankings.sort((a, b) => b.averagePercentage - a.averagePercentage);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      console.log("University rankings calculated:", rankings);
      return rankings;

    } catch (error) {
      console.error("Error calculating university rankings:", error);
      return [];
    }
  }

  async getTopUniversities(
    limit: number = 10,
    examCategory?: string,
    paper?: string
  ): Promise<UniversityRanking[]> {
    const rankings = await this.calculateUniversityRankings(examCategory, paper);
    return rankings.slice(0, limit);
  }

  async getUniversityStats(
    universityId: string,
    examCategory?: string,
    paper?: string
  ): Promise<UniversityRanking | null> {
    const rankings = await this.calculateUniversityRankings(examCategory, paper);
    return rankings.find(ranking => ranking.universityId === universityId) || null;
  }

  async getTopPerformersByUniversity(
    universityId: string,
    examCategory?: string,
    paper?: string
  ): Promise<{ name: string; score: number; percentage: number }[]> {
    try {
      let attemptsQuery = query(
        collection(db, "examAttempts"),
        where("completed", "==", true),
        where("universityId", "==", universityId),
        orderBy("percentage", "desc"),
        limit(5)
      );

      if (examCategory) {
        attemptsQuery = query(
          collection(db, "examAttempts"),
          where("completed", "==", true),
          where("universityId", "==", universityId),
          where("examCategory", "==", examCategory),
          orderBy("percentage", "desc"),
          limit(5)
        );
      }

      const snapshot = await getDocs(attemptsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.userName || "Anonymous",
          score: data.score || 0,
          percentage: data.percentage || 0
        };
      });
    } catch (error) {
      console.error("Error getting top performers:", error);
      return [];
    }
  }

  async getCategoryBreakdownByUniversity(
    universityId: string
  ): Promise<{ RN: number; RM: number; RPHN: number }> {
    try {
      const attemptsQuery = query(
        collection(db, "examAttempts"),
        where("completed", "==", true),
        where("universityId", "==", universityId)
      );

      const snapshot = await getDocs(attemptsQuery);
      const breakdown = { RN: 0, RM: 0, RPHN: 0 };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.examCategory as keyof typeof breakdown;
        if (category && breakdown.hasOwnProperty(category)) {
          breakdown[category]++;
        }
      });

      return breakdown;
    } catch (error) {
      console.error("Error getting category breakdown:", error);
      return { RN: 0, RM: 0, RPHN: 0 };
    }
  }

  private normalizeUniversityId(university: string): string {
    if (!university || university === "Not specified" || university === "Unknown") {
      return "not-specified";
    }
    
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    return university
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async getAllUniversityStats(): Promise<{
    overall: UniversityRanking[];
    byCategory: Record<string, UniversityRanking[]>;
    byPaper: Record<string, UniversityRanking[]>;
  }> {
    try {
      const [overall, rnRankings, rmRankings, rphnRankings, paper1Rankings, paper2Rankings] = await Promise.all([
        this.calculateUniversityRankings(),
        this.calculateUniversityRankings("RN"),
        this.calculateUniversityRankings("RM"),
        this.calculateUniversityRankings("RPHN"),
        this.calculateUniversityRankings(undefined, "paper-1"),
        this.calculateUniversityRankings(undefined, "paper-2"),
      ]);

      return {
        overall,
        byCategory: {
          RN: rnRankings,
          RM: rmRankings,
          RPHN: rphnRankings,
        },
        byPaper: {
          "paper-1": paper1Rankings,
          "paper-2": paper2Rankings,
        },
      };
    } catch (error) {
      console.error("Error getting all university stats:", error);
      return {
        overall: [],
        byCategory: {},
        byPaper: {},
      };
    }
  }
}

export const universityRankingManager = UniversityRankingManager.getInstance();
