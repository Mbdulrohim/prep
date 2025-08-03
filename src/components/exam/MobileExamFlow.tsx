// src/components/exam/MobileExamFlow.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Calculator, CalculatorToggle } from "@/components/ui/Calculator";
import { useCalculator } from "@/hooks/useCalculator";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Save,
  Menu,
  X,
  Monitor,
  Smartphone,
} from "lucide-react";
import { examAttemptManager } from "@/lib/examAttempts";
import { shuffleQuestions } from "@/lib/questionBank";

interface MobileExamFlowProps {
  examId: string;
  examData: any;
  userDetails: {
    name: string;
    university: string;
  };
  onExamComplete: (results: ExamResults) => void;
}

interface ExamResults {
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  timeSpent: number;
  answers: (number | null)[];
  flaggedQuestions: number[];
  attemptId?: string; // Optional attempt ID for results navigation
}

export function MobileExamFlow({
  examId,
  examData,
  userDetails,
  onExamComplete,
}: MobileExamFlowProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Calculator hook
  const { isCalculatorOpen, openCalculator, closeCalculator, toggleCalculator } = useCalculator();

  // Exam state
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(examData?.duration * 60 || 150 * 60); // 150 minutes default
  const [startTime, setStartTime] = useState<Date>(new Date());

  // UI state
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "error"
  >("saved");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preventNavigation, setPreventNavigation] = useState(true);

  // Refs for stable references
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const examAttemptId = useRef<string>("");
  const lastSaveTime = useRef<Date>(new Date());

  // Initialize exam
  useEffect(() => {
    if (examData && user) {
      initializeExam();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [examData, user]);

  // Prevent page refresh/navigation during exam
  useEffect(() => {
    if (preventNavigation) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your exam progress will be lost.";
        return e.returnValue;
      };

      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);

      // Push initial state to prevent back navigation
      window.history.pushState(null, "", window.location.href);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [preventNavigation]);

  // Keyboard shortcuts for exam navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent keyboard shortcuts if user is typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

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
            setCurrentQuestionIndex(currentQuestionIndex - 1);
          }
          break;
        case 'n':
          event.preventDefault();
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
          break;
        case 'f':
          event.preventDefault();
          toggleQuestionFlag();
          break;
        case 'enter':
          event.preventDefault();
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
          break;
        case ' ':
          // Space bar to toggle navigator
          event.preventDefault();
          setShowQuestionNav(!showQuestionNav);
          break;
        case 'arrowleft':
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
          }
          break;
        case 'arrowright':
          event.preventDefault();
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
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
  }, [currentQuestionIndex, showQuestionNav, questions.length]);

  const initializeExam = async () => {
    try {
      console.log("Initializing exam with data:", examData);

      // Shuffle and assign questions
      const shuffledQuestions = shuffleQuestions(
        examData.questions,
        examData.totalQuestions
      );
      console.log("Shuffled questions:", shuffledQuestions.length);

      setQuestions(shuffledQuestions);
      setUserAnswers(new Array(shuffledQuestions.length).fill(null));

      // Create exam attempt record
      const attemptData = {
        userId: user!.uid,
        userEmail: user!.email!,
        userName: userDetails.name,
        userUniversity: userDetails.university,
        examId,
        examCategory: examId.includes("rn")
          ? ("RN" as const)
          : examId.includes("rm")
          ? ("RM" as const)
          : ("RPHN" as const),
        paper: examId.includes("paper-2")
          ? ("paper-2" as const)
          : ("paper-1" as const),
        assignedQuestions: shuffledQuestions,
        userAnswers: new Array(shuffledQuestions.length).fill(null),
        flaggedQuestions: [],
        startTime: new Date(),
        timeSpent: 0,
        completed: false,
        submitted: false,
        score: 0,
        percentage: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unanswered: shuffledQuestions.length,
        canReview: false,
      };

      examAttemptId.current = await examAttemptManager.createExamAttempt(
        attemptData
      );
      console.log("Created exam attempt:", examAttemptId.current);

      // Start timer
      startExamTimer();
    } catch (error) {
      console.error("Error initializing exam:", error);
    }
  };

  const startExamTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        // Auto-submit when time runs out
        if (newTime <= 0) {
          handleAutoSubmit();
          return 0;
        }

        // Auto-save every 30 seconds
        const now = new Date();
        if (now.getTime() - lastSaveTime.current.getTime() > 30000) {
          autoSaveProgress();
        }

        return newTime;
      });
    }, 1000);
  }, []);

  const autoSaveProgress = useCallback(async () => {
    if (!examAttemptId.current) return;

    try {
      setAutoSaveStatus("saving");

      const timeSpent = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );

      await examAttemptManager.updateExamProgress(examAttemptId.current, {
        userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        timeSpent,
        updatedAt: new Date(),
      });

      setAutoSaveStatus("saved");
      lastSaveTime.current = new Date();
    } catch (error) {
      console.error("Error auto-saving:", error);
      setAutoSaveStatus("error");
    }
  }, [userAnswers, flaggedQuestions, startTime]);

  const handleAnswerSelect = useCallback(
    (optionIndex: number) => {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = optionIndex;
      setUserAnswers(newAnswers);

      // Auto-advance to next question on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile && currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 500);
      }
    },
    [userAnswers, currentQuestionIndex, questions.length]
  );

  const toggleQuestionFlag = useCallback(() => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  }, [currentQuestionIndex]);

  const handleAutoSubmit = useCallback(async () => {
    console.log("Auto-submitting exam due to time limit...");
    await submitExam(true);
  }, []);

  const submitExam = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setPreventNavigation(false);

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const endTime = new Date();
      const timeSpent = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      // Calculate results
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;

      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === null) {
          unanswered++;
        } else if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      });

      const score = correctAnswers;
      const percentage = Math.round((correctAnswers / questions.length) * 100);

      const results: ExamResults = {
        score,
        percentage,
        correctAnswers,
        wrongAnswers,
        unanswered,
        timeSpent,
        answers: userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        attemptId: examAttemptId.current, // Add attempt ID for results navigation
      };

      // Update exam attempt with final results
      if (examAttemptId.current) {
        await examAttemptManager.completeExamAttempt(examAttemptId.current, {
          ...results,
          endTime,
          completed: true,
          submitted: true,
          isAutoSubmit,
        });
      }

      console.log("Exam submitted successfully:", results);

      // Store results in localStorage for immediate access
      localStorage.setItem(
        "lastExamResults",
        JSON.stringify({
          id: examAttemptId.current || `exam_${examId}_${Date.now()}`,
          examId,
          examTitle: examData?.title || "Exam",
          score,
          percentage,
          correctAnswers,
          wrongAnswers,
          unanswered,
          totalQuestions: questions.length,
          timeSpent,
          autoSubmitted: isAutoSubmit,
          questions,
          userAnswers,
          endTime,
          createdAt: new Date(),
        })
      );

      // Immediately redirect to results page
      router.push(
        `/exam/${examId}/results?immediate=true${
          examAttemptId.current ? `&attemptId=${examAttemptId.current}` : ""
        }${isAutoSubmit ? "&autoSubmit=true" : ""}`
      );

      // Also call the callback for any parent component handling
      onExamComplete(results);
    } catch (error) {
      console.error("Error submitting exam:", error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return "text-red-600"; // Last 5 minutes
    if (timeLeft <= 900) return "text-orange-600"; // Last 15 minutes
    return "text-green-600";
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = userAnswers.filter((answer) => answer !== null).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        {/* Top bar with timer and controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1 font-mono text-sm font-semibold ${getTimeColor()}`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            {timeLeft <= 300 && (
              <div className="flex items-center space-x-1 text-red-600 text-xs animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                <span>Time Running Out!</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {autoSaveStatus === "saving" && (
                <Save className="h-3 w-3 animate-spin" />
              )}
              {autoSaveStatus === "saved" && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              {autoSaveStatus === "error" && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
            </div>

            {/* Calculator Toggle */}
            <CalculatorToggle onClick={toggleCalculator} className="text-xs px-2 py-1" />

            <button
              onClick={() => setShowQuestionNav(!showQuestionNav)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors md:hidden"
            >
              {showQuestionNav ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Progress and question info */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>
              Answered: {answeredCount}/{questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-48">
        {" "}
        {/* Increased bottom padding for larger bottom nav */}
        <div className="max-w-4xl mx-auto px-4">
          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h2>
              <button
                onClick={toggleQuestionFlag}
                className={`ml-4 p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-400 hover:text-orange-600"
                }`}
              >
                <Flag className="h-4 w-4" />
              </button>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => {
                const isSelected = userAnswers[currentQuestionIndex] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className={isSelected ? "font-medium" : ""}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation with Question Navigator */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        {/* Question Navigator Grid - Always visible at bottom */}
        <div className="border-b border-gray-200 p-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Questions
              </span>
              <span className="text-xs text-gray-500">
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Navigator Grid */}
            <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
              {questions.map((_, index) => {
                const isAnswered = userAnswers[index] !== null;
                const isFlagged = flaggedQuestions.has(index);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      w-8 h-8 rounded text-xs font-medium transition-all relative
                      ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-300"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                      }
                    `}
                  >
                    {index + 1}
                    {isFlagged && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-1"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center">
                <Flag className="h-3 w-3 text-orange-500 mr-1" />
                <span>Flagged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              onClick={() =>
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
              }
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {/* Flag Button */}
              <Button
                onClick={() => {
                  const newFlagged = new Set(flaggedQuestions);
                  if (newFlagged.has(currentQuestionIndex)) {
                    newFlagged.delete(currentQuestionIndex);
                  } else {
                    newFlagged.add(currentQuestionIndex);
                  }
                  setFlaggedQuestions(newFlagged);
                }}
                variant="outline"
                size="sm"
                className={`flex items-center ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? "bg-orange-100 border-orange-300 text-orange-700"
                    : ""
                }`}
              >
                <Flag className="h-4 w-4 mr-1" />
                {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag"}
              </Button>

              {/* Submit or Next Button */}
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="bg-green-600 hover:bg-green-700 px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Exam"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex(
                      Math.min(questions.length - 1, currentQuestionIndex + 1)
                    )
                  }
                  size="sm"
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Submit Exam?</h3>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-medium">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered:</span>
                <span className="font-medium text-orange-600">
                  {questions.length - answeredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className={`font-medium ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                ⚠️ Once submitted, you cannot change your answers. Make sure
                you've reviewed all questions.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowSubmitConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Review More
              </Button>
              <Button
                onClick={() => submitExam(false)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Final"}
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
}
