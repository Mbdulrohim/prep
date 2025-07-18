"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { CodeRedemptionForm } from "@/components/dashboard/CodeRedemptionForm";
import { PaystackPurchase } from "@/components/dashboard/PaystackPurchase";
import { AlternativePayment } from "@/components/dashboard/AlternativePayment";
import { UserProfileSetup } from "@/components/profile/UserProfileSetup";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { TestDataButton } from "@/components/debug/TestDataButton";
import {
  CreditCard,
  Key,
  BarChart,
  Award,
  FileText,
  ChevronRight,
  Users,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useState, useEffect } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function DashboardPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const {
    stats,
    examProgress,
    recentActivity,
    loading: statsLoading,
    error,
    refreshData,
  } = useUserStats();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showAlternativePayment, setShowAlternativePayment] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      refreshData();
    }
  }, [user, userProfile, refreshData]);

  const handleProfileSave = async (name: string, university: string) => {
    setProfileLoading(true);
    try {
      await updateUserProfile(name, university);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "a while ago";
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case "rn-paper-1":
        return "bg-blue-100 text-blue-800";
      case "rn-paper-2":
      case "rm":
        return "bg-green-100 text-green-800";
      case "rphn":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (user && userProfile && !userProfile.university) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <UserProfileSetup
            initialName={userProfile.displayName}
            initialUniversity={userProfile.university}
            onSave={handleProfileSave}
            isLoading={profileLoading}
          />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Sign In Required
            </h2>
            <p className="text-slate-600 mb-6">
              Please sign in to access your personalized dashboard and exam
              progress.
            </p>
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Welcome back,{" "}
                <span className="text-blue-600">
                  {userProfile?.displayName || user.displayName || "User"}
                </span>
                !
              </h1>
              <p className="mt-2 text-lg text-slate-600 max-w-2xl">
                Track your progress, access exams, and continue your journey to
                professional excellence.
              </p>
              {userProfile?.university && (
                <p className="mt-1 text-sm text-slate-500 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  {userProfile.university}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-2xl text-white">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Exams Completed</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.totalExamsCompleted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              <span>{stats?.averageScore?.toFixed(1) || 0}% Average Score</span>
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>
                {examProgress?.filter((e) => e.isUnlocked).length || 0} Exams
                Available
              </span>
            </div>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center hover:bg-purple-200 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              <span>{showLeaderboard ? "Hide" : "View"} Leaderboard</span>
            </button>
            <TestDataButton />
          </div>
        </div>

        {showLeaderboard && (
          <div className="mb-8">
            <Leaderboard currentUserId={user?.uid} />
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-800">
                  Unable to load data
                </h3>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={refreshData}
                  className="text-sm text-red-700 hover:text-red-800 underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center mb-6">
                <BarChart className="h-5 w-5 mr-2 text-blue-600" />
                Your Exam Progress
              </h2>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : examProgress && examProgress.length > 0 ? (
                <div className="space-y-6">
                  {examProgress.map((exam) => (
                    <div key={exam.examType}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-800">
                            {exam.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getExamTypeColor(
                              exam.examType
                            )}`}
                          >
                            {exam.examType.toUpperCase().replace("-", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              exam.completed
                                ? "text-green-600"
                                : "text-slate-500"
                            }`}
                          >
                            {exam.completed
                              ? `✓ ${exam.bestScore.toFixed(0)}%`
                              : `${exam.progress.toFixed(0)}%`}
                          </span>
                          {exam.attemptsCount > 0 && (
                            <span className="text-xs text-slate-400">
                              ({exam.attemptsCount} attempt
                              {exam.attemptsCount !== 1 ? "s" : ""})
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={exam.progress} />
                      {exam.lastAttempt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Last attempt: {formatTimeAgo(exam.lastAttempt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No exam attempts yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Start your first exam to see your progress here
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Recent Activity
              </h2>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center space-x-4"
                    >
                      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const score = activity.score || 0;
                    const passed = score >= 50;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div
                          className={`p-2 rounded-lg mr-4 ${
                            passed ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {passed ? (
                            <Award className="h-5 w-5 text-green-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">
                            {activity.examName || activity.description}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            passed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {score.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No recent activity</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Complete an exam to see your activity here
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-start mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Redeem Access Code
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Unlock new exams with your access code
                  </p>
                </div>
              </div>
              <CodeRedemptionForm />
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-start mb-6">
                <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Purchase Exam Access
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-bold text-blue-600">₦5,000</span>{" "}
                    unlocks full access to your chosen exam category.
                    <br />
                    <span className="text-slate-500">
                      RN, RM, and RPHN available!
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Stripe/Card Payment */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Card Payment</h3>
                      <p className="text-sm text-gray-600">Pay with debit/credit card via Stripe</p>
                    </div>
                    <div className="text-sm text-green-600 font-medium">Instant Access</div>
                  </div>
                  <PaystackPurchase />
                </div>

                {/* Alternative Payment Methods */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Bank Transfer & Mobile Money</h3>
                      <p className="text-sm text-gray-600">Pay via bank transfer, USSD, POS, or mobile wallets</p>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">No Card Required</div>
                  </div>
                  <Button
                    onClick={() => setShowAlternativePayment(true)}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    View Payment Options
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alternative Payment Modal */}
      <AlternativePayment
        isOpen={showAlternativePayment}
        onClose={() => setShowAlternativePayment(false)}
        examCategory="RN" // This should be dynamic based on user selection
        papers={["Paper 1", "Paper 2"]}
      />
    </div>
  );
}
