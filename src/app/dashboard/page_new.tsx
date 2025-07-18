"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { PaystackPurchase } from "@/components/dashboard/PaystackPurchase";
import { AlternativePayment } from "@/components/dashboard/AlternativePayment";
import { UserProfileSetup } from "@/components/profile/UserProfileSetup";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { TestDataButton } from "@/components/debug/TestDataButton";
import {
  CreditCard,
  BarChart,
  Award,
  FileText,
  ChevronRight,
  Users,
  Building,
  MessageSquare,
  Star,
  BookOpen,
  Lock,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "paystack" | "alternative"
  >("paystack");

  useEffect(() => {
    if (user && userProfile) {
      refreshData();
    }
  }, [user, userProfile, refreshData]);

  const handleProfileSave = async (name: string, university: string) => {
    setProfileLoading(true);
    try {
      await updateUserProfile(name, university);
      refreshData();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Show profile setup if incomplete
  if (!userProfile?.displayName || !userProfile?.university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="w-full max-w-md">
            <UserProfileSetup
              initialName={userProfile?.displayName || ""}
              initialUniversity={userProfile?.university || null}
              onSave={handleProfileSave}
              isLoading={profileLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has access to any exams
  const hasExamAccess = stats && stats.totalExamsCompleted > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.displayName}! 👋
          </h1>
          <p className="text-gray-600">
            {userProfile.university} • Ready to ace your nursing exams?
          </p>
        </div>

        {/* Main Content Area */}
        {!hasExamAccess ? (
          /* Payment Focus Section */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Options - Main Focus */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Get Exam Access</h2>
                      <p className="text-blue-100">
                        Choose your preferred payment method
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">10,000+</div>
                      <div className="text-sm text-blue-100">Questions</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">98%</div>
                      <div className="text-sm text-blue-100">Success Rate</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">5,000+</div>
                      <div className="text-sm text-blue-100">Students</div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSelectedPaymentMethod("paystack")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === "paystack"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-3 text-blue-600" />
                        <div className="text-left">
                          <div className="font-semibold">Card Payment</div>
                          <div className="text-sm text-gray-500">
                            Instant access
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod("alternative")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === "alternative"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-3 text-green-600" />
                        <div className="text-left">
                          <div className="font-semibold">Bank Transfer</div>
                          <div className="text-sm text-gray-500">
                            Multiple options
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Component */}
                <div className="p-6">
                  {selectedPaymentMethod === "paystack" ? (
                    <PaystackPurchase />
                  ) : (
                    <AlternativePayment
                      isOpen={true}
                      onClose={() => {}}
                      examCategory="RN"
                      papers={["Paper 1", "Paper 2"]}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Side Information */}
            <div className="space-y-6">
              {/* Features Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  What's Included
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Access to all nursing exam categories
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    10,000+ practice questions
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Detailed explanations for answers
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    AI-powered help for missed questions
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Progress tracking & analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    University leaderboards
                  </li>
                </ul>
              </div>

              {/* Support Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  Need Help?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Have questions about payment or the platform? We're here to
                  help!
                </p>
                <Button
                  onClick={() => setShowFeedback(true)}
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard for Users with Access */
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Stats Overview */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Exams Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalExamsCompleted || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Average Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.averageScore || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Study Streak
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.currentStreak || 0} days
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Available Exams */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Available Exams
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: "medical-surgical",
                      name: "Medical-Surgical Nursing",
                      questions: 2500,
                      icon: FileText,
                    },
                    {
                      id: "pediatric",
                      name: "Pediatric Nursing",
                      questions: 1800,
                      icon: Users,
                    },
                    {
                      id: "obstetric",
                      name: "Obstetric & Gynecologic Nursing",
                      questions: 1500,
                      icon: Award,
                    },
                    {
                      id: "psychiatric",
                      name: "Psychiatric Nursing",
                      questions: 1200,
                      icon: Building,
                    },
                    {
                      id: "community",
                      name: "Community Health Nursing",
                      questions: 1000,
                      icon: BarChart,
                    },
                    {
                      id: "fundamentals",
                      name: "Fundamentals of Nursing",
                      questions: 2000,
                      icon: BookOpen,
                    },
                  ].map((exam) => (
                    <Link
                      key={exam.id}
                      href={`/exam/${exam.id}`}
                      className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                            <exam.icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {exam.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {exam.questions} questions
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowLeaderboard(true)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Button>
                  <Button
                    onClick={() => setShowFeedback(true)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Feedback
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              {recentActivity && recentActivity.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Development Tools */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8">
            <TestDataButton />
          </div>
        )}
      </div>

      {/* Modals */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                University Leaderboard
              </h2>
              <Button
                onClick={() => setShowLeaderboard(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <Leaderboard />
            </div>
          </div>
        </div>
      )}

      <FeedbackForm
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  );
}
