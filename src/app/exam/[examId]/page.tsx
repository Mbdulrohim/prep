"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExam } from "@/context/ExamContext";
import { Header } from "@/components/layout/Header";
import { ExamFlow } from "@/components/exam/ExamFlow";
import { PreExamModal, StudentDetails } from "@/components/exam/PreExamModal";

export default function ExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  
  const {
    loadingQuestions,
    examDetails,
    resetExam,
  } = useExam();

  const [showPreExamModal, setShowPreExamModal] = useState(true);
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: "",
    university: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle exam start
  const handleStartExam = async (details: StudentDetails) => {
    setStudentDetails(details);
    setShowPreExamModal(false);
    
    // Reset exam state and load fresh questions
    await resetExam(examId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-700">Please sign in to access exams.</p>
        </div>
      </div>
    );
  }

  // Show pre-exam modal
  if (showPreExamModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PreExamModal
          onStartExam={handleStartExam}
          loading={loadingQuestions}
        />
      </div>
    );
  }

  // Show exam flow
  return (
    <div className="min-h-screen bg-gray-50">
      <ExamFlow examId={examId} />
    </div>
  );
}
