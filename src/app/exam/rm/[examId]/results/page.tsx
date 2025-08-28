// src/app/exam/rm/[examId]/results/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  BarChart3,
  ArrowLeft,
  Download,
  Share2,
  Crown,
  Star,
} from "lucide-react";

// RM-specific imports
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";

interface ExamResultsData {
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  timeSpent: number;
  timeTaken: string;
  grade: string;
  passed: boolean;
  rank?: number;
  totalParticipants?: number;
}

export default function RMExamResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const isImmediate = searchParams.get("immediate") === "true";

  const [rmExamData, setRmExamData] = useState<RMExamData | null>(null);
  const [examAttempt, setExamAttempt] = useState<RMExamAttempt | null>(null);
  const [resultsData, setResultsData] = useState<ExamResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadResultsData();
  }, [user, examId]);

  const loadResultsData = async () => {
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

      // Fetch the latest exam attempt
      const attempts = await rmExamAttemptManager.getUserRMExamAttempts(user!.uid);
      const examAttempts = attempts.filter(attempt => attempt.examId === examId);
      const latestAttempt = examAttempts[0]; // Latest attempt is first

      if (!latestAttempt) {
        setError("No exam attempt found");
        return;
      }

      setExamAttempt(latestAttempt);

      // Calculate results data
      const {
        score,
        correctAnswers,
        wrongAnswers,
        timeSpent,
        assignedQuestions,
      } = latestAttempt;

      const totalQuestions = assignedQuestions.length;
      const incorrectAnswers = wrongAnswers;
      const percentage = (score / totalQuestions) * 100;
      const unansweredQuestions = totalQuestions - correctAnswers - incorrectAnswers;
      const timeTaken = formatTime(timeSpent);
      const grade = getGrade(percentage);
      const passed = percentage >= 50; // 50% pass mark

      setResultsData({
        score,
        percentage,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        timeSpent,
        timeTaken,
        grade,
        passed,
      });
    } catch (error) {
      console.error("Error loading results:", error);
      setError("Failed to load exam results");
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

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const getPerformanceMessage = (percentage: number): { message: string; color: string } => {
    if (percentage >= 90) {
      return { message: "Outstanding Performance! 🌟", color: "text-yellow-600" };
    }
    if (percentage >= 80) {
      return { message: "Excellent Work! 🎉", color: "text-green-600" };
    }
    if (percentage >= 70) {
      return { message: "Good Job! 👍", color: "text-blue-600" };
    }
    if (percentage >= 60) {
      return { message: "Fair Performance 📚", color: "text-orange-600" };
    }
    if (percentage >= 50) {
      return { message: "You Passed! ✅", color: "text-green-600" };
    }
    return { message: "Need More Practice 📖", color: "text-red-600" };
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
            <p className="text-gray-600">Loading your RM exam results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rmExamData || !resultsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h1>
            <p className="text-gray-600 mb-6">{error || "Unable to load exam results"}</p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const performance = getPerformanceMessage(resultsData.percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with RM Branding */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">RM Exam Results</h1>
          </div>
          <p className="text-gray-600">{rmExamData.title}</p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
          {/* Performance Header */}
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${
              resultsData.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {resultsData.percentage.toFixed(1)}%
            </div>
            <div className={`text-2xl font-semibold mb-2 ${performance.color}`}>
              {performance.message}
            </div>
            <div className="text-lg text-gray-600">
              Grade: <span className="font-semibold">{resultsData.grade}</span>
            </div>
          </div>

          {/* Pass/Fail Status */}
          <div className={`text-center p-4 rounded-lg mb-8 ${
            resultsData.passed
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {resultsData.passed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className={`text-lg font-semibold ${
                resultsData.passed ? 'text-green-700' : 'text-red-700'
              }`}>
                {resultsData.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              resultsData.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {resultsData.passed
                ? 'Congratulations! You have successfully passed this RM exam.'
                : 'You need at least 50% to pass. Keep practicing and try again!'
              }
            </p>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {resultsData.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {resultsData.incorrectAnswers}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {resultsData.unansweredQuestions}
              </div>
              <div className="text-sm text-gray-600">Unanswered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resultsData.timeTaken}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{resultsData.correctAnswers}/{resultsData.totalQuestions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(resultsData.correctAnswers / resultsData.totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push(`/exam/rm/${examId}/review`)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Review Answers</span>
            </Button>
            
            <Button
              onClick={() => router.push("/exam/rm")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Take Another RM Exam</span>
            </Button>
          </div>
        </div>

        {/* Exam Details Card */}
        <div className="bg-white rounded-lg shadow border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Exam:</span>
              <span className="font-medium">{rmExamData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {examAttempt ? new Date(examAttempt.startTime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{rmExamData.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Questions:</span>
              <span className="font-medium">{resultsData.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Score:</span>
              <span className="font-medium">{resultsData.score}/{resultsData.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attempt:</span>
              <span className="font-medium">#1</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            {resultsData.passed ? (
              <>
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <p className="text-gray-700">
                    Great job! You've successfully passed this RM exam. Consider taking more practice exams to maintain your knowledge.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <p className="text-gray-700">
                    Try other RM exam categories to broaden your preparation scope.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-orange-500 mt-0.5" />
                  <p className="text-gray-700">
                    Focus on reviewing the questions you got wrong and understanding the correct answers.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                  <p className="text-gray-700">
                    Consider spending more time studying before your next attempt.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
