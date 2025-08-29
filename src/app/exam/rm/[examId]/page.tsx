// src/app/exam/rm/[examId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { AlertCircle, BookOpen, CheckCircle, Clock, Users, ArrowLeft } from "lucide-react";

// RM-specific imports
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";
import { rmQuestionBankManager } from "@/lib/rmQuestionBank";

// Reusable components (will adapt for RM)
import { RMExamFlow } from "@/components/exam/RMExamFlow";
import { RMExamConfirmation, StudentDetails } from "@/components/exam/RMExamConfirmation";

export default function RMExamPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [rmExamData, setRmExamData] = useState<RMExamData | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: "",
    university: "",
  });
  const [canStartExam, setCanStartExam] = useState<boolean | null>(null);
  const [rmExamAttempt, setRmExamAttempt] = useState<RMExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [rmQuestions, setRmQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Check RM exam eligibility
  useEffect(() => {
    console.log("🧪 RM Exam eligibility effect triggered. user:", !!user, "userProfile:", !!userProfile, "examId:", examId);
    console.log("👤 User details:", user ? { uid: user.uid, email: user.email } : "Not available");
    
    if (user && userProfile) {
      console.log("✅ User and profile available, checking RM exam eligibility");
      checkRMExamEligibility();
    } else {
      console.log("⏳ Waiting for user or profile to be available");
    }
  }, [user, userProfile, examId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const checkRMExamEligibility = async () => {
    if (!user?.uid) {
      console.log("❌ No user uid found for RM exam check");
      return;
    }

    console.log("🔍 Starting RM exam eligibility check for user:", user.uid, "examId:", examId);
    setLoading(true);
    setError("");

    try {
      console.log("🔍 Starting RM exam eligibility check for user:", user.uid);
      
      // Load RM exam data
      const rmExams = await fetchRMExams();
      const currentExam = rmExams.find(exam => exam.id === examId);
      
      if (!currentExam) {
        console.error("❌ RM exam not found:", examId);
        setError("RM exam not found");
        setLoading(false);
        return;
      }
      
      console.log("✅ RM exam found:", currentExam);
      setRmExamData(currentExam);

      // Check RM user access with detailed debugging
      console.log("🔍 Checking RM access for user:", user.uid);
      const rmAccess = await rmUserAccessManager.getRMUserAccess(user.uid);
      
      console.log("📊 RM Access check result:", {
        userId: user.uid,
        userEmail: user.email,
        rmAccess: rmAccess,
        hasAccess: rmAccess?.hasAccess,
        accessMethod: rmAccess?.accessMethod,
        accessGrantedAt: rmAccess?.accessGrantedAt,
        paymentInfo: rmAccess?.paymentInfo,
        examId: examId,
        currentExamAvailable: currentExam.available
      });
      
      if (!rmAccess) {
        console.error("❌ No RM access record found for user:", user.uid);
        setCanStartExam(false);
        setError("You don't have access to RM exams. Please purchase RM access.");
        setLoading(false);
        return;
      }
      
      if (!rmAccess.hasAccess) {
        console.error("❌ RM access record exists but hasAccess is false:", rmAccess);
        setCanStartExam(false);
        setError("You don't have access to RM exams. Please purchase RM access.");
        setLoading(false);
        return;
      }

      console.log("✅ RM access confirmed, checking exam availability...");

      // Check if exam is available (admin scheduled)
      if (!currentExam.available) {
        console.warn("⏰ RM exam not available yet:", {
          examId: examId,
          scheduling: currentExam.scheduling,
          available: currentExam.available
        });
        setCanStartExam(false);
        setError("This RM exam has not been scheduled by admin yet.");
        setLoading(false);
        return;
      }

      // Check if user can start this specific RM exam
      const canStart = await rmUserAccessManager.canStartRMExam(user.uid, examId);
      
      if (!canStart.canStart) {
        setCanStartExam(false);
        setError(canStart.reason || "Cannot start RM exam");
        setLoading(false);
        return;
      }

      // Check for existing RM exam attempt
      const existingAttempts = await rmExamAttemptManager.getUserRMExamAttempts(user.uid);
      const existingAttempt = existingAttempts.find(attempt => 
        attempt.examId === examId && attempt.completed
      );

      if (existingAttempt) {
        setRmExamAttempt(existingAttempt);
        setCanStartExam(false); // Already completed
      } else {
        setCanStartExam(true);
      }
    } catch (error) {
      console.error("Error checking RM exam eligibility:", error);
      setError("Failed to check RM exam eligibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartRMExam = async (details: StudentDetails) => {
    if (!user?.uid || !canStartExam || !userProfile || !rmExamData) return;

    try {
      setStudentDetails(details);
      setShowConfirmationModal(false);
      setQuestionsLoading(true);

      // Load RM questions for this exam
      const paper = rmExamData.id.includes('paper-2') ? 'paper-2' : 'paper-1';
      const questions = await rmQuestionBankManager.assignRMQuestionsToUser(
        user.uid,
        paper,
        rmExamData.questionsCount
      );

      if (questions.length === 0) {
        setError("No RM questions available for this exam. Please contact admin.");
        setQuestionsLoading(false);
        return;
      }

      setRmQuestions(questions);
      setQuestionsLoading(false);

    } catch (error) {
      console.error("Error starting RM exam:", error);
      setError("Failed to start RM exam. Please try again.");
      setQuestionsLoading(false);
    }
  };

  const handleViewRMResults = () => {
    if (rmExamAttempt) {
      router.push(`/exam/rm/${examId}/results?attemptId=${rmExamAttempt.id}`);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleBackToRMExams = () => {
    router.push("/exam/rm");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading...</p>
          </div>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Checking RM exam access...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !canStartExam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cannot Access RM Exam
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {error.includes("don't have access") && (
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard/rm")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Purchase RM Access
                </Button>
                <Button
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
            
            {error.includes("not been scheduled") && (
              <div className="space-y-3">
                <Button
                  onClick={handleBackToRMExams}
                  className="w-full"
                >
                  Back to RM Exams
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Retry Access Check
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show completed RM exam review option
  if (!canStartExam && rmExamAttempt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              RM Exam Completed
            </h2>
            <p className="text-gray-600 mb-2">
              You have already completed this RM exam.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Score: {rmExamAttempt.percentage}% ({rmExamAttempt.correctAnswers}/{rmExamAttempt.assignedQuestions.length})
            </p>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleViewRMResults}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View Results
              </Button>
              <Button
                onClick={handleBackToRMExams}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to RM Exams
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show RM exam interface for eligible users
  if (canStartExam && rmQuestions.length > 0 && !questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <RMExamFlow
          examId={examId}
          rmExamData={rmExamData!}
          rmQuestions={rmQuestions}
          userDetails={studentDetails}
          onExamComplete={(results: any) => {
            // Navigate to RM results page
            router.push(`/exam/rm/${examId}/results?immediate=true`);
          }}
        />
      </div>
    );
  }

  // Show RM exam confirmation modal
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={handleBackToRMExams}
          className="mb-6 text-green-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RM Exams
        </Button>

        {rmExamData && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* RM Exam Header */}
            <div className={`bg-gradient-to-r ${rmExamData.color} p-8 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{rmExamData.title}</h1>
                  <p className="text-green-100 mb-4">{rmExamData.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rmExamData.questionsCount}</div>
                      <div className="text-sm text-green-200">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rmExamData.durationMinutes}</div>
                      <div className="text-sm text-green-200">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rmExamData.difficulty}</div>
                      <div className="text-sm text-green-200">Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">RM</div>
                      <div className="text-sm text-green-200">Category</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RM Topics */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Topics Covered in this RM Exam:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {rmExamData.topics.map((topic, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{topic}</span>
                  </div>
                ))}
              </div>

              {/* Start RM Exam */}
              <div className="text-center">
                <Button
                  onClick={() => setShowConfirmationModal(true)}
                  disabled={questionsLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                >
                  {questionsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Loading RM Questions...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      Start RM Exam
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Make sure you have a stable internet connection and {rmExamData.durationMinutes} minutes available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* RM Exam Confirmation Modal */}
        {showConfirmationModal && (
          <RMExamConfirmation
            examTitle={rmExamData?.title || "RM Exam"}
            onConfirm={handleStartRMExam}
            onCancel={() => setShowConfirmationModal(false)}
            isLoading={questionsLoading}
          />
        )}
      </div>
    </div>
  );
}
