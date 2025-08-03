// src/app/weekly-assessment/results/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { weeklyAssessmentManager } from "@/lib/weeklyAssessments";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  BarChart3,
  Calendar,
  ArrowRight,
  RefreshCw,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";

export default function WeeklyAssessmentResultsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);

      // First try to get results from localStorage (immediate results)
      const localResults = localStorage.getItem("lastWeeklyAssessmentResults");
      if (localResults) {
        const parsedResults = JSON.parse(localResults);
        setResults(parsedResults);
        setLoading(false);
        return;
      }

      // If no local results, try to fetch from database
      if (!user?.uid) {
        setError("Please log in to view your results.");
        setLoading(false);
        return;
      }

      // Get current assessment and user's attempt
      const currentAssessment = await weeklyAssessmentManager.getCurrentWeeklyAssessment();
      if (!currentAssessment) {
        setError("No weekly assessment found.");
        setLoading(false);
        return;
      }

      const userAttempt = await weeklyAssessmentManager.getUserAttemptForCurrentAssessment(user.uid);
      if (!userAttempt) {
        setError("No assessment attempt found. Please take the assessment first.");
        setLoading(false);
        return;
      }

      // Combine attempt data with assessment questions for display
      setResults({
        ...userAttempt,
        questions: currentAssessment.questions,
        assessmentTitle: currentAssessment.title,
      });

    } catch (error) {
      console.error("Error loading results:", error);
      setError("Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (percentage >= 80) return { text: "Very Good", color: "bg-blue-100 text-blue-800" };
    if (percentage >= 70) return { text: "Good", color: "bg-yellow-100 text-yellow-800" };
    if (percentage >= 60) return { text: "Fair", color: "bg-orange-100 text-orange-800" };
    return { text: "Needs Improvement", color: "bg-red-100 text-red-800" };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Results Unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button onClick={() => router.push("/weekly-assessment")}>
              Take Assessment
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const performanceBadge = getPerformanceBadge(results.percentage);
  const timeSpentMinutes = Math.round(results.timeSpent / 60);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
          </div>
          <p className="text-lg text-gray-600">
            {results.assessmentTitle || "Weekly Assessment"}
          </p>
          <p className="text-sm text-gray-500">
            Completed on {new Date(results.endTime).toLocaleDateString()} at {new Date(results.endTime).toLocaleTimeString()}
          </p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Performance Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${performanceBadge.color}`}>
                {performanceBadge.text}
              </span>
            </div>
            <div className="text-5xl font-bold text-white mb-2">
              {results.percentage}%
            </div>
            <div className="text-xl text-blue-100">
              {results.score} out of {results.totalQuestions} correct
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{results.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>

              <div className="text-center">
                <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{results.wrongAnswers}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{results.unanswered}</div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{timeSpentMinutes}m</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Performance</span>
                <span>{results.percentage}%</span>
              </div>
              <Progress value={results.percentage} className="h-3" />
            </div>

            {/* Performance Analysis */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Accuracy Rate:</span>
                  <span className={`ml-2 font-medium ${getPerformanceColor(results.percentage)}`}>
                    {Math.round((results.correctAnswers / (results.totalQuestions - results.unanswered)) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.round(((results.totalQuestions - results.unanswered) / results.totalQuestions) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Average Time per Question:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.round(results.timeSpent / results.totalQuestions)}s
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Questions Attempted:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {results.totalQuestions - results.unanswered}/{results.totalQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/weekly-assessment/review?attemptId=${results.id}&assessmentId=${results.assessmentId || 'current'}`)}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Review Answers
              </Button>
              
              <Button
                onClick={() => router.push("/weekly-assessment/leaderboard")}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                <Trophy className="h-5 w-5 mr-2" />
                View Leaderboard
              </Button>
              
              <Button
                onClick={() => router.push("/weekly-assessment")}
                variant="outline"
                className="flex-1"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Back to Assessment
              </Button>
              
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="flex-1 sm:flex-none sm:px-8"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Next Steps
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Check the leaderboard to see how you compare with others</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Review areas where you can improve for next week</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Practice with regular exams to maintain your skills</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Share your achievement with classmates</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Assessment Overview
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Assessment Type:</span>
                <span className="font-medium text-gray-900">Weekly Challenge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium text-gray-900">{results.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Limit:</span>
                <span className="font-medium text-gray-900">90 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Used:</span>
                <span className="font-medium text-gray-900">{formatTime(results.timeSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submission:</span>
                <span className="font-medium text-gray-900">
                  {results.autoSubmitted ? "Auto-submitted" : "Manual"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
