"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { examAttemptManager, ExamAttempt } from "@/lib/examAttempts";

interface ReviewData {
  id: string;
  examId: string;
  examTitle: string;
  questions: any[];
  userAnswers: (number | null)[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
}

export default function ExamReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const examId = params.examId as string;
  const attemptId = searchParams.get('attemptId');

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingAI, setLoadingAI] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<{[key: number]: string}>({});
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, [attemptId, user]);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      if (!user?.uid || !attemptId) {
        setError("Invalid review request");
        return;
      }

      const attempt = await examAttemptManager.getExamAttemptForReview(attemptId, user.uid);

      if (!attempt) {
        setError("Exam attempt not found");
        return;
      }

      setReviewData({
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.examId, // You might want to fetch the actual title
        questions: attempt.assignedQuestions,
        userAnswers: attempt.userAnswers,
        score: attempt.score,
        totalQuestions: attempt.assignedQuestions.length,
        timeSpent: attempt.timeSpent || 0,
      });

      console.log('Review data loaded:', {
        questionsCount: attempt.assignedQuestions.length,
        userAnswersCount: attempt.userAnswers.length,
        firstQuestion: attempt.assignedQuestions[0],
        firstAnswer: attempt.userAnswers[0],
        sampleQuestionStructure: attempt.assignedQuestions[0] ? {
          hasId: !!attempt.assignedQuestions[0].id,
          hasText: !!attempt.assignedQuestions[0].text,
          hasOptions: !!attempt.assignedQuestions[0].options,
          optionsLength: attempt.assignedQuestions[0].options?.length || 0,
          hasCorrectAnswer: attempt.assignedQuestions[0].correctAnswer !== undefined,
        } : null,
      });

    } catch (error) {
      console.error('Error loading review data:', error);
      setError("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAIExplanation = async (questionIndex: number) => {
    if (!reviewData) return;

    setLoadingAI(questionIndex);

    try {
      const question = reviewData.questions[questionIndex];
      const userAnswer = reviewData.userAnswers[questionIndex];
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
        
        // Add word count info if explanation was truncated
        if (data.truncated) {
          formattedExplanation += '\n\n---\n*📝 Explanation was optimized for length (350 words max)*';
        } else if (data.wordCount) {
          // Only show word count in development or if under certain threshold
          if (data.wordCount < 100) {
            formattedExplanation += `\n\n---\n*📊 ${data.wordCount} words*`;
          }
        }
        
        setAiExplanations(prev => ({
          ...prev,
          [questionIndex]: formattedExplanation,
        }));
      } else {
        // Show detailed error information
        let errorMessage = `❌ **${data.error || 'AI Explanation Error'}**\n\n`;
        if (data.details) {
          errorMessage += `**Details:** ${data.details}\n\n`;
        }
        
        if (data.openaiError) {
          errorMessage += `**Service:** OpenAI API\n`;
          errorMessage += `**Solution:** This is an OpenAI service issue. Please try again later.\n\n`;
        }
        
        errorMessage += `**Alternative:** Check the database explanation for this question if available.`;
        
        setAiExplanations(prev => ({
          ...prev,
          [questionIndex]: errorMessage,
        }));
      }
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setAiExplanations(prev => ({
        ...prev,
        [questionIndex]: `❌ **Network Error**\n\nFailed to connect to AI explanation service. Please check your internet connection and try again.\n\n**Error Details:** ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    } finally {
      setLoadingAI(null);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < (reviewData?.totalQuestions || 0)) {
      setCurrentQuestionIndex(index);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading review data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Review
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = reviewData.questions[currentQuestionIndex];
  const userAnswer = reviewData.userAnswers[currentQuestionIndex];
  const correctAnswer = currentQuestion?.correctAnswer;
  const isCorrect = userAnswer === correctAnswer;
  const wasAnswered = userAnswer !== null;
  const progress = ((currentQuestionIndex + 1) / reviewData.totalQuestions) * 100;

  console.log('Current question debug:', {
    currentQuestionIndex,
    currentQuestion,
    userAnswer,
    correctAnswer,
    questionsLength: reviewData.questions.length,
  });

  // Get question stats
  const correctCount = reviewData.userAnswers.filter((answer, index) =>
    answer === reviewData.questions[index]?.correctAnswer
  ).length;
  const wrongCount = reviewData.userAnswers.filter((answer, index) =>
    answer !== null && answer !== reviewData.questions[index]?.correctAnswer
  ).length;
  const unansweredCount = reviewData.userAnswers.filter(answer => answer === null).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Exam Review: {reviewData.examTitle}
                </h1>
                <p className="text-sm text-gray-600">
                  Final Score: {reviewData.score}/{reviewData.totalQuestions} ({Math.round((reviewData.score / reviewData.totalQuestions) * 100)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Time Taken: {formatTime(reviewData.timeSpent)}</span>
              </div>

              <Button
                onClick={() => router.push(`/exam/${examId}/results?attemptId=${attemptId}`)}
                variant="outline"
              >
                Back to Results
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {reviewData.totalQuestions}
              </span>
              <span>
                {correctCount} correct • {wrongCount} wrong • {unansweredCount} unanswered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          {/* Question Header with Status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQuestionIndex + 1}
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
            {currentQuestion?.text ? (
              <p className="text-lg text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </p>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg text-gray-700">Question not found</p>
                <p className="text-sm text-gray-500">
                  Debug: Question index {currentQuestionIndex}, Total questions: {reviewData.questions.length}
                </p>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion?.options?.length ? (
              currentQuestion.options.map((option: string, index: number) => {
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
                } else if (isUserAnswer && isCorrectAnswer) {
                  optionStyle = "border-green-500 bg-green-50";
                  labelStyle = "border-green-500 bg-green-500 text-white";
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
              })
            ) : (
              <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">No answer options found for this question</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Debug: Options array length: {currentQuestion?.options?.length || 0}
                </p>
              </div>
            )}
          </div>

          {/* Explanation Section */}
          <div className="border-t border-gray-200 pt-6">
            {/* Database Explanation */}
            {currentQuestion?.explanation && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Explanation
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {currentQuestion.explanation}
                  </div>
                </div>
              </div>
            )}

            {/* AI Explanation */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  AI Explanation
                </h3>

                {!aiExplanations[currentQuestionIndex] && (
                  <Button
                    onClick={() => handleGetAIExplanation(currentQuestionIndex)}
                    disabled={loadingAI === currentQuestionIndex}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loadingAI === currentQuestionIndex ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold text-purple-800 mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold text-purple-800 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold text-purple-700 mb-2">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-2">{children}</ul>,
                        li: ({children}) => <li className="text-gray-700">{children}</li>,
                        p: ({children}) => <p className="mb-2 text-gray-700">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                        code: ({children}) => <code className="bg-purple-100 px-1 py-0.5 rounded text-sm">{children}</code>,
                      }}
                    >
                      {aiExplanations[currentQuestionIndex]}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
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
              disabled={currentQuestionIndex === reviewData.totalQuestions - 1}
              variant="outline"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Question Navigator */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigator Header - Always Visible */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <h3 className="font-medium text-gray-900">Question Navigator</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-green-500 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Correct ({correctCount})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-red-500 bg-red-100 rounded"></div>
                  <span className="text-gray-600">Wrong ({wrongCount})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-gray-300 bg-white rounded"></div>
                  <span className="text-gray-600">Unanswered ({unansweredCount})</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
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

          {/* Navigator Content - Collapsible */}
          {!isNavigatorCollapsed && (
            <div className="py-4">
              <div className="flex flex-wrap gap-2">
                {reviewData.questions.map((question: any, index: number) => {
                  const userAns = reviewData.userAnswers[index];
                  const correctAns = question.correctAnswer;
                  const isCurrent = index === currentQuestionIndex;

                  let buttonStyle = "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50";

                  if (isCurrent) {
                    buttonStyle = "border-blue-500 bg-blue-500 text-white";
                  } else if (userAns === null) {
                    buttonStyle = "border-gray-300 bg-white text-gray-500";
                  } else if (userAns === correctAns) {
                    buttonStyle = "border-green-500 bg-green-100 text-green-700 hover:bg-green-200";
                  } else {
                    buttonStyle = "border-red-500 bg-red-100 text-red-700 hover:bg-red-200";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg border-2 transition-all ${buttonStyle}`}
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
    </div>
  );
}
