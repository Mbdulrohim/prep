"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { PricingPlans } from "@/components/dashboard/PricingPlans";
import { CodeRedemptionForm } from "@/components/dashboard/CodeRedemptionForm";
import { UserProfileSetup } from "@/components/profile/UserProfileSetup";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
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
  Lock,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
  LogIn,
  AlertTriangle,
  Eye,
  BookOpen,
  Calendar,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useState, useEffect } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAllExams, ExamData } from "@/lib/examData";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { examAttemptManager, ExamAttempt } from "@/lib/examAttempts";
// RM System imports - separate from RN system
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";

// Admin access control
const ADMIN_EMAILS = [
  "doyextech@gmail.com",
  "ibrahimadekunle3030@gmail.com",
  "adekunleibrahim6060@gmail.com",
  "suleimanjemilat2009@gmail.com",
  "raregem015@gmail.com",
];

export default function DashboardPage() {
  const { user, userProfile, updateUserProfile, signInWithGoogle } = useAuth();
  const router = useRouter();
  const {
    stats,
    examProgress,
    recentActivity,
    loading: statsLoading,
    error,
    refreshData,
  } = useUserStats();

  // Real-time data hook
  const {
    globalStats,
    userStats: realTimeUserStats,
    leaderboard: realTimeLeaderboard,
    recentAttempts,
    loading: realTimeLoading,
    error: realTimeError,
  } = useRealTimeData();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<"flutterwave">("flutterwave");
  const [rnExams, setRnExams] = useState<ExamData[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [userAttempts, setUserAttempts] = useState<ExamAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  
  // RM-specific state - separate from RN system
  const [rmExams, setRmExams] = useState<RMExamData[]>([]);
  const [rmExamsLoading, setRmExamsLoading] = useState(true);
  const [rmUserAttempts, setRmUserAttempts] = useState<RMExamAttempt[]>([]);
  const [rmAttemptsLoading, setRmAttemptsLoading] = useState(true);
  const [rmUserAccess, setRmUserAccess] = useState<any>(null);
  const [rmAccessLoading, setRmAccessLoading] = useState(true);
  
  const [examAvailability, setExamAvailability] = useState<{
    [key: string]: {
      isAvailable: boolean;
      reason?: string;
      scheduleInfo?: any;
    };
  }>({});
  const [userAccess, setUserAccess] = useState<any>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      refreshData();
      checkUserAccess();
      checkExamAvailability();
      loadUserAttempts();
    }
  }, [user, userProfile, refreshData]);

  // Check user access to exams with enhanced debugging
  const checkUserAccess = async () => {
    if (!user?.uid) return;

    try {
      setAccessLoading(true);
      const { UserAccessManager } = await import("@/lib/userAccess");
      const accessManager = new UserAccessManager();
      const access = await accessManager.getUserAccess(user.uid);
      setUserAccess(access);
    } catch (error) {
      console.error("Error checking user access:", error);
    } finally {
      setAccessLoading(false);
    }
  };

  const checkExamAvailability = async () => {
    try {
      console.log("Checking exam availability...");
      const { getExamAvailabilityStatus } = await import("@/lib/examData");

      // Check availability for all exam types
      const examIds = [
        "rn-paper-1",
        "rn-paper-2",
        "rm-paper-1",
        "rm-paper-2",
        "rphn-paper-1",
        "rphn-paper-2",
      ];
      const availabilityPromises = examIds.map(async (examId) => {
        console.log(`Checking availability for: ${examId}`);
        const availability = await getExamAvailabilityStatus(examId);
        console.log(`Availability result for ${examId}:`, availability);
        return { examId, ...availability };
      });

      const results = await Promise.all(availabilityPromises);
      const availabilityMap = results.reduce((acc, result) => {
        acc[result.examId] = {
          isAvailable: result.isAvailable,
          reason: result.reason,
          scheduleInfo: result.scheduleInfo,
        };
        return acc;
      }, {} as typeof examAvailability);

      setExamAvailability(availabilityMap);
      console.log("Final exam availability map:", availabilityMap);
    } catch (error) {
      console.error("Error checking exam availability:", error);
    }
  };

  // Refresh user access from server
  const refreshUserAccess = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/refresh-user-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const result = await response.json();
      console.log("Refresh access result:", result);

      if (result.success) {
        // Update local state
        await checkUserAccess();
        // Also refresh user stats and attempts
        refreshData();
        loadUserAttempts();
      }
    } catch (error) {
      console.error("Error refreshing user access:", error);
    }
  };

  // Load RN exams
  useEffect(() => {
    const loadRnExams = async () => {
      try {
        setExamsLoading(true);
        const allExams = await fetchAllExams();
        // Filter for RN exams only and ensure they're available
        const filteredExams = allExams.filter(
          (exam) => exam.category === "RN" && exam.available
        );
        setRnExams(filteredExams);
      } catch (error) {
        console.error("Failed to load RN exams:", error);
      } finally {
        setExamsLoading(false);
      }
    };

    loadRnExams();
  }, []);

  // Load user exam attempts
  const loadUserAttempts = async () => {
    if (!user?.uid) return;

    try {
      setAttemptsLoading(true);
      const attempts = await examAttemptManager.getUserExamAttempts(user.uid);
      setUserAttempts(attempts);
    } catch (error) {
      console.error("Failed to load user attempts:", error);
    } finally {
      setAttemptsLoading(false);
    }
  };

  // Load user attempts when user is available
  useEffect(() => {
    if (user?.uid) {
      loadUserAttempts();
      loadRMData(); // Load RM data alongside RN data
    }
  }, [user?.uid]);

  // RM-specific data loading functions
  const loadRMData = async () => {
    if (!user?.uid) return;
    
    await Promise.all([
      loadRMExams(),
      checkRMUserAccess(),
      loadRMUserAttempts(),
    ]);
  };

  const loadRMExams = async () => {
    try {
      setRmExamsLoading(true);
      const exams = await fetchRMExams();
      setRmExams(exams);
    } catch (error) {
      console.error("Failed to load RM exams:", error);
    } finally {
      setRmExamsLoading(false);
    }
  };

  const checkRMUserAccess = async () => {
    if (!user?.uid) return;

    try {
      setRmAccessLoading(true);
      const access = await rmUserAccessManager.getRMUserAccess(user.uid);
      setRmUserAccess(access);
    } catch (error) {
      console.error("Error checking RM user access:", error);
    } finally {
      setRmAccessLoading(false);
    }
  };

  const loadRMUserAttempts = async () => {
    if (!user?.uid) return;

    try {
      setRmAttemptsLoading(true);
      const attempts = await rmExamAttemptManager.getUserRMExamAttempts(user.uid);
      setRmUserAttempts(attempts);
    } catch (error) {
      console.error("Failed to load RM user attempts:", error);
    } finally {
      setRmAttemptsLoading(false);
    }
  };

  const refreshRMUserAccess = async () => {
    await checkRMUserAccess();
  };

  const handleProfileSave = async (name: string, university: string) => {
    setProfileLoading(true);
    try {
      await updateUserProfile(name, university);
      refreshData();
      loadUserAttempts();
      checkUserAccess();
      // Also refresh RM data
      loadRMData();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Development test functions
  const testPaymentVerification = async () => {
    if (!user) return;
    console.log("🧪 Testing Payment Verification...");

    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: "test_txn_" + Date.now(),
          txRef: "test_ref_" + Date.now(),
          userId: user.uid,
        }),
      });

      const result = await response.json();
      console.log("Payment test result:", result);
      alert(
        `Payment test: ${
          result.success ? "SUCCESS" : "FAILED"
        } - Check console for details`
      );

      if (result.success) {
        await refreshUserAccess();
      }
    } catch (error) {
      console.error("Payment test error:", error);
      alert(
        `Payment test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testExamFlow = () => {
    console.log("🎯 Testing Exam Flow...");
    console.log("User Profile:", userProfile);
    console.log("User Access:", userAccess);
    console.log("Has Valid Access:", userAccess?.hasValidAccess);
    alert("Exam flow test - Check console for details");
  };

  // Handle logged-out users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Nigerian Nursing Exam Prep Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ace your RN, RM, and RPHN exams with our comprehensive question
              bank
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Comprehensive Coverage
                </h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>10,000+ practice questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Paper 1 & Paper 2 for each exam</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>RN, RM, and RPHN categories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>AI-powered explanations</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Smart Learning
                </h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced analytics & progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Unlimited practice attempts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Performance insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>90 days access</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-semibold text-gray-900">
                Start Your Journey
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Join thousands of successful nursing students. Only ₦1,000 covers
              both Paper 1 & Paper 2 for any exam category.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={signInWithGoogle}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-all"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In with Google
              </Button>
              <Link href="/leaderboard">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold"
                >
                  <Award className="w-5 h-5 mr-2" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Access full features and payment options after signing in
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup if incomplete
  if (!userProfile?.displayName || !userProfile?.university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="w-full max-w-md">
            <UserProfileSetup
              initialName={userProfile?.displayName || ""}
              initialUniversity={userProfile?.university || ""}
              onSave={handleProfileSave}
              isLoading={profileLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state - only block on essential data (RN access and stats)
  // RM loading is handled separately and won't block the entire dashboard
  if (statsLoading || accessLoading) {
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

  // Check if user has access to any exams - Admin gets unlimited access
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  
  // For non-admin users, check if they have valid active access
  // Since revoked users have their access completely removed, we just check if userAccess exists and is active
  const hasValidAccess = userAccess && userAccess.isActive;
    
  const hasExamAccess = isAdmin || hasValidAccess;

  console.log("🔍 Dashboard Access Check:", {
    isAdmin,
    userAccess: userAccess ? {
      isActive: userAccess.isActive,
      examCategory: userAccess.examCategory,
    } : null,
    hasValidAccess,
    hasExamAccess
  });

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
                      <FileText className="h-8 w-8 mx-auto mb-2" />
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
                  <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="text-left">
                        <div className="font-semibold">Card Payment</div>
                        <div className="text-sm text-gray-500">
                          Pay securely with Flutterwave - Instant access
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Component */}
                <div className="p-6 space-y-6">
                  {/* Access Code Redemption */}
                  <CodeRedemptionForm
                    onSuccess={() => {
                      refreshData();
                      checkUserAccess();
                    }}
                  />

                  {/* OR Divider */}
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500 bg-white">
                      OR
                    </span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Pricing Plans */}
                  <PricingPlans />
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
          <div>
            {/* Weekly Assessment Hero Section */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-2xl text-white p-8 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>

                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold">
                            Weekly Assessment
                          </h2>
                          <p className="text-purple-100">
                            Your premier nursing knowledge challenge
                          </p>
                        </div>
                      </div>

                      <p className="text-lg text-white/90 mb-6 max-w-2xl">
                        Test your comprehensive nursing knowledge with our
                        curated weekly assessment. Featuring 150 carefully
                        selected questions designed to challenge and educate.
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">150</div>
                          <div className="text-sm text-purple-200">
                            Questions
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">90</div>
                          <div className="text-sm text-purple-200">Minutes</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 lg:w-64">
                      <Button
                        onClick={() => router.push("/weekly-assessment")}
                        className="bg-white text-purple-600 hover:bg-gray-50 font-semibold py-4 text-lg shadow-lg"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Start Assessment
                      </Button>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <Button
                          onClick={() =>
                            router.push("/weekly-assessment/leaderboard")
                          }
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 text-xs py-2"
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Leaderboard
                        </Button>
                        <Button
                          onClick={() =>
                            router.push("/weekly-assessment/results")
                          }
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 text-xs py-2"
                        >
                          <BarChart className="h-4 w-4 mr-1" />
                          Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                        {
                          userAttempts.filter((attempt) => attempt.completed)
                            .length
                        }
                      </p>
                      <div className="inline-flex items-center text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-1"></div>
                        Live Data
                      </div>
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
                        {userAttempts.length > 0
                          ? Math.round(
                              userAttempts.reduce(
                                (sum, attempt) =>
                                  sum + (attempt.percentage || 0),
                                0
                              ) / userAttempts.length
                            )
                          : 0}
                        %
                      </p>
                      <div className="inline-flex items-center text-xs text-blue-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                        Live Data
                      </div>
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
                        Best Score
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userAttempts.length > 0
                          ? Math.max(
                              ...userAttempts.map(
                                (attempt) => attempt.percentage || 0
                              )
                            )
                          : 0}
                        %
                      </p>
                      <div className="inline-flex items-center text-xs text-orange-600">
                        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse mr-1"></div>
                        Live Data
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Exams */}
              <div className="lg:col-span-3" id="available-exams">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    RN Exam Schedule
                  </h3>
                  {examsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Schedule warning or success */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          {!examAvailability["rn-paper-1"]?.isAvailable &&
                          !examAvailability["rn-paper-2"]?.isAvailable ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                📅 Schedule Not Set
                              </h4>
                              <p className="text-sm text-orange-700">
                                <strong>Admin Notice:</strong> RN exam dates
                                have not been scheduled yet.
                                <br />
                                Please contact administration to set exam
                                schedule before exams become available.
                              </p>
                              <p className="text-xs text-orange-600 mt-2">
                                ⚠️ Both papers require admin scheduling and must
                                be taken during scheduled periods
                              </p>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />✅ RN
                                Exams Scheduled
                              </h4>
                              <p className="text-sm text-green-700">
                                RN exams are now available according to admin
                                schedule. You can start taking exams during the
                                scheduled periods.
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={checkExamAvailability}
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          🔄 Refresh Status
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* RN Paper 1 */}
                        <div
                          className={`p-4 rounded-lg border border-gray-200 relative ${
                            examAvailability["rn-paper-1"]?.isAvailable
                              ? "bg-white hover:shadow-md transition-shadow cursor-pointer"
                              : "bg-gray-50 opacity-60"
                          }`}
                        >
                          {!examAvailability["rn-paper-1"]?.isAvailable && (
                            <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {examAvailability["rn-paper-1"]?.reason ||
                                  "Schedule Required"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                  examAvailability["rn-paper-1"]?.isAvailable
                                    ? "bg-blue-100"
                                    : "bg-gray-200"
                                }`}
                              >
                                <FileText
                                  className={`h-5 w-5 ${
                                    examAvailability["rn-paper-1"]?.isAvailable
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                              <div>
                                <h4
                                  className={`font-medium ${
                                    examAvailability["rn-paper-1"]?.isAvailable
                                      ? "text-gray-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  RN Paper 1
                                </h4>
                                <p
                                  className={`text-sm ${
                                    examAvailability["rn-paper-1"]?.isAvailable
                                      ? "text-gray-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  250 questions • 150 mins
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  CBT Format - Comprehensive
                                </p>
                              </div>
                            </div>
                            {examAvailability["rn-paper-1"]?.isAvailable && (
                              <Button
                                onClick={() => router.push("/exam/rn-paper-1")}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Start Exam
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* RN Paper 2 */}
                        <div
                          className={`p-4 rounded-lg border border-gray-200 relative ${
                            examAvailability["rn-paper-2"]?.isAvailable
                              ? "bg-white hover:shadow-md transition-shadow cursor-pointer"
                              : "bg-gray-50 opacity-60"
                          }`}
                        >
                          {!examAvailability["rn-paper-2"]?.isAvailable && (
                            <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {examAvailability["rn-paper-2"]?.reason ||
                                  "Schedule Required"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                  examAvailability["rn-paper-2"]?.isAvailable
                                    ? "bg-blue-100"
                                    : "bg-gray-200"
                                }`}
                              >
                                <FileText
                                  className={`h-5 w-5 ${
                                    examAvailability["rn-paper-2"]?.isAvailable
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                              <div>
                                <h4
                                  className={`font-medium ${
                                    examAvailability["rn-paper-2"]?.isAvailable
                                      ? "text-gray-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  RN Paper 2
                                </h4>
                                <p
                                  className={`text-sm ${
                                    examAvailability["rn-paper-2"]?.isAvailable
                                      ? "text-gray-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  250 questions • 150 mins
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  CBT Format - Advanced
                                </p>
                              </div>
                            </div>
                            {examAvailability["rn-paper-2"]?.isAvailable && (
                              <Button
                                onClick={() => router.push("/exam/rn-paper-2")}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Start Exam
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-4">
                        <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Waiting for admin to set exam schedule
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RM Exam Schedule - Independent System */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    RM Exam Schedule
                  </h3>
                  
                  {rmExamsLoading || rmAccessLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* RM Access Status */}
                      {isAdmin || rmUserAccess?.hasAccess ? (
                        /* User has RM access */
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            ✅ RM Access Active
                          </h4>
                          <p className="text-sm text-green-700">
                            You have access to RM exams. Choose your paper below.
                          </p>
                          {rmUserAccess && (
                            <p className="text-xs text-green-600 mt-2">
                              Access method: {rmUserAccess.accessMethod} • 
                              Attempts used: {Object.keys(rmUserAccess.rmAttempts || {}).length} / {rmUserAccess.adminSettings?.maxAttempts || 1}
                            </p>
                          )}
                        </div>
                      ) : (
                        /* User needs RM access */
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <Lock className="h-4 w-4 mr-2" />
                            🔒 RM Access Required
                          </h4>
                          <p className="text-sm text-blue-700">
                            RM exams require separate access. Purchase RM exam access to unlock midwifery questions.
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            💰 RM Exam Access: ₦2,000 • Independent from RN exams • Includes access codes support
                          </p>
                          <div className="mt-4">
                            <Button
                              onClick={() => router.push("/dashboard/rm")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Purchase RM Access
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* RM Papers Display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rmExams.map((exam) => {
                          const userHasAccess = isAdmin || rmUserAccess?.hasAccess;
                          const canStartExam = userHasAccess && exam.available;
                          
                          return (
                            <div 
                              key={exam.id}
                              className={`p-4 rounded-lg border border-gray-200 relative transition-all ${
                                canStartExam 
                                  ? 'bg-white hover:shadow-md' 
                                  : userHasAccess 
                                    ? 'bg-gray-50 opacity-60' 
                                    : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              {!userHasAccess && (
                                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <Lock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                    <span className="text-blue-800 font-medium text-sm">
                                      Purchase RM Access
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {userHasAccess && !canStartExam && (
                                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    Schedule Required
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                    canStartExam 
                                      ? 'bg-green-100' 
                                      : userHasAccess 
                                        ? 'bg-gray-200' 
                                        : 'bg-blue-100'
                                  }`}>
                                    <FileText className={`h-5 w-5 ${
                                      canStartExam 
                                        ? 'text-green-600' 
                                        : userHasAccess 
                                          ? 'text-gray-400' 
                                          : 'text-blue-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className={`font-medium ${
                                      canStartExam 
                                        ? 'text-gray-900' 
                                        : 'text-gray-600'
                                    }`}>
                                      {exam.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {exam.questionsCount} questions • {exam.durationMinutes} mins
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                      CBT Format - {exam.id.includes('paper-2') ? 'Advanced Practice' : 'Midwifery Fundamentals'}
                                    </p>
                                    {!userHasAccess && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        ₦{exam.pricing.amount} • Separate payment required
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {canStartExam && (
                                  <Button
                                    onClick={() => router.push(`/exam/rm/${exam.id}`)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Start Exam
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* RM Access Action */}
                      {!isAdmin && !rmUserAccess?.hasAccess && (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Independent RM exam access required (₦2,000)
                          </div>
                        </div>
                      )}

                      {isAdmin || rmUserAccess?.hasAccess ? (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            RM access active - waiting for admin to schedule exams
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* RPHN Exam Schedule - Hidden until implementation */}
              <div className="lg:col-span-3">
                {/* Temporarily hidden - RPHN exams under development */}
                {false && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      RPHN Exam Schedule
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        RPHN Exams in Development
                      </h4>
                      <p className="text-sm text-blue-700">
                        <strong>RPHN (Registered Public Health Nurse)</strong> certification
                        exams are currently being developed with full CBT support.
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        📋 Will follow the same 250-question, 150-minute format as RN/RM exams
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {/* Weekly Assessment - Featured at Top */}
                    <Button
                      onClick={() => router.push("/weekly-assessment")}
                      className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Weekly Assessment
                      <span className="ml-auto bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    </Button>

                    <Button
                      onClick={() => setShowLeaderboard(true)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      View Leaderboard
                      {!realTimeLoading &&
                        realTimeLeaderboard &&
                        realTimeLeaderboard.length > 0 && (
                          <div className="ml-auto flex items-center text-xs text-green-600">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse mr-1"></div>
                            Live
                          </div>
                        )}
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

                {/* Taken Exams Section - REMOVED */}

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
                              {activity.timestamp &&
                              activity.timestamp instanceof Date
                                ? formatDistanceToNow(activity.timestamp, {
                                    addSuffix: true,
                                  })
                                : "Recently"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Development Tools - Only show in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              🛠️ Development Tools
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={testPaymentVerification}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Test Payment
              </Button>
              <Button
                onClick={testExamFlow}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Test Exam Flow
              </Button>
              <Button
                onClick={refreshUserAccess}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Refresh Access
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900 mr-3">
                  University Leaderboard
                </h2>
                {!realTimeLoading &&
                  realTimeLeaderboard &&
                  realTimeLeaderboard.length > 0 && (
                    <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-1"></div>
                      Live Rankings
                    </div>
                  )}
              </div>
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
