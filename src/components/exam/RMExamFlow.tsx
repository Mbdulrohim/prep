"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  ArrowLeft,
  ArrowRight,
  Flag,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  Users,
  Target,
  Crown,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

interface RMExamData {
  id: string;
  category: "RM";
  title: string;
  description: string;
  questionsCount: number;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  color: string;
  available: boolean;
  pricing: {
    amount: number;
    currency: string;
    accessCodeEnabled: boolean;
  };
  adminConfig: {
    maxAttempts: number;
    paperCount: number;
    scheduleRequired: boolean;
    autoGenerate: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface StudentDetails {
  name: string;
  university: string;
}

interface RMExamFlowProps {
  examId: string;
  rmExamData: RMExamData;
  rmQuestions: Question[];
  userDetails: StudentDetails;
  onExamComplete: (results: any) => void;
}

export function RMExamFlow({
  examId,
  rmExamData,
  rmQuestions,
  userDetails,
  onExamComplete,
}: RMExamFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(rmExamData.durationMinutes * 60); // convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default if we're handling the key
      const key = event.key.toLowerCase();
      const currentQ = rmQuestions[currentQuestionIndex];
      
      if (!currentQ) return;
      
      // Answer selection keys (A, B, C, D)
      if (['a', 'b', 'c', 'd'].includes(key)) {
        event.preventDefault();
        const answerIndex = key.charCodeAt(0) - 97; // Convert 'a' to 0, 'b' to 1, etc.
        if (answerIndex < currentQ.options.length) {
          handleAnswerSelect(currentQ.id, answerIndex);
        }
        return;
      }
      
      // Next question (N key)
      if (key === 'n') {
        event.preventDefault();
        goToNext();
        return;
      }
      
      // Previous question (P key)
      if (key === 'p') {
        event.preventDefault();
        goToPrevious();
        return;
      }
      
      // Flag question (F key)
      if (key === 'f') {
        event.preventDefault();
        toggleQuestionFlag(currentQuestionIndex);
        return;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestionIndex, rmQuestions]); // Re-run when question changes

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  // Navigation handlers
  const goToNext = () => {
    if (currentQuestionIndex < rmQuestions.length - 1) {
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
    setShowReviewModal(false);
  };

  // Flag question toggle
  const toggleQuestionFlag = (questionIndex: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  // Submit handlers
  const handleAutoSubmit = () => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
      onExamComplete({ answers, timeSpent });
  };

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      await onExamComplete({ answers, timeSpent });
    } catch (error) {
      console.error("Error submitting exam:", error);
      setIsSubmitting(false);
    }
  };

  // Get exam statistics
  const getExamStats = () => {
    const answered = Object.keys(answers).length;
    const unanswered = rmQuestions.length - answered;
    const flagged = flaggedQuestions.size;
    
    return { answered, unanswered, flagged };
  };

  const currentQuestion = rmQuestions[currentQuestionIndex];
  const stats = getExamStats();
  const isLowTime = timeRemaining < 300; // Less than 5 minutes

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-4">Unable to load exam questions. Please try again.</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* Added bottom padding for fixed navigator */}
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Student Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-900">RM Exam</span>
              </div>
              <div className="hidden md:block text-sm text-gray-600">
                {userDetails.name} • {userDetails.university}
              </div>
            </div>

            {/* Center: Timer */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isLowTime ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewModal(true)}
                className="hidden md:flex"
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitConfirm(true)}
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Question Content */}
        <div className="bg-white rounded-lg shadow border">
          {/* Question Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQuestionIndex + 1} of {rmQuestions.length}
                </span>
                {currentQuestion.difficulty && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    currentQuestion.difficulty === 'Beginner'
                      ? 'bg-green-100 text-green-700'
                      : currentQuestion.difficulty === 'Intermediate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleQuestionFlag(currentQuestionIndex)}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {flaggedQuestions.has(currentQuestionIndex) ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Question Text */}
            <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => {
                const isSelected = answers[currentQuestion.id] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-900">{option}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Keyboard shortcuts help */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Keyboard shortcuts:</strong> A-D (select answer), N (next), P (previous), F (flag)
              </p>
            </div>
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
                {currentQuestionIndex === rmQuestions.length - 1 ? (
                  <Button
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNext}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Question Navigator */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        {/* Toggle Button */}
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => setIsNavigatorExpanded(!isNavigatorExpanded)}
            className="w-full py-3 text-center text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Question Navigator</span>
              <ArrowLeft className={`h-4 w-4 transform transition-transform ${
                isNavigatorExpanded ? 'rotate-90' : '-rotate-90'
              }`} />
            </div>
          </button>
        </div>
        
        {/* Expandable Navigator Content */}
        {isNavigatorExpanded && (
          <div className="max-w-4xl mx-auto px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{stats.answered}</div>
                  <div className="text-xs text-gray-500">Answered</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-600">{stats.unanswered}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">{stats.flagged}</div>
                  <div className="text-xs text-gray-500">Flagged</div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1 max-h-32 overflow-y-auto">
                {rmQuestions.map((_, index: number) => {
                  const isAnswered = answers[rmQuestions[index].id] !== undefined;
                  const isFlagged = flaggedQuestions.has(index);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 text-xs font-medium rounded relative ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="h-2 w-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Exam Review</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-8 gap-2">
                {rmQuestions.map((question: Question, index: number) => {
                  const isAnswered = answers[question.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(index);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 text-sm font-medium rounded relative ${
                        isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="h-2 w-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
                    <div className="text-gray-600">Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.unanswered}</div>
                    <div className="text-gray-600">Unanswered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.flagged}</div>
                    <div className="text-gray-600">Flagged</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Continue
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Exit Exam?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to exit the exam? Your progress will be lost and you cannot resume this attempt.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Exit Exam
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
