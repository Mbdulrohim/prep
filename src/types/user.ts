export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  university: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  university: string;
  totalScore: number;
  examsCompleted: number;
  averageScore: number;
  lastExamDate: Date;
  profilePicture?: string;
}

export interface ExamResult {
  id: string;
  uid: string;
  examType: "rn-paper-1" | "rn-paper-2" | "rm" | "rphn";
  score: number;
  totalQuestions: number; // 250 for RN papers, 200 for RM/RPHN
  correctAnswers: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  answers: Record<string, string>; // questionId -> selectedAnswer
}
