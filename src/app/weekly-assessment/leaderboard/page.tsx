// src/app/weekly-assessment/leaderboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { weeklyAssessmentManager } from "@/lib/weeklyAssessments";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Medal,
  Award,
  Users,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Crown,
  Star,
  Zap,
} from "lucide-react";

export default function WeeklyAssessmentLeaderboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);

      // Get current assessment
      const assessment = await weeklyAssessmentManager.getCurrentWeeklyAssessment();
      if (!assessment) {
        setError("No active weekly assessment found.");
        setLoading(false);
        return;
      }

      setCurrentAssessment(assessment);

      // Get leaderboard for current assessment
      const leaderboardData = await weeklyAssessmentManager.getWeeklyAssessmentLeaderboard(
        assessment.id,
        50 // Get top 50
      );

      setLeaderboard(leaderboardData);

      // Find user's rank if they participated
      if (user?.uid) {
        const userIndex = leaderboardData.findIndex(entry => entry.userId === user.uid);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }
      }

    } catch (error) {
      console.error("Error loading leaderboard:", error);
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-500 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Leaderboard Unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button onClick={() => router.push("/weekly-assessment")}>
              Back to Assessment
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Weekly Assessment Leaderboard</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {currentAssessment?.title || "Weekly Assessment Rankings"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Created on {new Date(currentAssessment?.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/weekly-assessment")}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment
          </Button>
        </div>

        {/* User's Rank Card (if participated) */}
        {userRank && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(userRank)}`}>
                  {userRank <= 3 ? getRankIcon(userRank) : <span className="font-bold">#{userRank}</span>}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Your Ranking</h3>
                  <p className="text-blue-700">
                    You are ranked #{userRank} out of {leaderboard.length} participants
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/weekly-assessment/results")}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                View Results
              </Button>
            </div>
          </div>
        )}

        {/* Leaderboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{leaderboard.length}</div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.percentage, 0) / leaderboard.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {leaderboard.length > 0 ? leaderboard[0]?.percentage || 0 : 0}%
            </div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Rankings</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600">Be the first to take this week's assessment!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => {
                    const position = index + 1;
                    const isCurrentUser = user?.uid === entry.userId;

                    return (
                      <tr
                        key={entry.id}
                        className={`${
                          isCurrentUser ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
                        } ${position <= 3 ? "bg-gradient-to-r from-yellow-50 to-white" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadgeColor(position)}`}>
                              {position <= 3 ? (
                                getRankIcon(position)
                              ) : (
                                <span className="text-sm font-bold">#{position}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className={`text-sm font-medium ${isCurrentUser ? "text-blue-900" : "text-gray-900"}`}>
                                {entry.userName}
                                {isCurrentUser && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Completed: {new Date(entry.endTime).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.userUniversity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.score}/{entry.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.correctAnswers} correct
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm font-bold ${
                              entry.percentage >= 80 ? "text-green-600" :
                              entry.percentage >= 60 ? "text-yellow-600" :
                              "text-red-600"
                            }`}>
                              {entry.percentage}%
                            </div>
                            {position <= 3 && (
                              <Zap className="h-4 w-4 text-yellow-500 ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            {formatTime(entry.timeSpent)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            onClick={() => router.push("/weekly-assessment")}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Back to Assessment
          </Button>
          
          {userRank && (
            <Button
              onClick={() => router.push("/weekly-assessment/results")}
              variant="outline"
              className="flex-1"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              View My Results
            </Button>
          )}
          
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
  );
}
