// src/components/exam/WeeklyAssessmentFlow.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Calculator, CalculatorToggle } from "@/components/ui/Calculator";
import { useCalculator } from "@/hooks/useCalculator";
import { weeklyAssessmentManager } from "@/lib/weeklyAssessments";
import { shuffleQuestions } from "@/lib/questionBank";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Save,
  Eye,
  SkipForward,
  ChevronUp,
  ChevronDown,
  X,
  Calendar,
} from "lucide-react";

interface WeeklyAssessmentFlowProps {
  assessment: any;
  userDetails: {
    name: string;
    university: string;
  };
  onAssessmentComplete: () => void;
}

export const WeeklyAssessmentFlow: React.FC<WeeklyAssessmentFlowProps> = ({
  assessment,
  userDetails,
  onAssessmentComplete,
}) => {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  // Calculator hook
  const { isCalculatorOpen, openCalculator, closeCalculator, toggleCalculator } = useCalculator();

  // Assessment state
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(assessment.timeLimit * 60); // 90 minutes in seconds
  const [startTime, setStartTime] = useState<Date>(new Date());

  // UI state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Initialize assessment
  useEffect(() => {
    initializeAssessment();
  }, [assessment]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (userAnswers.some((answer) => answer !== null)) {
        setAutoSaveStatus("saving");
        setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 1000);
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [userAnswers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'a':
          event.preventDefault();
          handleAnswerSelect(0);
          break;
        case 'b':
          event.preventDefault();
          handleAnswerSelect(1);
          break;
        case 'c':
          event.preventDefault();
          handleAnswerSelect(2);
          break;
        case 'd':
          event.preventDefault();
          handleAnswerSelect(3);
          break;
        case 'p':
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            goToQuestion(currentQuestionIndex - 1);
          }
          break;
        case 'n':
          event.preventDefault();
          if (currentQuestionIndex < questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
          break;
        case 'f':
          event.preventDefault();
          toggleFlag();
          break;
        case 'h':
        case '?':
          event.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case ' ':
          event.preventDefault();
          setIsNavigatorCollapsed(!isNavigatorCollapsed);
          break;
        case 'arrowleft':
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            goToQuestion(currentQuestionIndex - 1);
          }
          break;
        case 'arrowright':
          event.preventDefault();
          if (currentQuestionIndex < questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestionIndex, showKeyboardHelp, questions.length]);

  const initializeAssessment = () => {
    console.log("Initializing weekly assessment:", assessment);

    // Use assessment questions directly (they're already shuffled in the admin)
    const assessmentQuestions = assessment.questions.map((q: any, index: number) => ({
      ...q,
      flagged: false,
    }));

    setQuestions(assessmentQuestions);
    setUserAnswers(new Array(assessmentQuestions.length).fill(null));
    setStartTime(new Date());
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-submit when time runs out
  const handleForceSubmit = async () => {
    console.log("Time's up! Auto-submitting assessment...");
    await submitAssessment(true);
  };

  // Handle manual submission
  const handleSubmitAssessment = () => {
    setShowSubmitModal(true);
  };

  // Confirm submission
  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    await submitAssessment(false);
  };

  // Submit assessment logic
  const submitAssessment = async (autoSubmitted: boolean = false) => {
    if (!user?.uid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate results
      const correctAnswers = questions.reduce((count, question, index) => {
        return userAnswers[index] === question.correctAnswer ? count + 1 : count;
      }, 0);

      const wrongAnswers = userAnswers.filter(
        (answer, index) => answer !== null && answer !== questions[index].correctAnswer
      ).length;

      const unanswered = userAnswers.filter((answer) => answer === null).length;
      const score = correctAnswers;
      const percentage = Math.round((score / questions.length) * 100);
      const timeSpent = Math.round((assessment.timeLimit * 60 - timeLeft));
      const endTime = new Date();

      const attemptData = {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userDetails.name,
        userUniversity: userDetails.university,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        startTime,
        endTime,
        timeSpent,
        score,
        percentage,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalQuestions: questions.length,
        userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        completed: true,
        submitted: true,
      };

      // Store results in localStorage for immediate display
      localStorage.setItem("lastWeeklyAssessmentResults", JSON.stringify({
        ...attemptData,
        questions, // Include questions for review
        autoSubmitted,
      }));

      // Save to Firestore
      await weeklyAssessmentManager.submitWeeklyAssessmentAttempt(attemptData);

      // Navigate to results page
      onAssessmentComplete();

    } catch (error) {
      console.error("Error submitting weekly assessment:", error);
      setIsSubmitting(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  // Navigate to specific question
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Toggle flag for current question
  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestionIndex)) {
      newFlagged.delete(currentQuestionIndex);
    } else {
      newFlagged.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  // Loading state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-lg text-gray-700">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = userAnswers.filter((answer) => answer !== null).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flaggedQuestions.size;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Timer and Progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {assessment.title}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Save
                  className={`h-4 w-4 ${
                    autoSaveStatus === "saved"
                      ? "text-green-500"
                      : autoSaveStatus === "saving"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {autoSaveStatus === "saved"
                    ? "Saved"
                    : autoSaveStatus === "saving"
                    ? "Saving..."
                    : "Save Error"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock
                  className={`h-5 w-5 ${
                    timeLeft < 600 ? "text-red-600" : "text-gray-600"
                  }`}
                />
                <span
                  className={`text-lg font-mono font-bold ${
                    timeLeft < 300
                      ? "text-red-600 animate-pulse"
                      : timeLeft < 600
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
                {timeLeft < 600 && (
                  <span className="text-xs text-red-600 font-medium">
                    {timeLeft < 300 ? "⚠️ FINAL WARNING" : "⚠️ Low Time"}
                  </span>
                )}
              </div>

              {/* Calculator Toggle */}
              <CalculatorToggle onClick={toggleCalculator} />

              <Button onClick={handleSubmitAssessment} variant="outline">
                Submit Assessment
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span>
                {answeredCount} answered • {flaggedCount} flagged
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Keyboard Shortcuts Help */}
        {showKeyboardHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Keyboard Shortcuts</h3>
              <Button
                onClick={() => setShowKeyboardHelp(false)}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Answer Options</h4>
                <div className="space-y-1 text-blue-800">
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">A</kbd> Select option A</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">B</kbd> Select option B</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">C</kbd> Select option C</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">D</kbd> Select option D</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Navigation</h4>
                <div className="space-y-1 text-blue-800">
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">P</kbd> Previous question</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">N</kbd> Next question</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">←</kbd> Previous question</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">→</kbd> Next question</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Other Actions</h4>
                <div className="space-y-1 text-blue-800">
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">F</kbd> Toggle flag</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">Space</kbd> Toggle navigator</div>
                  <div><kbd className="px-2 py-1 bg-white rounded text-xs">H</kbd> or <kbd className="px-2 py-1 bg-white rounded text-xs">?</kbd> Toggle help</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6">
          {/* Question Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                {flaggedQuestions.has(currentQuestionIndex) && (
                  <Flag className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300 text-xs sm:text-sm"
                title="Keyboard shortcuts (H or ?)"
              >
                <span className="hidden sm:inline">Help</span>
                <span className="sm:hidden">?</span>
              </Button>
              <Button
                onClick={toggleFlag}
                variant="outline"
                size="sm"
                className={`text-xs sm:text-sm ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? "border-yellow-500 text-yellow-600"
                    : "border-gray-300"
                }`}
              >
                <Flag
                  className={`h-4 w-4 ${
                    flaggedQuestions.has(currentQuestionIndex) ? "fill-current mr-1" : "mr-1"
                  }`}
                />
                <span className="hidden sm:inline">
                  {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag"}
                </span>
              </Button>
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base sm:text-lg text-gray-900 leading-relaxed">
              {currentQuestion.text}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = userAnswers[currentQuestionIndex] === index;
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`
                    w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium flex-shrink-0
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 text-gray-600"
                      }
                    `}
                    >
                      {optionLabel}
                    </div>
                    <span className="text-gray-900 text-sm sm:text-base leading-relaxed">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </Button>

            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto justify-center">
              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button 
                  onClick={handleSubmitAssessment} 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto px-6"
                >
                  Submit Assessment
                </Button>
              ) : (
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden xs:inline">Next</span>
                  <span className="xs:hidden">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Question Navigator */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigator Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-100 gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Question Navigator</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-green-500 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-gray-300 bg-white rounded"></div>
                  <span className="text-gray-600">Not Answered ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-yellow-400 bg-yellow-100 rounded ring-1 ring-yellow-400"></div>
                  <span className="text-gray-600">Flagged ({flaggedCount})</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 text-xs sm:text-sm"
            >
              {isNavigatorCollapsed ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Show</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Hide</span>
                </>
              )}
            </Button>
          </div>

          {/* Navigator Content */}
          {!isNavigatorCollapsed && (
            <div className="py-3 sm:py-4">
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-2">
                {questions.map((_, index) => {
                  const isAnswered = userAnswers[index] !== null;
                  const isCurrent = index === currentQuestionIndex;
                  const isFlagged = flaggedQuestions.has(index);

                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium rounded-lg border-2 transition-all
                        ${
                          isCurrent
                            ? "border-blue-500 bg-blue-500 text-white"
                            : isAnswered
                            ? "border-green-500 bg-green-100 text-green-700 hover:bg-green-200"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        }
                        ${isFlagged ? "ring-2 ring-yellow-400" : ""}
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Submit Assessment?</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Are you sure you want to submit your weekly assessment? This action cannot be undone.
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
                onClick={() => setShowSubmitModal(false)}
                variant="outline"
                className="flex-1"
              >
                Continue Assessment
              </Button>
              <Button 
                onClick={confirmSubmit} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator */}
      <Calculator 
        isOpen={isCalculatorOpen} 
        onClose={closeCalculator}
        position="floating"
      />
    </div>
  );
};
