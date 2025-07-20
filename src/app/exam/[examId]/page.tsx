"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExam } from "@/context/ExamContext";
import { Header } from "@/components/layout/Header";
import { ExamFlow } from "@/components/exam/ExamFlow";
import { PreExamModal, StudentDetails } from "@/components/exam/PreExamModal";
import { examAttemptManager } from "@/lib/examAttempts";
import { Button } from "@/components/ui/Button";
import { AlertCircle, BookOpen, CheckCircle } from "lucide-react";

export default function ExamPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const { loadingQuestions, examDetails, resetExam } = useExam();

  const [showPreExamModal, setShowPreExamModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: "",
    university: "",
  });
  const [canStartExam, setCanStartExam] = useState<boolean | null>(null);
  const [examAttempt, setExamAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Check exam eligibility
  useEffect(() => {
    if (user && userProfile) {
      checkExamEligibility();
    }
  }, [user, userProfile, examId]);

  const checkExamEligibility = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError("");

    try {
      // Check if user can start a new exam
      const eligibilityResult = await examAttemptManager.canUserStartExam(
        user.uid,
        examId
      );
      setCanStartExam(eligibilityResult.canStart);

      if (!eligibilityResult.canStart) {
        // Check if user has a completed attempt to review
        const attempts = await examAttemptManager.getUserExamAttempts(user.uid);
        const completedAttempt = attempts.find(
          (attempt) => attempt.examId === examId && attempt.completed
        );

        if (completedAttempt) {
          setExamAttempt(completedAttempt);
        } else {
          setError(
            eligibilityResult.reason ||
              "No exam access found. Please purchase exam access or redeem an access code."
          );
        }
      } else {
        setShowPreExamModal(true);
      }
    } catch (error) {
      console.error("Error checking exam eligibility:", error);
      setError("Failed to check exam eligibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle exam start
  const handleStartExam = async (details: StudentDetails) => {
    if (!user?.uid || !canStartExam || !userProfile) return;

    try {
      // For now, we'll use a simplified version - in production you'd pass actual questions
      // This is a placeholder that would need to be integrated with your question loading system
      setStudentDetails(details);
      setShowPreExamModal(false);

      // Reset exam state and load fresh questions
      await resetExam(examId);
    } catch (error) {
      console.error("Error starting exam:", error);
      setError("Failed to start exam. Please try again.");
    }
  };

  const handleViewResults = () => {
    router.push(`/exam/${examId}/results`);
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-700">
            Please sign in to access exams.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">
              Checking exam eligibility...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Required
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleBackToDashboard} className="w-full">
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Purchase Exam Access
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show completed exam review option
  if (!canStartExam && examAttempt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Exam Completed
            </h1>
            <p className="text-gray-600 mb-2">
              You have already completed this exam.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Score:</span>
                <span className="font-bold text-lg text-green-600">
                  {examAttempt.score}/{examAttempt.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Percentage:</span>
                <span className="font-medium">
                  {Math.round(
                    (examAttempt.score / examAttempt.totalQuestions) * 100
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed:</span>
                <span className="text-sm">
                  {examAttempt.submittedAt &&
                    new Date(examAttempt.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Button onClick={handleViewResults} className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                Review Questions
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              You can review your answers but cannot retake this exam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show exam interface for eligible users
  if (showPreExamModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PreExamModal
          onStartExam={handleStartExam}
          examDetails={examDetails}
          userProfile={userProfile}
        />
      </div>
    );
  }

  // Show the actual exam
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {loadingQuestions ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading exam questions...</p>
          </div>
        </div>
      ) : (
        <ExamFlow examId={examId} />
      )}
    </div>
  );
}
