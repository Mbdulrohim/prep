// src/context/ExamContext.tsx
"use client";

import React, { createContext, useContext } from "react";
import { Question as BaseQuestion, ExamData } from "@/lib/examData";

// Extend the base Question type to include the 'flagged' property
export type Question = BaseQuestion & { flagged: boolean };

export interface ExamContextType {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  userAnswers: (number | null)[];
  setUserAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  resetExam: (examId: string) => Promise<void>;
  loadingQuestions: boolean;
  examDetails: ExamData | null;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) throw new Error("useExam must be used within an ExamProvider");
  return context;
}

export { ExamContext };
