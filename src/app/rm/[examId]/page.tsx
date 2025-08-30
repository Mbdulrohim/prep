// src/app/rm/[examId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import {
  standaloneRMExamManager,
  StandaloneRMExam,
  StandaloneRMAttempt,
} from "../../../lib/standaloneRMExams";
import StandaloneRMExamFlow from "@/components/rm/StandaloneRMExamFlow";
import EnhancedRMExamEntry from "@/components/rm/EnhancedRMExamEntry";
import {
  Clock,
  Users,
  BookOpen,
  Target,
  Crown,
  AlertCircle,
  Play,
  Lock,
  CheckCircle,
} from "lucide-react";

const RMExamPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<StandaloneRMExam | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeAttempt, setActiveAttempt] =
    useState<StandaloneRMAttempt | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && examId) {
        await fetchExamData(currentUser, examId);
      } else if (!examId) {
        router.push("/rm");
      } else {
        router.push("/auth/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId, router]);

  const fetchExamData = async (currentUser: User, examId: string) => {
    try {
      // Get exam details
      const examData = await standaloneRMExamManager.getRMExamById(examId);
      if (!examData) {
        setError("Exam not found");
        return;
      }

      setExam(examData);

      // Check user's RM access using the proper access manager
      const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
      const userHasAccess = await rmUserAccessManager.hasRMAccess(
        currentUser.uid
      );
      setHasAccess(userHasAccess);

      if (!userHasAccess && examData.requiresPayment) {
        // Redirect to payment if no access and payment required
        router.push(`/rm/payment?examId=${examId}`);
        return;
      }

      // Check for active attempt
      const attempt = await standaloneRMExamManager.getUserActiveAttempt(
        currentUser.uid,
        examId
      );
      setActiveAttempt(attempt);
    } catch (error) {
      console.error("Error fetching exam data:", error);
      setError("Failed to load exam");
    }
  };

  const handleStartExam = async () => {
    if (!user || !exam) return;

    try {
      setLoading(true);

      // Start new attempt or resume existing one
      let attemptId: string | null = activeAttempt?.id || null;

      if (!attemptId) {
        attemptId = await standaloneRMExamManager.startRMExamAttempt(
          user.uid,
          user.email || "",
          user.displayName || user.email || "",
          "", // Will be fetched from user profile
          exam.id
        );
      }

      if (attemptId) {
        setShowExam(true);
      } else {
        setError("Failed to start exam. Please try again.");
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      setError("Failed to start exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Available now";
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Show exam flow when started
  if (showExam && exam && user && hasAccess) {
    return <StandaloneRMExamFlow examId={exam.id} isPreview={false} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/rm")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to RM Exams
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Exam Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested exam could not be found.
          </p>
          <button
            onClick={() => router.push("/rm")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to RM Exams
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Lock className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              RM Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to purchase RM access to take this exam. Get access to
              all RM exams including Paper 1 and Paper 2.
            </p>

            {/* Pricing highlight */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 font-medium">Complete RM Package</p>
              <p className="text-2xl font-bold text-orange-900">₦2,000</p>
              <p className="text-sm text-orange-600">
                Access to all RM exams + 90 days validity
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/rm/payment?examId=${exam.id}`)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Purchase RM Access
              </button>

              <button
                onClick={async () => {
                  setLoading(true);
                  if (user) await fetchExamData(user, examId);
                }}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? "Checking..." : "Already purchased? Refresh Access"}
              </button>

              <button
                onClick={() => router.push("/rm")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to RM Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showExam) {
    return <StandaloneRMExamFlow examId={examId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/rm")}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back to RM Exams
          </button>
        </div>

        {/* Exam Info Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 bg-opacity-50 text-blue-100">
                    Paper {exam.paper}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500 bg-opacity-50 text-purple-100 capitalize">
                    {exam.difficulty} Level
                  </span>
                </div>
              </div>
              <div className="hidden lg:block">
                <Crown className="h-16 w-16 text-blue-200" />
              </div>
            </div>

            {exam.description && (
              <p className="text-blue-100 mt-4 max-w-2xl">{exam.description}</p>
            )}
          </div>

          {/* Details Section */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(exam.timeLimit)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Questions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {exam.totalQuestions}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Passing Score
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {exam.passingScore}%
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Difficulty</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {exam.difficulty}
                </p>
              </div>
            </div>

            {/* Active Attempt Info */}
            {activeAttempt && !activeAttempt.completed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-900">
                      Resume Previous Attempt
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have an incomplete exam attempt started on{" "}
                      {activeAttempt.startTime.toLocaleDateString()} at{" "}
                      {activeAttempt.startTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      . You can continue where you left off.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Exam Instructions
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  You have {formatDuration(exam.timeLimit)} to complete{" "}
                  {exam.totalQuestions} questions
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  You can flag questions for review and return to them later
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  Your progress is automatically saved every 30 seconds
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  You need {exam.passingScore}% or higher to pass this exam
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  You can retake the exam multiple times during your access
                  period
                </li>
              </ul>
            </div>

            {/* Enhanced Exam Entry */}
            <EnhancedRMExamEntry
              examId={exam.id}
              onStartExam={() => setShowExam(true)}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tips */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
              Exam Tips
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>• Read each question carefully before selecting an answer</li>
              <li>
                • Use the flag feature to mark questions you want to review
              </li>
              <li>• Don't spend too much time on any single question</li>
              <li>• Review your answers before submitting</li>
              <li>• Stay calm and manage your time effectively</li>
            </ul>
          </div>

          {/* System Requirements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              System Requirements
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>• Stable internet connection required</li>
              <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>• JavaScript must be enabled</li>
              <li>• Minimum screen resolution: 1024x768</li>
              <li>• Disable browser pop-up blockers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RMExamPage;
