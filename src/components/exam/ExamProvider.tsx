// src/components/exam/ExamProvider.tsx
"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { fetchQuestionsForExam, fetchAllExams, ExamData } from "@/lib/examData";
import { ExamContext, Question, ExamContextType } from "@/context/ExamContext";

export function ExamProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const examId = params.examId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamData | null>(null);

  // Function to load and reset exam state based on examId
  const resetExam = async (id: string) => {
    setLoadingQuestions(true);
    try {
      const allExams = await fetchAllExams();
      const details = allExams.find((e) => e.id === id);
      setExamDetails(details || null);

      if (details) {
        const fetchedQuestions = await fetchQuestionsForExam(id);
        const initialQuestions: Question[] = fetchedQuestions.map((q) => ({
          ...q,
          flagged: false,
        }));
        setQuestions(initialQuestions);
        setUserAnswers(Array(initialQuestions.length).fill(null));
        setCurrentQuestionIndex(0);
        setTimeLeft(details.durationMinutes * 60);
      } else {
        console.error(`Exam details not found for ID: ${id}`);
      }
    } catch (error) {
      console.error("Failed to load exam questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Effect to load questions when examId changes or component mounts
  useEffect(() => {
    if (examId) {
      resetExam(examId);
    }
  }, [examId]);

  const value: ExamContextType = {
    questions,
    setQuestions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    resetExam,
    loadingQuestions,
    examDetails,
  };

  return (
    <ExamContext.Provider value={value}>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        {loadingQuestions ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg text-slate-700">
                Loading {examDetails?.title || "Exam"} Questions...
              </p>
            </div>
          </div>
        ) : questions.length > 0 ? (
          children
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Exam Not Found or No Questions
              </h2>
              <p className="text-slate-600">
                The exam you are looking for might not exist or has no questions
                available.
              </p>
            </div>
          </div>
        )}
      </div>
    </ExamContext.Provider>
  );
}
