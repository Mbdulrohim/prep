"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";
import { standaloneWeeklyAssessmentManager, StandaloneAssessmentAttempt, StandaloneWeeklyAssessment } from "@/lib/standaloneWeeklyAssessments";
import UnifiedExamReviewFlow from "@/components/exam/UnifiedExamReviewFlow";

interface ReviewData {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  questions: any[];
  userAnswers: (number | null)[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
}

export default function WeeklyAssessmentReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const attemptId = searchParams.get('attemptId');
  const assessmentId = searchParams.get('assessmentId');

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviewData();
  }, [attemptId, assessmentId, user]);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      if (!user?.uid || !attemptId || !assessmentId) {
        setError("Invalid review request - missing parameters");
        return;
      }

      // First check if the assessment is still available for review
      const assessmentAvailable = await standaloneWeeklyAssessmentManager.isAssessmentAvailable(assessmentId);
      
      // Also check if this is the current active assessment (users can always review current assessment)
      const currentAssessment = await standaloneWeeklyAssessmentManager.getCurrentStandaloneAssessment();
      const isCurrentAssessment = currentAssessment?.id === assessmentId;

      if (!assessmentAvailable && !isCurrentAssessment) {
        setError("This assessment is no longer available for review");
        return;
      }

      // Get the assessment data
      const assessment = await standaloneWeeklyAssessmentManager.getStandaloneAssessmentById(assessmentId);
      if (!assessment) {
        setError("Assessment not found");
        return;
      }

      // Get user's attempt data with security check
      const userAttempt = await standaloneWeeklyAssessmentManager.getStandaloneAssessmentAttemptForReview(attemptId, user.uid);

      if (!userAttempt) {
        setError("Assessment attempt not found or access denied");
        return;
      }

      setReviewData({
        id: userAttempt.id,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questions: assessment.questions,
        userAnswers: userAttempt.userAnswers,
        score: userAttempt.score,
        totalQuestions: userAttempt.totalQuestions,
        timeSpent: userAttempt.timeSpent,
      });

    } catch (error) {
      console.error('Error loading review data:', error);
      setError("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading review data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Review Unavailable
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/weekly-assessment")}>
              Back to Weekly Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use the unified review component (Golden Standard)
  return (
    <UnifiedExamReviewFlow
      examTitle={`${reviewData.assessmentTitle} - Review`}
      questions={reviewData.questions}
      userAnswers={reviewData.userAnswers}
      score={reviewData.score}
      totalQuestions={reviewData.totalQuestions}
      timeSpent={reviewData.timeSpent}
      onBackToDashboard={() => router.push("/weekly-assessment")}
      showHeader={true}
    />
  );
}
