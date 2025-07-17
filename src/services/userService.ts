import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, LeaderboardEntry, ExamResult } from "@/types/user";

export class UserService {
  // Get user profile
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          university: data.university || "",
          profilePicture: data.profilePicture,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  // Create or update user profile
  static async createOrUpdateUserProfile(
    uid: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", uid);
      const existingUser = await getDoc(userRef);

      if (existingUser.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...profileData,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new user
        await setDoc(userRef, {
          uid,
          ...profileData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error creating/updating user profile:", error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(
    limitCount: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      // Get all exam results
      const resultsQuery = query(
        collection(db, "examResults"),
        orderBy("completedAt", "desc")
      );
      const resultsSnapshot = await getDocs(resultsQuery);

      // Group results by user
      const userScores: Record<
        string,
        {
          totalScore: number;
          examsCompleted: number;
          lastExamDate: Date;
          scores: number[];
        }
      > = {};

      resultsSnapshot.forEach((doc) => {
        const data = doc.data();
        const result = {
          ...data,
          completedAt: data.completedAt.toDate(),
        } as ExamResult;
        const score = (result.correctAnswers / result.totalQuestions) * 100;

        if (!userScores[result.uid]) {
          userScores[result.uid] = {
            totalScore: 0,
            examsCompleted: 0,
            lastExamDate: result.completedAt,
            scores: [],
          };
        }

        userScores[result.uid].totalScore += score;
        userScores[result.uid].examsCompleted++;
        userScores[result.uid].scores.push(score);

        const examDate = result.completedAt;
        if (examDate > userScores[result.uid].lastExamDate) {
          userScores[result.uid].lastExamDate = examDate;
        }
      });

      // Get user profiles and create leaderboard entries
      const leaderboardEntries: LeaderboardEntry[] = [];

      for (const [uid, stats] of Object.entries(userScores)) {
        const userProfile = await this.getUserProfile(uid);
        if (userProfile) {
          leaderboardEntries.push({
            uid,
            displayName: userProfile.displayName,
            university: userProfile.university,
            totalScore: stats.totalScore,
            examsCompleted: stats.examsCompleted,
            averageScore: stats.totalScore / stats.examsCompleted,
            lastExamDate: stats.lastExamDate,
            profilePicture: userProfile.profilePicture,
          });
        }
      }

      // Sort by average score (descending)
      return leaderboardEntries
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, limitCount);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  // Save exam result
  static async saveExamResult(
    examResult: Omit<ExamResult, "id">
  ): Promise<void> {
    try {
      const resultRef = doc(collection(db, "examResults"));
      await setDoc(resultRef, {
        ...examResult,
        id: resultRef.id,
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error saving exam result:", error);
      throw error;
    }
  }

  // Get user's exam results
  static async getUserExamResults(uid: string): Promise<ExamResult[]> {
    try {
      const resultsQuery = query(
        collection(db, "examResults"),
        where("uid", "==", uid),
        orderBy("completedAt", "desc")
      );
      const resultsSnapshot = await getDocs(resultsQuery);

      return resultsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as ExamResult[];
    } catch (error) {
      console.error("Error getting user exam results:", error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }
}
