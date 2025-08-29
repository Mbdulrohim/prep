// src/components/rm/StandaloneRMExamFlow.tsx
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
import { standaloneRMExamManager, StandaloneRMExam, StandaloneRMAttempt } from "../../lib/standaloneRMExams";
import { RMQuestion } from "../../lib/rmExamData";

interface StandaloneRMExamFlowProps {
  examId: string;
  isPreview?: boolean;
}

const StandaloneRMExamFlow: React.FC<StandaloneRMExamFlowProps> = ({
  examId,
  isPreview = false,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isCalculatorOpen, toggleCalculator } = useCalculator();

  // Exam state
  const [exam, setExam] = useState<StandaloneRMExam | null>(null);
  const [questions, setQuestions] = useState<RMQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showQuestionNavigator, setShowQuestionNavigator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Current attempt
  const [currentAttempt, setCurrentAttempt] = useState<StandaloneRMAttempt | null>(null);

  // Initialize exam
  useEffect(() => {
    if (user && examId) {
      initializeExam();
    }
  }, [user, examId]);

  const initializeExam = async () => {
    try {
      setLoading(true);

      // Get exam data
      const examData = await standaloneRMExamManager.getRMExamById(examId);
      if (!examData) {
        setError("Exam not found");
        return;
      }

      setExam(examData);
      setQuestions(examData.questions);

      // Get or create attempt
      const attempt = await standaloneRMExamManager.getUserActiveAttempt(user!.uid, examId);
      if (attempt) {
        // Resume existing attempt
        setCurrentAttempt(attempt);
        setUserAnswers(attempt.userAnswers);
        setFlaggedQuestions(new Set(attempt.flaggedQuestions));
        setTimeSpent(attempt.timeSpent);
        
        // Calculate remaining time
        const elapsed = attempt.timeSpent;
        const remaining = Math.max(0, (examData.timeLimit * 60) - elapsed);
        setTimeRemaining(remaining);
      } else {
        // Start new attempt
        const attemptId = await standaloneRMExamManager.startRMExamAttempt(
          user!.uid,
          user!.email || "",
          user!.displayName || user!.email || "",
          "", // University will be fetched from profile
          examId
        );

        if (!attemptId) {
          setError("Failed to start exam");
          return;
        }

        // Initialize new attempt state
        const newAnswers = new Array(examData.totalQuestions).fill(null);
        setUserAnswers(newAnswers);
        setTimeRemaining(examData.timeLimit * 60);
        setTimeSpent(0);
      }

      setStartTime(new Date());
      setIsTimerRunning(true);
    } catch (error) {
      console.error("Error initializing exam:", error);
      setError("Failed to initialize exam");
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || isPreview) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });

      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-save effect
  useEffect(() => {
    if (!currentAttempt || isPreview) return;

    const autoSaveInterval = setInterval(() => {
      autoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentAttempt, userAnswers, flaggedQuestions, timeSpent]);

  const autoSave = async () => {
    if (!currentAttempt || submitting) return;

    try {
      setAutoSaveStatus('saving');
      // Here you would implement auto-save logic
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500));
      setAutoSaveStatus('saved');
      
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (submitting) return;

    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const toggleFlag = (questionIndex: number) => {
    if (submitting) return;

    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionIndex)) {
      newFlagged.delete(questionIndex);
    } else {
      newFlagged.add(questionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setShowQuestionNavigator(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    
    setIsTimerRunning(false);
    await submitExam(true);
  }, [submitting]);

  const submitExam = async (isAutoSubmit = false) => {
    if (!currentAttempt || !exam) return;

    try {
      setSubmitting(true);
      setIsTimerRunning(false);

      const success = await standaloneRMExamManager.submitRMExamAttempt(
        currentAttempt.id,
        userAnswers,
        Array.from(flaggedQuestions),
        timeSpent
      );

      if (success) {
        // Redirect to results page
        router.push(`/rm/${examId}/results?attemptId=${currentAttempt.id}`);
      } else {
        setError("Failed to submit exam. Please try again.");
        setSubmitting(false);
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      setError("Failed to submit exam. Please try again.");
      setSubmitting(false);
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    if (userAnswers[index] !== null) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500';
      case 'flagged': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={() => router.push(`/rm/${examId}`)} variant="outline">
              Back to Exam
            </Button>
            <Button onClick={() => router.push("/rm")}>
              Back to RM Exams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-4">This exam doesn't have any questions available.</p>
          <Button onClick={() => router.push("/rm")}>
            Back to RM Exams
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Exam info */}
            <div className="flex items-center space-x-4">
              <h1 className="font-semibold text-gray-900">{exam.title}</h1>
              <span className="text-sm text-gray-500">Paper {exam.paper}</span>
            </div>

            {/* Center: Progress */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Right: Timer and actions */}
            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              {autoSaveStatus !== 'idle' && (
                <div className="text-xs text-gray-500">
                  {autoSaveStatus === 'saving' && 'Saving...'}
                  {autoSaveStatus === 'saved' && 'Saved'}
                  {autoSaveStatus === 'error' && 'Save failed'}
                </div>
              )}

              {/* Timer */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Calculator */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCalculator}
                className="hidden sm:flex"
              >
                <CalcIcon className="h-4 w-4" />
              </Button>

              {/* Submit */}
              <Button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQuestionIndex + 1}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  className={flaggedQuestions.has(currentQuestionIndex) ? 'bg-yellow-100 border-yellow-300' : ''}
                >
                  <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : ''}`} />
                  {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
                </Button>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-gray-900 leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={index}
                      checked={userAnswers[currentQuestionIndex] === index}
                      onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                      className="sr-only"
                    />
                    <div className={`flex-shrink-0 w-5 h-5 border-2 rounded-full mr-3 mt-0.5 ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {userAnswers[currentQuestionIndex] === index && (
                        <div className="w-full h-full bg-white rounded-full scale-50"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} of {questions.length}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Questions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestionNavigator(!showQuestionNavigator)}
                  className="lg:hidden"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showQuestionNavigator ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              <div className={`grid grid-cols-5 lg:grid-cols-4 gap-2 ${showQuestionNavigator ? 'block' : 'hidden lg:grid'}`}>
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isActive = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 text-xs font-medium rounded-lg border-2 transition-colors ${
                        isActive
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : `border-gray-200 text-gray-700 hover:border-gray-300 ${getQuestionStatusColor(status)} ${
                              status === 'answered' ? 'text-white' : status === 'flagged' ? 'text-white' : ''
                            }`
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                  <span className="text-gray-600">Flagged</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">Unanswered</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span>{userAnswers.filter(a => a !== null).length}/{questions.length}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Flagged:</span>
                  <span>{flaggedQuestions.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator */}
      {isCalculatorOpen && <Calculator isOpen={isCalculatorOpen} onClose={toggleCalculator} />}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Exam?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your exam? You have answered{' '}
              {userAnswers.filter(a => a !== null).length} out of {questions.length} questions.
              {flaggedQuestions.size > 0 && ` You have ${flaggedQuestions.size} flagged questions.`}
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submitExam();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneRMExamFlow;
