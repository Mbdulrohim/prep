"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { MobileExamFlow } from "@/components/exam/MobileExamFlow";
import { PreExamModal, StudentDetails } from "@/components/exam/PreExamModal";
import { examAttemptManager } from "@/lib/examAttempts";
import { getExamById } from "@/lib/examData";
import { Button } from "@/components/ui/Button";
import { AlertCircle, BookOpen, CheckCircle, Smartphone, Monitor } from "lucide-react";

interface ExamResults {
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  timeSpent: number;
  answers: (number | null)[];
  flaggedQuestions: number[];
}

export default function ImprovedExamPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [examData, setExamData] = useState<any>(null);
  const [showPreExamModal, setShowPreExamModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: userProfile?.displayName || "",
    university: userProfile?.university || "",
  });
  const [canStartExam, setCanStartExam] = useState<boolean | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      setDeviceType(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Check exam eligibility and load data
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
      // Load exam data
      const exam = await getExamById(examId);
      if (!exam) {
        setError("Exam not found. Please check the exam ID and try again.");
        return;
      }
      setExamData(exam);

      // Check if user can start exam
      const eligibilityResult = await examAttemptManager.canUserStartExam(
        user.uid,
        examId
      );

      if (!eligibilityResult.canStart) {
        setCanStartExam(false);
        setError(eligibilityResult.reason || "Cannot start exam");
        return;
      }

      // Check for existing incomplete attempt
      if (eligibilityResult.existingAttempt) {
        const attempt = eligibilityResult.existingAttempt;
        if (!attempt.completed && !attempt.submitted) {
          // User has an incomplete attempt
          setShowPreExamModal(true);
          setCanStartExam(true);
          setStudentDetails({
            name: attempt.userName || userProfile?.displayName || "",
            university: attempt.userUniversity || userProfile?.university || "",
          });
        } else {
          setCanStartExam(false);
          setError("You have already completed this exam.");
        }
      } else {
        setCanStartExam(true);
        setShowPreExamModal(true);
      }

    } catch (error) {
      console.error("Error checking exam eligibility:", error);
      setError("Failed to check exam eligibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (details: StudentDetails) => {
    setStudentDetails(details);
    setShowPreExamModal(false);
    setExamStarted(true);
  };

  const handleExamComplete = (results: any) => {
    console.log('Exam completed with results:', results);
    
    // Navigate to results page with attempt ID
    if (results.attemptId) {
      router.push(`/exam/${examId}/results?attemptId=${results.attemptId}`);
    } else {
      // Fallback to dashboard if no attempt ID
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Exam...
            </h2>
            <p className="text-gray-600">
              Please wait while we prepare your exam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !canStartExam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cannot Start Exam
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                What you can do:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Contact administration for access permission</li>
                <li>• Purchase exam access through the dashboard</li>
                <li>• Redeem an access code if you have one</li>
                <li>• Check if the exam schedule is available</li>
              </ul>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button onClick={checkExamEligibility} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show exam flow when started
  if (examStarted) {
    return (
      <MobileExamFlow
        examId={examId}
        examData={examData}
        userDetails={studentDetails}
        onExamComplete={handleExamComplete}
      />
    );
  }

  // Pre-exam modal and device optimization notice
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Device Optimization Notice */}
      {deviceType === 'mobile' && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center">
            <Smartphone className="h-5 w-5 text-blue-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Mobile-Optimized Exam Experience
              </p>
              <p className="text-xs text-blue-700">
                This exam is optimized for mobile devices with touch-friendly navigation
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Exam Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {examData?.title || examId.toUpperCase()}
              </h1>
              <p className="text-gray-600">
                {examData?.category} Examination
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {examData?.totalQuestions || 250}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {examData?.duration || 150}
              </div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(((examData?.totalQuestions || 250) * 0.7))}
              </div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
          </div>
        </div>

        {/* Device Features */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {deviceType === 'mobile' ? '📱 Mobile Features' : '💻 Desktop Features'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {deviceType === 'mobile' ? (
              <>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Touch-optimized navigation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Auto-advance on selection</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Swipe navigation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Mobile question navigator</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Keyboard shortcuts</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Sidebar navigation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Large screen layout</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Advanced question grid</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Important Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3">
            📋 Important Instructions
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li>• Once started, the exam cannot be paused or stopped</li>
            <li>• Your progress is automatically saved every 30 seconds</li>
            <li>• Questions are randomly shuffled for each attempt</li>
            <li>• Leaving the page will not stop the timer</li>
            <li>• You can flag questions for review</li>
            <li>• Submit before time runs out to avoid auto-submission</li>
          </ul>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowPreExamModal(true)}
            size="lg"
            className="px-8 py-3 bg-green-600 hover:bg-green-700"
          >
            Begin Exam
          </Button>
        </div>
      </div>

      {/* Pre-exam Modal */}
      {showPreExamModal && (
        <PreExamModal
          onStartExam={handleStartExam}
          onCancel={() => setShowPreExamModal(false)}
          userProfile={{
            name: studentDetails.name,
            university: studentDetails.university,
          }}
        />
      )}
    </div>
  );
}
