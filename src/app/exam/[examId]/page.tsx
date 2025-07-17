"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExam } from "@/context/ExamContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PreExamModal, StudentDetails } from "@/components/exam/PreExamModal";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export default function ExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    questions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    examDetails,
    loadingQuestions,
  } = useExam();

  const [examStarted, setExamStarted] = useState(false);
  const [showPreModal, setShowPreModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (!loadingQuestions && questions.length > 0 && !examStarted) {
      setShowPreModal(true);
    }
  }, [user, loadingQuestions, questions, examStarted, router]);

  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft, setTimeLeft]);

  const handleStartExam = (details: StudentDetails) => {
    setStudentDetails(details);
    setShowPreModal(false);
    setExamStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitExam = () => {
    router.push(`/exam/${examDetails?.id}/results`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loadingQuestions || !questions.length) {
    return null; // ExamProvider handles loading state
  }

  if (!examStarted) {
    return (
      <>
        <PreExamModal
          isOpen={showPreModal}
          onClose={() => setShowPreModal(false)}
          onStartExam={handleStartExam}
          examTitle={examDetails?.title || "Exam"}
        />
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
          <Header />
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {examDetails?.title}
              </h2>
              <p className="text-slate-600 mb-6">
                Please complete your details to begin the exam.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Header />

      {/* Exam Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Exam
            </Button>
            <h1 className="text-xl font-bold text-slate-800">
              {examDetails?.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-slate-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <main className="flex-grow px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    userAnswers[currentQuestionIndex] === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        userAnswers[currentQuestionIndex] === index
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300"
                      }`}
                    >
                      {userAnswers[currentQuestionIndex] === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-slate-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Flag className="h-4 w-4 mr-2" />
                  Flag Question
                </Button>
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmitExam}>Submit Exam</Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
