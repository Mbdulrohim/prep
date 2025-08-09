// src/components/exam/StandaloneWeeklyAssessmentFlow.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Save,
  Calculator as CalcIcon,
  Keyboard,
  BarChart3,
  BookOpen,
  Award,
  Target,
  X,
  Home,
} from "lucide-react";
import { Calculator } from "../ui/Calculator";
import { useCalculator } from "../../hooks/useCalculator";
import { standaloneWeeklyAssessmentManager, StandaloneWeeklyAssessment } from "../../lib/standaloneWeeklyAssessments";
import { ParsedQuestion } from "../../lib/documentParser";
import UnifiedExamReviewFlow from "./UnifiedExamReviewFlow";

interface StandaloneWeeklyAssessmentFlowProps {
  isPreview?: boolean;
}

const StandaloneWeeklyAssessmentFlow: React.FC<StandaloneWeeklyAssessmentFlowProps> = ({
  isPreview = false,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isCalculatorOpen, toggleCalculator } = useCalculator();

  // Assessment state
  const [assessment, setAssessment] = useState<StandaloneWeeklyAssessment | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer and status
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  
  // UI state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      if (isPreview) {
        setLoading(false);
        return;
      }

      try {
        const currentAssessment = await standaloneWeeklyAssessmentManager.getCurrentStandaloneAssessment();
        if (!currentAssessment) {
          router.push("/dashboard");
          return;
        }

        setAssessment(currentAssessment);
        setQuestions(currentAssessment.questions);
        setUserAnswers(new Array(currentAssessment.questions.length).fill(null));
        setTimeLeft(currentAssessment.timeLimit * 60); // Convert to seconds
      } catch (error) {
        console.error("Error fetching assessment:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [router, isPreview]);

  // Timer effect
  useEffect(() => {
    if (showResults || timeLeft <= 0 || isPreview || loading) return;

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
  }, [timeLeft, showResults, isPreview, loading]);

  // Warning for low time
  useEffect(() => {
    if (timeLeft <= 0) {
      handleForceSubmit();
    } else if (timeLeft <= 300) {
      // 5 minutes warning
      setShowWarning(true);
    }
  }, [timeLeft]);

  // Auto-save functionality
  useEffect(() => {
    if (showResults || isPreview) return;

    const autoSaveTimer = setInterval(() => {
      if (userAnswers.some((answer) => answer !== null)) {
        setAutoSaveStatus("saving");
        // Simulate save to backend
        setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 1000);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [userAnswers, showResults, isPreview]);

  // Keyboard shortcuts for exam navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent keyboard shortcuts if user is typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showResults || showWarning || showKeyboardHelp) return;

      // Prevent default behavior for our keyboard shortcuts
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
          if (currentQuestionIndex < totalQuestions - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
          break;
        case 'f':
          event.preventDefault();
          toggleFlag();
          break;
        case 'enter':
          event.preventDefault();
          if (currentQuestionIndex < totalQuestions - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
          break;
        case 'h':
        case '?':
          event.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case ' ':
          // Space bar to toggle navigator
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
          if (currentQuestionIndex < totalQuestions - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestionIndex, totalQuestions, isNavigatorCollapsed, showResults, showWarning, showKeyboardHelp]);

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  // Navigate to specific question
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
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

  // Handle forced submission when time runs out
  const handleForceSubmit = () => {
    console.log("Time's up! Auto-submitting exam...");
    confirmSubmit();
  };

  // Handle exam submission
  const handleSubmitExam = () => {
    setShowWarning(true);
  };

  // Confirm and submit exam
  const confirmSubmit = async () => {
    if (!user?.uid || !assessment || submitting) return;
    
    try {
      setSubmitting(true);
      
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
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Create exam results data
      const results = {
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || "Anonymous",
        userUniversity: "Unknown", // You might want to get this from user profile
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
      
      // Submit to backend
      await standaloneWeeklyAssessmentManager.submitStandaloneAssessmentAttempt(results);
      
      // Store results for immediate display
      setExamResults(results);
      setShowResults(true);
      setShowWarning(false);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      setSubmitting(false);
    }
  };

  // Get answered questions count
  const answeredCount = userAnswers.filter((answer) => answer !== null).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flaggedQuestions.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-lg text-slate-700">Loading weekly assessment...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !showResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-slate-700">
            No questions available for this assessment.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show results view with unified review component (Golden Standard)
  if (showResults && examResults) {
    return (
      <UnifiedExamReviewFlow
        examTitle={assessment?.title || "Weekly Assessment"}
        questions={questions}
        userAnswers={userAnswers}
        score={examResults.correctAnswers}
        totalQuestions={questions.length}
        timeSpent={examResults.timeSpent}
        onBackToDashboard={() => router.push("/dashboard")}
        showHeader={false} // We don't need double header
      />
    );
  }

  // Main exam interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer and Progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {assessment?.title || "Weekly Assessment"}
              </h1>
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

            <div className="flex items-center space-x-4">
              {/* Calculator Button */}
              <Button
                onClick={toggleCalculator}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <CalcIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calculator</span>
              </Button>

              {/* Keyboard Help Button */}
              <Button
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
                title="Keyboard shortcuts (H or ?)"
              >
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>

              {/* Timer */}
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

              <Button onClick={handleSubmitExam} variant="outline">
                Submit Exam
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Question Area */}
        <div className="w-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
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

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    {isNavigatorCollapsed ? "Show" : "Hide"} Navigator
                  </Button>

                  <Button
                    onClick={toggleFlag}
                    variant="outline"
                    size="sm"
                    className={`
                      ${
                        flaggedQuestions.has(currentQuestionIndex)
                          ? "border-yellow-500 text-yellow-600"
                          : "border-gray-300"
                      }
                    `}
                  >
                  <Flag
                    className={`h-4 w-4 mr-1 ${
                      flaggedQuestions.has(currentQuestionIndex) ? "fill-current" : ""
                    }`}
                  />
                  {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag"}
                </Button>
                </div>
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
                          w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium
                          ${
                            isSelected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-300 text-gray-600"
                          }
                        `}
                        >
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
                    <Button onClick={handleSubmitExam}>Submit Exam</Button>
                  ) : (
                    <Button
                      onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Bottom Question Navigator */}
        {!isNavigatorCollapsed && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Question Navigator</h3>
              <Button
                onClick={() => setIsNavigatorCollapsed(true)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Responsive question grid */}
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((question, index) => {
                const isAnswered = userAnswers[index] !== null;
                const isCurrent = index === currentQuestionIndex;
                const isFlagged = flaggedQuestions.has(index);

                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`
                      w-8 h-8 text-xs font-medium rounded border-2 transition-all flex items-center justify-center
                      ${
                        isCurrent
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

            <div className="flex items-center justify-center space-x-6 text-sm">
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
        )}
      </div>

      {/* Calculator Component */}
      {isCalculatorOpen && <Calculator isOpen={isCalculatorOpen} onClose={toggleCalculator} />}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Keyboard Shortcuts</h3>
              <Button
                onClick={() => setShowKeyboardHelp(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">A/B/C/D</kbd></div>
                <div>Select answer</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">←/→</kbd></div>
                <div>Previous/Next</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">P/N</kbd></div>
                <div>Previous/Next</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">F</kbd></div>
                <div>Flag question</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd></div>
                <div>Next question</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd></div>
                <div>Toggle navigator</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">H/?</kbd></div>
                <div>Show this help</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Submit Assessment?</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Are you sure you want to submit your assessment? This action cannot be
                undone.
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
                disabled={submitting}
              >
                Continue Exam
              </Button>
              <Button 
                onClick={confirmSubmit} 
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneWeeklyAssessmentFlow;
