// src/app/exam/rm/[examId]/review/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Target,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";

// RM-specific imports
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";

interface ReviewQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
  explanation?: string;
  isCorrect: boolean;
  isAnswered: boolean;
}

export default function RMExamReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [rmExamData, setRmExamData] = useState<RMExamData | null>(null);
  const [examAttempt, setExamAttempt] = useState<RMExamAttempt | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanations, setShowExplanations] = useState(true);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadReviewData();
  }, [user, examId]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch RM exam data
      const rmExams = await fetchRMExams();
      const currentRmExam = rmExams.find((exam) => exam.id === examId);
      
      if (!currentRmExam) {
        setError("RM Exam not found");
        return;
      }
      
      setRmExamData(currentRmExam);

      // Fetch the latest exam attempt with review data
      const attempts = await rmExamAttemptManager.getUserRMExamAttempts(user!.uid);
      const examAttempts = attempts.filter(attempt => attempt.examId === examId);
      const latestAttempt = examAttempts[0]; // Latest attempt is first

      if (!latestAttempt) {
        setError("No exam attempt found for review");
        return;
      }

      setExamAttempt(latestAttempt);

      // Process questions for review
      const questions: ReviewQuestion[] = latestAttempt.assignedQuestions.map((question, index) => {
        const userAnswer = latestAttempt.userAnswers[index];
        const isAnswered = userAnswer !== null && userAnswer !== undefined;
        const isCorrect = isAnswered && userAnswer === question.correctAnswer;

        return {
          id: question.id,
          question: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer,
          explanation: question.explanation,
          isCorrect,
          isAnswered,
        };
      });

      setReviewQuestions(questions);
    } catch (error) {
      console.error("Error loading review data:", error);
      setError("Failed to load exam review data");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = reviewQuestions.filter((question) => {
    switch (filter) {
      case "correct":
        return question.isCorrect;
      case "incorrect":
        return question.isAnswered && !question.isCorrect;
      case "unanswered":
        return !question.isAnswered;
      default:
        return true;
    }
  });

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const goToNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const getFilterCounts = () => {
    const correct = reviewQuestions.filter(q => q.isCorrect).length;
    const incorrect = reviewQuestions.filter(q => q.isAnswered && !q.isCorrect).length;
    const unanswered = reviewQuestions.filter(q => !q.isAnswered).length;
    
    return { correct, incorrect, unanswered, total: reviewQuestions.length };
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam review...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rmExamData || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Not Available</h1>
            <p className="text-gray-600 mb-6">{error || "Unable to load review data"}</p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const counts = getFilterCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with RM Branding */}
        <div className="mb-8">
          <Button
            onClick={() => router.push(`/exam/rm/${examId}/results`)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">RM Exam Review</h1>
          </div>
          <p className="text-gray-600">{rmExamData.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border p-4 sticky top-4 space-y-6">
              {/* Filter Controls */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Filter Questions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { setFilter("all"); setCurrentQuestionIndex(0); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      filter === "all" 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    All Questions ({counts.total})
                  </button>
                  <button
                    onClick={() => { setFilter("correct"); setCurrentQuestionIndex(0); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      filter === "correct" 
                        ? "bg-green-100 text-green-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Correct ({counts.correct})
                  </button>
                  <button
                    onClick={() => { setFilter("incorrect"); setCurrentQuestionIndex(0); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      filter === "incorrect" 
                        ? "bg-red-100 text-red-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Incorrect ({counts.incorrect})
                  </button>
                  <button
                    onClick={() => { setFilter("unanswered"); setCurrentQuestionIndex(0); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      filter === "unanswered" 
                        ? "bg-yellow-100 text-yellow-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Unanswered ({counts.unanswered})
                  </button>
                </div>
              </div>

              {/* Question Navigation */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Questions</h3>
                <div className="grid grid-cols-5 gap-1">
                  {filteredQuestions.map((question, index) => {
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-8 h-8 text-xs font-medium rounded ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : question.isCorrect
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : question.isAnswered
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        }`}
                      >
                        {reviewQuestions.findIndex(q => q.id === question.id) + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Controls */}
              <div>
                <button
                  onClick={() => setShowExplanations(!showExplanations)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {showExplanations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showExplanations ? "Hide" : "Show"} Explanations</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow border">
              {/* Question Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      Question {reviewQuestions.findIndex(q => q.id === currentQuestion.id) + 1} of {reviewQuestions.length}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      currentQuestion.isCorrect
                        ? "bg-green-100 text-green-700"
                        : currentQuestion.isAnswered
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {currentQuestion.isCorrect ? "Correct" : currentQuestion.isAnswered ? "Incorrect" : "Unanswered"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {currentQuestionIndex + 1} of {filteredQuestions.length} ({filter})
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="p-6">
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isUserAnswer = currentQuestion.userAnswer === index;
                    const isCorrectAnswer = currentQuestion.correctAnswer === index;
                    
                    let optionStyle = "border-gray-200 bg-white";
                    let iconColor = "text-gray-400";
                    let icon = null;

                    if (isCorrectAnswer) {
                      optionStyle = "border-green-500 bg-green-50";
                      iconColor = "text-green-600";
                      icon = <CheckCircle className="h-5 w-5" />;
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optionStyle = "border-red-500 bg-red-50";
                      iconColor = "text-red-600";
                      icon = <XCircle className="h-5 w-5" />;
                    }
                    
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${optionStyle}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
                            {icon || (
                              <span className="text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-700">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <span className="text-gray-900">{option}</span>
                            </div>
                            {(isUserAnswer || isCorrectAnswer) && (
                              <div className="mt-1 text-sm">
                                {isCorrectAnswer && (
                                  <span className="text-green-600 font-medium">✓ Correct Answer</span>
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <span className="text-red-600 font-medium">✗ Your Answer</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanations && currentQuestion.explanation && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Explanation</h4>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => router.push("/exam/rm")}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Target className="h-4 w-4" />
                      <span>More RM Exams</span>
                    </Button>
                    
                    <Button
                      onClick={goToNext}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      className="flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
