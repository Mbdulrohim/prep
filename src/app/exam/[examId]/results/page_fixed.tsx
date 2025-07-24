"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { examAttemptManager, ExamAttempt } from "@/lib/examAttempts";

interface ExamResults {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  totalQuestions: number;
  timeSpent: number;
  autoSubmitted?: boolean;
  questions?: any[];
  userAnswers?: any[];
  endTime: Date;
  createdAt: Date;
}

export default function ExamResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const examId = params.examId as string;
  const attemptId = searchParams.get("attemptId");
  const isImmediate = searchParams.get("immediate") === "true";
  const isAutoSubmit = searchParams.get("autoSubmit") === "true";

  const [results, setResults] = useState<ExamResults | null>(null);
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    loadResults();
  }, [isImmediate, attemptId, user]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // First check localStorage for immediate results
      if (isImmediate) {
        const storedResults = localStorage.getItem("lastExamResults");
        if (storedResults) {
          try {
            const parsed = JSON.parse(storedResults);
            console.log("Loading immediate results:", parsed);
            setResults(parsed);
            setLoading(false);

            // Clear localStorage after loading
            localStorage.removeItem("lastExamResults");
            return;
          } catch (parseError) {
            console.error("Error parsing stored results:", parseError);
          }
        }
      }

      // Fallback to database lookup
      if (user?.uid && attemptId) {
        const attempt = await examAttemptManager.getExamAttemptForReview(
          attemptId,
          user.uid
        );
        if (attempt) {
          setExamAttempt(attempt);
          setResults({
            id: attempt.id,
            examId: attempt.examId,
            examTitle: attempt.examId, // You might want to fetch the actual title
            score: attempt.score,
            percentage: attempt.percentage,
            correctAnswers: attempt.correctAnswers,
            wrongAnswers: attempt.wrongAnswers,
            unanswered: attempt.unanswered,
            totalQuestions: attempt.questions?.length || 0,
            timeSpent: attempt.timeSpent,
            questions: attempt.questions,
            userAnswers: attempt.userAnswers,
            endTime: attempt.endTime,
            createdAt: attempt.createdAt,
          });
        } else {
          setError("Exam results not found.");
        }
      } else {
        setError("No exam data available. Please retake the exam.");
      }
    } catch (error) {
      console.error("Error loading results:", error);
      setError("Failed to load exam results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const isPassing = (percentage: number): boolean => {
    return percentage >= 70;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Calculating Your Results...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your exam answers and calculate your
              score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Results Not Available
            </h2>
            <p className="text-gray-600 mb-6">{error || "No results found"}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-8 text-center">
            {isAutoSubmit && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="text-orange-800 text-sm">
                  Time expired - Exam was automatically submitted
                </p>
              </div>
            )}

            <div className="mb-6">
              {isPassing(results.percentage) ? (
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              ) : (
                <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isPassing(results.percentage)
                  ? "Congratulations!"
                  : "Exam Completed"}
              </h1>

              <p className="text-lg text-gray-600 mb-4">{results.examTitle}</p>

              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${getGradeColor(
                      results.percentage
                    )}`}
                  >
                    {results.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${getGradeColor(
                      results.percentage
                    )}`}
                  >
                    {getGradeLetter(results.percentage)}
                  </div>
                  <div className="text-sm text-gray-600">Grade</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {results.correctAnswers}/{results.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
              </div>
            </div>

            <Progress
              value={results.percentage}
              className="w-full max-w-md mx-auto mb-4"
            />

            <p
              className={`text-lg font-medium ${
                isPassing(results.percentage)
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {isPassing(results.percentage)
                ? "🎉 You passed!"
                : "Keep studying and try again!"}
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {results.correctAnswers}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Correct Answers
            </h3>
            <p className="text-sm text-gray-600">
              {Math.round(
                (results.correctAnswers / results.totalQuestions) * 100
              )}
              % of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {results.wrongAnswers}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Wrong Answers</h3>
            <p className="text-sm text-gray-600">
              {Math.round(
                (results.wrongAnswers / results.totalQuestions) * 100
              )}
              % of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {results.unanswered}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Unanswered</h3>
            <p className="text-sm text-gray-600">
              {Math.round((results.unanswered / results.totalQuestions) * 100)}%
              of total
            </p>
          </div>
        </div>

        {/* Time Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Clock className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Time Statistics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(results.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-700">
                {Math.round(results.timeSpent / results.totalQuestions)}s
              </div>
              <div className="text-sm text-gray-600">Average per Question</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {results.questions && results.userAnswers && (
            <Button
              onClick={() => setShowReview(!showReview)}
              variant="outline"
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {showReview ? "Hide Review" : "Review Answers"}
            </Button>
          )}

          <Button onClick={() => router.push("/dashboard")} className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => router.push(`/exam/${examId}`)}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Exam
          </Button>
        </div>

        {/* Question Review */}
        {showReview && results.questions && results.userAnswers && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Question Review
            </h3>

            <div className="space-y-6">
              {results.questions.map((question: any, index: number) => {
                const userAnswer = results.userAnswers![index];
                const isCorrect = userAnswer === question.correctAnswer;
                const isUnanswered =
                  userAnswer === null || userAnswer === undefined;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isUnanswered
                        ? "border-yellow-200 bg-yellow-50"
                        : isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      {isUnanswered ? (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-1" />
                      ) : isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-1" />
                      )}

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {index + 1}
                        </h4>
                        <p className="text-gray-700 mb-3">
                          {question.question}
                        </p>

                        <div className="space-y-2">
                          {question.options.map(
                            (option: string, optionIndex: number) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded text-sm ${
                                  optionIndex === question.correctAnswer
                                    ? "bg-green-100 text-green-800 font-medium"
                                    : optionIndex === userAnswer && !isCorrect
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-50 text-gray-700"
                                }`}
                              >
                                {option}
                                {optionIndex === question.correctAnswer &&
                                  " ✓ (Correct)"}
                                {optionIndex === userAnswer &&
                                  optionIndex !== question.correctAnswer &&
                                  " ✗ (Your answer)"}
                              </div>
                            )
                          )}
                        </div>

                        {isUnanswered && (
                          <p className="text-yellow-700 text-sm mt-2">
                            You did not answer this question.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
