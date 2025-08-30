// src/components/rm/EnhancedRMExamEntry.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { rmExamAttemptManager } from "@/lib/rmExamAttempts";
import { standaloneRMExamManager } from "@/lib/standaloneRMExams";
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import {
  Clock,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Award,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface EnhancedRMExamEntryProps {
  examId: string;
  onStartExam: () => void;
}

export default function EnhancedRMExamEntry({
  examId,
  onStartExam,
}: EnhancedRMExamEntryProps) {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const [exam, setExam] = useState<RMExamData | null>(null);
  const [rmAccess, setRmAccess] = useState<any>(null);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string>("");
  const [canStart, setCanStart] = useState<boolean>(false);

  useEffect(() => {
    if (user && examId) {
      loadExamData();
    }
  }, [user, examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);

      // Get exam data
      const rmExams = await fetchRMExams();
      const examData = rmExams.find((e) => e.id === examId);

      if (!examData) {
        setError("RM exam not found");
        return;
      }

      setExam(examData);

      // Check RM access
      const access = await rmUserAccessManager.getRMUserAccess(user!.uid);
      setRmAccess(access);

      if (!access || !access.hasAccess) {
        setError(
          "You don't have access to RM exams. Please purchase RM access."
        );
        return;
      }

      // Check if user can start this exam
      const eligibility = await rmUserAccessManager.canStartRMExam(
        user!.uid,
        examId
      );
      setCanStart(eligibility.canStart);

      if (!eligibility.canStart) {
        setError(eligibility.reason || "Cannot start exam");
        return;
      }

      // Get previous attempts
      const attempts = await rmExamAttemptManager.getUserRMExamAttempts(
        user!.uid
      );
      const examAttempts = attempts.filter(
        (attempt) => attempt.examId === examId
      );
      setPreviousAttempts(examAttempts);
    } catch (error) {
      console.error("Error loading RM exam data:", error);
      setError("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!user || !exam || !canStart) return;

    try {
      setStarting(true);

      console.log("🚀 Starting RM exam:", examId);

      // For now, we'll use the standaloneRMExamManager to start the exam
      // which handles the question fetching and attempt creation
      const attemptId = await standaloneRMExamManager.startRMExamAttempt(
        user.uid,
        user.email || "",
        userProfile?.displayName || user.email || "",
        userProfile?.university || "",
        examId
      );

      if (attemptId) {
        console.log("✅ RM exam attempt created:", attemptId);
        onStartExam();
      } else {
        throw new Error("Failed to create exam attempt");
      }
    } catch (error) {
      console.error("❌ Error starting RM exam:", error);
      setError("Failed to start exam. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading RM Exam
          </h2>
          <p className="text-gray-600">Preparing your exam session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Unable to Start Exam
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>

            <div className="space-y-3">
              <button
                onClick={loadExamData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
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

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            RM Exam Ready
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {exam.title}
          </h1>
          <p className="text-gray-600">{exam.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Exam Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Exam Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Questions</span>
                </div>
                <span className="font-medium text-gray-900">
                  {exam.questionsCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Duration</span>
                </div>
                <span className="font-medium text-gray-900">
                  {exam.durationMinutes} minutes
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Passing Score</span>
                </div>
                <span className="font-medium text-gray-900">70%</span>
              </div>
            </div>

            {/* Topics */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Exam Topics</h3>
              <div className="flex flex-wrap gap-2">
                {exam.topics.slice(0, 6).map((topic, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
                {exam.topics.length > 6 && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    +{exam.topics.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RM Access Status & Previous Attempts */}
          <div className="space-y-6">
            {/* Access Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  RM Access Active
                </h2>
              </div>

              {rmAccess && (
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Access Method:</span>
                    <span className="font-medium capitalize">
                      {rmAccess.accessMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Granted:</span>
                    <span className="font-medium">
                      {rmAccess.accessGrantedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Attempts:</span>
                    <span className="font-medium">
                      {rmAccess.adminSettings.maxAttempts}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Previous Attempts
                  </h2>
                </div>

                <div className="space-y-3">
                  {previousAttempts.slice(0, 3).map((attempt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Attempt {index + 1}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.attemptDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {attempt.percentage}%
                        </p>
                        <p
                          className={`text-sm ${
                            attempt.percentage >= 70
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {attempt.percentage >= 70 ? "Passed" : "Failed"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Exam */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleStartExam}
                disabled={starting || !canStart}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Exam...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start RM Exam
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Make sure you have a stable internet connection before starting
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
