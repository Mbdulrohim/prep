"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExam } from "@/context/ExamContext";
import { Header } from "@/components/layout/Header";
import { NewExamFlow } from "@/components/exam/NewExamFlow";
import {
  SimpleExamConfirmation,
  StudentDetails,
} from "@/components/exam/SimpleExamConfirmation";
import { examAttemptManager } from "@/lib/examAttempts";
import { Button } from "@/components/ui/Button";
import { AlertCircle, BookOpen, CheckCircle, Clock, Users } from "lucide-react";

export default function ExamPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const { loadingQuestions, examDetails, resetExam } = useExam();

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
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
        setShowConfirmationModal(true);
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
      setStudentDetails(details);
      setShowConfirmationModal(false);

      // Start loading questions immediately after closing modal
      // The exam attempt will be created when questions are ready
    } catch (error) {
      console.error("Error starting exam:", error);
      setError("Failed to start exam. Please try again.");
    }
  };

  const handleViewResults = () => {
    router.push(`/exam/${examId}/results?attemptId=${examAttempt.id}`);
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
        <div className="flex items-center justify-center min-h-[80vh] p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <div className="text-center mb-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Access Required
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>

              {examDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    {examDetails.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>Questions:</span>
                      <span className="font-medium">
                        {examDetails.questionsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Duration:</span>
                      <span className="font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {examDetails.durationMinutes} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Category:</span>
                      <span className="font-medium">
                        {examDetails.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Covered Topics:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {examDetails.topics.slice(0, 6).map((topic, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {examDetails.topics.length > 6 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          +{examDetails.topics.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-blue-700">
                      💡 This is a comprehensive {examDetails.questionsCount}
                      -question exam designed to test your knowledge across
                      multiple nursing domains.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry Access Check
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
                  {examAttempt.score}/{examAttempt.assignedQuestions.length}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Percentage:</span>
                <span className="font-medium">
                  {Math.round(
                    (examAttempt.score / examAttempt.assignedQuestions.length) * 100
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed:</span>
                <span className="text-sm">
                  {examAttempt.endTime &&
                    new Date(examAttempt.endTime).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Button onClick={handleViewResults} className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                View Results
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
  if (showConfirmationModal) {
    return (
      <SimpleExamConfirmation
        onStartExam={handleStartExam}
        onCancel={() => router.push("/dashboard")}
        examDetails={examDetails}
        userProfile={userProfile}
      />
    );
  }

  // Show the actual exam
  return (
    <div className="min-h-screen bg-gray-50">
      {loadingQuestions ? (
        <>
          <Header />
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-slate-700">Loading exam questions...</p>
            </div>
          </div>
        </>
      ) : (
        <NewExamFlow examId={examId} />
      )}
    </div>
  );
}
