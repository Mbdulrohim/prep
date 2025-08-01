// src/app/weekly-assessment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { weeklyAssessmentManager } from "@/lib/weeklyAssessments";
import { Button } from "@/components/ui/Button";
import { WeeklyAssessmentFlow } from "@/components/exam/WeeklyAssessmentFlow";
import {
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  Trophy,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface UserDetails {
  name: string;
  university: string;
}

export default function WeeklyAssessmentPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [userAttempt, setUserAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    university: "",
  });

  useEffect(() => {
    if (user) {
      loadWeeklyAssessmentData();
      setUserDetails({
        name: getUserDisplayName(),
        university: userProfile?.university || "Not specified",
      });
    }
  }, [user, userProfile]);

  const getUserDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    return user?.email?.split("@")[0] || "Student";
  };

  const loadWeeklyAssessmentData = async () => {
    try {
      setLoading(true);
      
      // Get current active assessment
      const assessment = await weeklyAssessmentManager.getCurrentWeeklyAssessment();
      
      if (!assessment) {
        setError("No active weekly assessment available at the moment.");
        setLoading(false);
        return;
      }

      setCurrentAssessment(assessment);

      // Check if user has already attempted this assessment
      const attempt = await weeklyAssessmentManager.getUserAttemptForCurrentAssessment(user!.uid);
      setUserAttempt(attempt);

    } catch (error) {
      console.error("Error loading weekly assessment:", error);
      setError("Failed to load weekly assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = () => {
    if (!currentAssessment) return;
    setShowAssessment(true);
  };

  const handleAssessmentComplete = async () => {
    // Refresh data after assessment completion
    await loadWeeklyAssessmentData();
    setShowAssessment(false);
    router.push("/weekly-assessment/results");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading weekly assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Assessment Unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (showAssessment && currentAssessment) {
    return (
      <WeeklyAssessmentFlow
        assessment={currentAssessment}
        userDetails={userDetails}
        onAssessmentComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Weekly Assessment</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test your knowledge with our weekly challenge. Each assessment contains 150 carefully selected questions 
            to help you prepare for your nursing exams.
          </p>
        </div>

        {/* Assessment Card */}
        {currentAssessment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                {currentAssessment.title}
              </h2>
              <p className="text-blue-100 mt-1">
                Created on {new Date(currentAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6">
              {/* Assessment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Questions</p>
                    <p className="text-xl font-bold text-gray-900">{currentAssessment.totalQuestions}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-xl font-bold text-gray-900">{currentAssessment.timeLimit} minutes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="text-xl font-bold text-gray-900">Mixed</p>
                  </div>
                </div>
              </div>

              {/* User Status */}
              {userAttempt ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Assessment Completed</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium">Score</p>
                      <p className="text-green-900 text-lg font-bold">{userAttempt.score}/{userAttempt.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Percentage</p>
                      <p className="text-green-900 text-lg font-bold">{userAttempt.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Completed</p>
                      <p className="text-green-900 text-lg font-bold">
                        {new Date(userAttempt.endTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Button
                      onClick={() => router.push("/weekly-assessment/results")}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      View Detailed Results
                    </Button>
                    <Button
                      onClick={() => router.push("/weekly-assessment/leaderboard")}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start?</h3>
                  <p className="text-blue-700 mb-4">
                    You have not attempted this week's assessment yet. Make sure you have {currentAssessment.timeLimit} minutes 
                    of uninterrupted time before starting.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-blue-700 mb-4">
                    <Users className="h-4 w-4" />
                    <span>Student: {userDetails.name}</span>
                    <span>•</span>
                    <span>University: {userDetails.university}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!userAttempt ? (
                  <Button
                    onClick={handleStartAssessment}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    size="lg"
                  >
                    Start Assessment
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/weekly-assessment/leaderboard")}
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                    size="lg"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    View Leaderboard
                  </Button>
                )}
                
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Complete 150 questions within 90 minutes</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Each question has multiple choice answers</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Get immediate results and detailed feedback</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span>Compare your performance on the leaderboard</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Tips</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span>Read each question carefully before answering</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span>Use the flag feature for questions you want to review</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span>Keep track of time using the timer display</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span>Submit early if you've answered all questions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
