// src/components/exam/UnifiedExamReviewFlow.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Home,
  Lightbulb,
  Brain,
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
  Keyboard,
  X,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface UnifiedExamReviewFlowProps {
  examTitle: string;
  questions: Question[];
  userAnswers: (number | null)[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
  onBackToDashboard: () => void;
  showHeader?: boolean;
}

export const UnifiedExamReviewFlow: React.FC<UnifiedExamReviewFlowProps> = ({
  examTitle,
  questions,
  userAnswers,
  score,
  totalQuestions,
  timeSpent,
  onBackToDashboard,
  showHeader = true,
}) => {
  const { user } = useAuth();
  const router = useRouter();

  // Navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true); // HIDDEN BY DEFAULT (Golden Standard)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // AI Explanation state
  const [loadingAI, setLoadingAI] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<{[key: number]: string}>({});

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestionIndex];
  const correctAnswer = currentQuestion?.correctAnswer;
  const isCorrect = userAnswer === correctAnswer;
  const wasAnswered = userAnswer !== null && userAnswer !== undefined;

  // Calculate statistics
  const correctCount = userAnswers.filter((answer, index) => 
    answer === questions[index]?.correctAnswer
  ).length;
  const wrongCount = userAnswers.filter((answer, index) => 
    answer !== null && answer !== questions[index]?.correctAnswer
  ).length;
  const unansweredCount = userAnswers.filter(answer => answer === null).length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Keyboard controls (Golden Standard)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent keyboard shortcuts if user is typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showKeyboardHelp) return;

      const key = event.key.toLowerCase();
      
      switch (key) {
        case ' ': // SPACEBAR TOGGLE (Golden Standard)
          event.preventDefault();
          setIsNavigatorCollapsed(!isNavigatorCollapsed);
          break;
        case 'arrowleft':
        case 'p':
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
          }
          break;
        case 'arrowright':
        case 'n':
          event.preventDefault();
          if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
          break;
        case 'h':
        case '?':
          event.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case 'enter':
          event.preventDefault();
          if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestionIndex, totalQuestions, isNavigatorCollapsed, showKeyboardHelp]);

  // AI Explanation handler
  const handleGetAIExplanation = async (questionIndex: number) => {
    setLoadingAI(questionIndex);

    try {
      const question = questions[questionIndex];
      const userAnswer = userAnswers[questionIndex];
      const correctAnswer = question.correctAnswer;

      const response = await fetch('/api/ai-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.text,
          options: question.options,
          correctAnswer,
          userAnswer,
          isCorrect: userAnswer === correctAnswer,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        let formattedExplanation = data.explanation;
        
        if (data.truncated) {
          formattedExplanation += '\n\n---\n*📝 Explanation was optimized for length (350 words max)*';
        }
        
        setAiExplanations(prev => ({
          ...prev,
          [questionIndex]: formattedExplanation,
        }));
      } else {
        throw new Error(data.error || 'Failed to get AI explanation');
      }
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setAiExplanations(prev => ({
        ...prev,
        [questionIndex]: 'Sorry, I encountered an error while generating the explanation. Please try again.',
      }));
    } finally {
      setLoadingAI(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor((seconds / 60) % 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      
      {/* Fixed Header with Progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Review: {examTitle}
              </h1>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Score: {score}/{totalQuestions} ({Math.round((score/totalQuestions)*100)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
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

              {/* Time Display */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Time: {formatTime(timeSpent)}
                </span>
              </div>

              <Button onClick={onBackToDashboard} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
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
                {correctCount} correct • {wrongCount} wrong • {unansweredCount} unanswered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Question Navigator Sidebar - COLLAPSIBLE (Golden Standard) */}
          {!isNavigatorCollapsed && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Question Navigator
                  </h3>
                  <Button
                    onClick={() => setIsNavigatorCollapsed(true)}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questions.map((question, index) => {
                    const answered = userAnswers[index] !== null;
                    const correct = userAnswers[index] === question.correctAnswer;
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`
                          w-8 h-8 text-xs font-medium rounded border-2 transition-all
                          ${
                            isCurrent
                              ? "border-blue-500 bg-blue-500 text-white"
                              : answered
                              ? correct
                                ? "border-green-500 bg-green-100 text-green-700"
                                : "border-red-500 bg-red-100 text-red-700"
                              : "border-gray-300 bg-gray-100 text-gray-700"
                          }
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
                    <span>Correct ({correctCount})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded"></div>
                    <span>Wrong ({wrongCount})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 bg-gray-100 rounded"></div>
                    <span>Unanswered ({unansweredCount})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show Navigator Button when collapsed */}
          {isNavigatorCollapsed && (
            <div className="fixed bottom-4 left-4 z-50">
              <Button
                onClick={() => setIsNavigatorCollapsed(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                title="Show Navigator (Space)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Main Question Area */}
          <div className={`${isNavigatorCollapsed ? "lg:col-span-4" : "lg:col-span-3"}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
              {/* Question Header with Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-2">
                      {wasAnswered ? (
                        isCorrect ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Correct</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Incorrect</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Not Answered</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-lg text-gray-900 leading-relaxed">
                  {currentQuestion?.text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion?.options?.map((option: string, index: number) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isUserAnswer = userAnswer === index;
                  const isCorrectAnswer = correctAnswer === index;

                  let optionStyle = "border-gray-200 bg-white";
                  let labelStyle = "border-gray-300 text-gray-600";

                  if (isCorrectAnswer) {
                    optionStyle = "border-green-500 bg-green-50";
                    labelStyle = "border-green-500 bg-green-500 text-white";
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    optionStyle = "border-red-500 bg-red-50";
                    labelStyle = "border-red-500 bg-red-500 text-white";
                  }

                  return (
                    <div
                      key={index}
                      className={`w-full p-4 rounded-lg border-2 ${optionStyle}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${labelStyle}`}>
                          {optionLabel}
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-900">{option}</span>
                          {isCorrectAnswer && (
                            <div className="flex items-center space-x-1 mt-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Correct Answer</span>
                            </div>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <div className="flex items-center space-x-1 mt-1">
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span className="text-xs text-red-600 font-medium">Your Answer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* AI Explanation Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    AI Explanation
                  </h3>
                  
                  {!aiExplanations[currentQuestionIndex] && (
                    <Button
                      onClick={() => handleGetAIExplanation(currentQuestionIndex)}
                      disabled={loadingAI === currentQuestionIndex}
                      variant="outline"
                    >
                      {loadingAI === currentQuestionIndex ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Get AI Explanation
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {aiExplanations[currentQuestionIndex] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none text-blue-900">
                      <ReactMarkdown>
                        {aiExplanations[currentQuestionIndex]}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Default explanation if available */}
                {!aiExplanations[currentQuestionIndex] && currentQuestion?.explanation && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
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
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd></div>
                <div>Toggle Navigator</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">←/→</kbd></div>
                <div>Previous/Next</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">P/N</kbd></div>
                <div>Previous/Next</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd></div>
                <div>Next question</div>
                
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">H/?</kbd></div>
                <div>Show this help</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedExamReviewFlow;
