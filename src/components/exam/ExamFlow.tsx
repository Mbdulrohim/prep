// src/components/exam/ExamFlow.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExam } from "@/context/ExamContext";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";

interface ExamFlowProps {
  examId: string;
}

export function ExamFlow({ examId }: ExamFlowProps) {
  const { user } = useAuth();
  const router = useRouter();
  const {
    questions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    loadingQuestions,
    examDetails,
  } = useExam();

  const [showWarning, setShowWarning] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (userAnswers.some(answer => answer !== null)) {
        setAutoSaveStatus("saving");
        // Simulate save to backend
        setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 1000);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [userAnswers]);

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  // Handle question navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  // Handle flag/unflag question
  const toggleFlag = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].flagged = !updatedQuestions[currentQuestionIndex].flagged;
    // Note: In a real app, you'd want to update this in the context
  };

  // Handle exam submission
  const handleSubmitExam = () => {
    setShowWarning(true);
  };

  const confirmSubmit = () => {
    // Calculate results and navigate to results page
    router.push(`/exam/${examId}/results`);
  };

  // Get answered questions count
  const answeredCount = userAnswers.filter(answer => answer !== null).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = questions.filter(q => q.flagged).length;

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-lg text-slate-700">Loading exam questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-slate-700">No questions available for this exam.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer and Progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {examDetails?.title}
              </h1>
              <div className="flex items-center space-x-2">
                <Save className={`h-4 w-4 ${
                  autoSaveStatus === "saved" ? "text-green-500" : 
                  autoSaveStatus === "saving" ? "text-yellow-500" : "text-red-500"
                }`} />
                <span className="text-sm text-gray-600">
                  {autoSaveStatus === "saved" ? "Saved" : 
                   autoSaveStatus === "saving" ? "Saving..." : "Save Error"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className={`text-lg font-mono ${
                  timeLeft < 600 ? "text-red-600" : "text-gray-900"
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <Button onClick={handleSubmitExam} variant="outline">
                Submit Exam
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{answeredCount} answered • {flaggedCount} flagged</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((question, index) => {
                  const isAnswered = userAnswers[index] !== null;
                  const isCurrent = index === currentQuestionIndex;
                  const isFlagged = question.flagged;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`
                        w-8 h-8 text-xs font-medium rounded border-2 transition-all
                        ${isCurrent 
                          ? "border-blue-500 bg-blue-500 text-white" 
                          : isAnswered
                          ? "border-green-500 bg-green-100 text-green-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }
                        ${isFlagged ? "ring-2 ring-yellow-400" : ""}
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-green-500 bg-green-100 rounded"></div>
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 bg-white rounded"></div>
                  <span>Not Answered ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-100 rounded ring-2 ring-yellow-400"></div>
                  <span>Flagged ({flaggedCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Question {currentQuestionIndex + 1}
                    </span>
                    {currentQuestion.flagged && (
                      <Flag className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={toggleFlag}
                  variant="outline"
                  size="sm"
                  className={`
                    ${currentQuestion.flagged 
                      ? "border-yellow-500 text-yellow-600" 
                      : "border-gray-300"
                    }
                  `}
                >
                  <Flag className={`h-4 w-4 mr-1 ${
                    currentQuestion.flagged ? "fill-current" : ""
                  }`} />
                  {currentQuestion.flagged ? "Unflag" : "Flag"}
                </Button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-lg text-gray-900 leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = userAnswers[currentQuestionIndex] === index;
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`
                        w-full p-4 text-left rounded-lg border-2 transition-all
                        ${isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium
                          ${isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 text-gray-600"
                          }
                        `}>
                          {optionLabel}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      // Save and continue logic
                    }}
                    variant="outline"
                  >
                    Save & Continue
                  </Button>
                  
                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <Button onClick={handleSubmitExam}>
                      Submit Exam
                    </Button>
                  ) : (
                    <Button onClick={() => goToQuestion(currentQuestionIndex + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Submit Exam?</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Are you sure you want to submit your exam? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div>Total Questions: {totalQuestions}</div>
                  <div>Answered: {answeredCount}</div>
                  <div>Unanswered: {unansweredCount}</div>
                  <div>Time Remaining: {formatTime(timeLeft)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowWarning(false)}
                variant="outline"
                className="flex-1"
              >
                Continue Exam
              </Button>
              <Button
                onClick={confirmSubmit}
                className="flex-1"
              >
                Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
