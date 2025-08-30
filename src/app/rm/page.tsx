// src/app/rm/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  standaloneRMExamManager,
  StandaloneRMExam,
  StandaloneRMAttempt,
} from "../../lib/standaloneRMExams";
import {
  Calendar,
  Clock,
  Trophy,
  AlertCircle,
  Play,
  CreditCard,
  CheckCircle,
  BookOpen,
  Target,
  Crown,
  Lock,
} from "lucide-react";

const RMExamPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rmExams, setRmExams] = useState<StandaloneRMExam[]>([]);
  const [userAttempts, setUserAttempts] = useState<
    Record<string, StandaloneRMAttempt[]>
  >({});
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"RM1" | "RM2">("RM1");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchRMData(currentUser);
      } else {
        router.push("/auth/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchRMData = async (currentUser: User) => {
    try {
      // Get all active RM exams
      const exams = await standaloneRMExamManager.getActiveRMExams();
      setRmExams(exams);

      // Check user's overall RM access (not per-exam, but per-category)
      const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
      const hasRMAccess = await rmUserAccessManager.hasRMAccess(
        currentUser.uid
      );

      // Set access for all exams based on overall RM access
      const accessMap: Record<string, boolean> = {};
      exams.forEach((exam) => {
        accessMap[exam.id] = hasRMAccess;
      });
      setUserAccess(accessMap);

      // Get user's exam history
      const userHistory = await standaloneRMExamManager.getUserExamHistory(
        currentUser.uid
      );
      const historyByExam: Record<string, StandaloneRMAttempt[]> = {};
      userHistory.forEach((attempt) => {
        if (!historyByExam[attempt.examId]) {
          historyByExam[attempt.examId] = [];
        }
        historyByExam[attempt.examId].push(attempt);
      });
      setUserAttempts(historyByExam);
    } catch (error) {
      console.error("Error fetching RM data:", error);
    }
  };

  // Refresh access function for use after payments
  const refreshRMAccess = async () => {
    if (!user) return;

    try {
      console.log("🔄 Refreshing RM access for user:", user.uid);
      const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
      const hasRMAccess = await rmUserAccessManager.hasRMAccess(user.uid);

      // Update access for all exams
      const accessMap: Record<string, boolean> = {};
      rmExams.forEach((exam) => {
        accessMap[exam.id] = hasRMAccess;
      });
      setUserAccess(accessMap);
      console.log("✅ RM access refreshed. Has access:", hasRMAccess);
    } catch (error) {
      console.error("❌ Error refreshing RM access:", error);
    }
  };

  // Add effect to listen for storage events (payment success from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rm_payment_success" && e.newValue) {
        console.log("🎉 RM payment success detected, refreshing access...");
        refreshRMAccess();
        // Clear the storage event
        localStorage.removeItem("rm_payment_success");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, rmExams]);

  const handleStartExam = async (exam: StandaloneRMExam) => {
    if (!user) return;

    // Check if user has access
    if (!userAccess[exam.id]) {
      // Redirect to payment page
      router.push(`/rm/payment?examId=${exam.id}`);
      return;
    }

    // Check if user has completed this exam (to show results instead of blocking)
    const attempts = userAttempts[exam.id] || [];
    const completedAttempt = attempts.find((attempt) => attempt.completed);

    if (completedAttempt) {
      // Check if they can start another attempt or if they've reached max attempts
      try {
        const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
        const canStart = await rmUserAccessManager.canStartRMExam(
          user.uid,
          exam.id
        );

        if (
          !canStart.canStart &&
          canStart.reason?.includes("Maximum attempts")
        ) {
          // User has reached max attempts, show results instead of blocking
          console.log("🎯 User has max attempts, redirecting to results...");
          router.push(
            `/exam/rm/${exam.id}/results?attemptId=${completedAttempt.id}`
          );
          return;
        }
      } catch (error) {
        console.error("Error checking attempt limits:", error);
        // Fall through to normal exam start if check fails
      }
    }

    // Start exam normally
    router.push(`/rm/${exam.id}`);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Available now";
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getExamStatus = (exam: StandaloneRMExam) => {
    const hasAccess = userAccess[exam.id];
    const attempts = userAttempts[exam.id] || [];

    if (!hasAccess && exam.requiresPayment) {
      return { status: "payment_required", color: "orange", icon: CreditCard };
    }

    if (attempts.length > 0) {
      const bestAttempt = attempts.reduce((best, current) =>
        current.percentage > best.percentage ? current : best
      );
      return {
        status: "completed",
        color: "green",
        icon: CheckCircle,
        score: bestAttempt.percentage,
        attempts: attempts.length,
      };
    }

    if (hasAccess) {
      return { status: "available", color: "blue", icon: Play };
    }

    return { status: "locked", color: "gray", icon: Lock };
  };

  // Filter exams by paper type - RM 1 is Papers A&B, RM 2 is Papers C&D
  const rm1Exams = rmExams.filter(
    (exam) => exam.paper === "A" || exam.paper === "B"
  );
  const rm2Exams = rmExams.filter(
    (exam) => exam.paper === "C" || exam.paper === "D"
  );
  const currentExams = activeTab === "RM1" ? rm1Exams : rm2Exams;

  // Check if user has any access at all
  const hasAnyAccess = Object.values(userAccess).some(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RM exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back to Dashboard
          </button>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">RM Exams</h1>
                <p className="text-lg text-blue-100 mb-6">
                  Practice with real RM exam questions and test your knowledge
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>150 minutes per exam</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    <span>250 questions per paper</span>
                  </div>
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    <span>Professional level</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <BookOpen className="h-24 w-24 text-blue-200" />
              </div>
            </div>
          </div>

          {/* Access Control Warning */}
          {!hasAnyAccess && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <Lock className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    RM Access Required
                  </h3>
                  <p className="text-orange-700 mb-4">
                    You need to purchase RM access to take these exams. Get
                    access to both RM 1 and RM 2 papers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => router.push("/dashboard/rm")}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <CreditCard className="h-4 w-4 mr-2 inline" />
                      Purchase RM Access (₦2,000)
                    </button>
                    <button
                      onClick={() => router.push("/dashboard/rm")}
                      className="border border-orange-600 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Redeem Access Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for RM 1 and RM 2 */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab("RM1")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "RM1"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              RM 1 (Papers A & B)
            </button>
            <button
              onClick={() => setActiveTab("RM2")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "RM2"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              RM 2 (Papers C & D)
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Available Papers
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentExams.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      currentExams.filter((exam) => {
                        const attempts = userAttempts[exam.id] || [];
                        return attempts.length > 0;
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Best Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const currentAttempts = currentExams.flatMap(
                        (exam) => userAttempts[exam.id] || []
                      );
                      return currentAttempts.length > 0
                        ? Math.max(
                            ...currentAttempts.map((a) => a.percentage)
                          ).toFixed(1) + "%"
                        : "0%";
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Access Level
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentExams.filter((exam) => userAccess[exam.id]).length}/
                    {currentExams.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RM Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentExams.map((exam) => {
            const examStatus = getExamStatus(exam);
            const StatusIcon = examStatus.icon;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {exam.title}
                      </h3>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Paper {exam.paper}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {activeTab === "RM1" ? "RM 1" : "RM 2"}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        examStatus.color === "green"
                          ? "bg-green-100"
                          : examStatus.color === "blue"
                          ? "bg-blue-100"
                          : examStatus.color === "orange"
                          ? "bg-orange-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <StatusIcon
                        className={`h-5 w-5 ${
                          examStatus.color === "green"
                            ? "text-green-600"
                            : examStatus.color === "blue"
                            ? "text-blue-600"
                            : examStatus.color === "orange"
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  {exam.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {exam.description}
                    </p>
                  )}

                  {/* Exam Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{exam.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2" />
                      <span>{exam.totalQuestions} questions</span>
                    </div>
                    {exam.requiresPayment && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>
                          {exam.currency} {exam.price}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status and Action */}
                  <div className="border-t pt-4">
                    {examStatus.status === "completed" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Best Score</span>
                          <span>{examStatus.score?.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Attempts</span>
                          <span>{examStatus.attempts}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleStartExam(exam)}
                      disabled={examStatus.status === "locked"}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        examStatus.status === "payment_required"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : examStatus.status === "available"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : examStatus.status === "completed"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {examStatus.status === "payment_required" &&
                        "Purchase Access"}
                      {examStatus.status === "available" && "Start Exam"}
                      {examStatus.status === "completed" &&
                        "View Results / Retake"}
                      {examStatus.status === "locked" && "Locked"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {currentExams.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} Exams Available
            </h3>
            <p className="text-gray-600">
              {activeTab === "RM1"
                ? "Check back later for RM 1 exam papers (A & B)."
                : "Check back later for RM 2 exam papers (C & D)."}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/rm/leaderboard")}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Trophy className="h-6 w-6 text-yellow-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">View Leaderboard</p>
                <p className="text-sm text-gray-600">See top performers</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/rm/history")}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Exam History</p>
                <p className="text-sm text-gray-600">Review past attempts</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/rm/study-guide")}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Study Guide</p>
                <p className="text-sm text-gray-600">Preparation materials</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RMExamPage;
