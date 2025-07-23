// src/components/exam/ExamProvider.tsx
"use client";

import React, { useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuestionsForExam, fetchAllExams, ExamData } from "@/lib/examData";
import { ExamContext, Question, ExamContextType } from "@/context/ExamContext";

export function ExamProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamData | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer function
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimerStarted(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Auto-submit when time runs out
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Auto-submit the exam
          handleAutoSubmit();
          
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  }, [examId, router, questions, userAnswers, examDetails]);

  // Auto-submit function for when time runs out
  const handleAutoSubmit = useCallback(async () => {
    if (!examId || questions.length === 0) return;
    
    try {
      // Calculate results
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;
      
      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === null || userAnswer === undefined) {
          unanswered++;
        } else if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      });
      
      const score = correctAnswers;
      const percentage = Math.round((correctAnswers / questions.length) * 100);
      const endTime = new Date();
      const timeSpent = (examDetails?.durationMinutes || 150) * 60;
      
      // Create auto-submit results
      const autoSubmitResults = {
        id: `auto_${examId}_${Date.now()}`,
        userId: 'auto-submit',
        examId,
        examTitle: examDetails?.title || 'Exam',
        questions,
        userAnswers,
        score,
        percentage,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalQuestions: questions.length,
        timeSpent,
        completed: true,
        submitted: true,
        autoSubmitted: true,
        endTime,
        startTime: new Date(Date.now() - timeSpent * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Store in localStorage for immediate display
      localStorage.setItem('lastExamResults', JSON.stringify(autoSubmitResults));
      
      // Navigate to results
      router.push(`/exam/${examId}/results?immediate=true&autoSubmit=true`);
      
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      // Still navigate to results even if save fails
      router.push(`/exam/${examId}/results`);
    }
  }, [examId, questions, userAnswers, examDetails, router]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Function to load and reset exam state based on examId
  const resetExam = async (id: string) => {
    setLoadingQuestions(true);
    setTimerStarted(false);
    
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
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
        
        // Start timer after questions are loaded
        setTimeout(() => {
          startTimer();
        }, 1000);
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
