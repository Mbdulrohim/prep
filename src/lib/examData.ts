// This file holds the data for all individual mock exams.
// Each exam now belongs to a category and has a progress status.

export interface ExamData {
  id: string; // A unique ID for the specific mock exam
  category: "RN"; // The main professional category (currently only RN)
  title: string; // The title of this specific mock exam
  description: string;
  progress: number; // Progress as a percentage (e.g., 0 for not started, 100 for completed)
  score?: number; // The score if the exam is completed
  available: boolean;
}

// We now have three distinct mock exams, all under the RN category.
export const allExams: ExamData[] = [
  {
    id: "rn-mock-1",
    category: "RN",
    title: "RN Mock Exam 1: Fundamentals",
    description:
      "Test your knowledge on the fundamentals of nursing practice and patient care.",
    progress: 100, // Simulating a completed exam
    score: 85,
    available: true,
  },
  {
    id: "rn-mock-2",
    category: "RN",
    title: "RN Mock Exam 2: Pharmacology",
    description:
      "A focused assessment on drug calculations, administration, and side effects.",
    progress: 0, // Simulating an exam that has not been started
    available: true,
  },
  {
    id: "rn-mock-3",
    category: "RN",
    title: "RN Mock Exam 3: Medical-Surgical",
    description:
      "Challenge yourself with complex scenarios in medical-surgical nursing.",
    progress: 50, // Simulating an exam in progress
    available: true,
  },
];
