"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Flag,
  BookOpen,
} from "lucide-react";
import { examAttemptManager, ExamAttempt } from "@/lib/examAttempts";

export default function ExamResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const examId = params.examId as string;
  const attemptId = searchParams.get('attemptId');
  
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (user && attemptId) {
      loadExamResults();
    }
  }, [user, attemptId]);

  const loadExamResults = async () => {
    if (!user?.uid || !attemptId) return;

    try {
      setLoading(true);
      
      // Get the exam attempt results
      const attempt = await examAttemptManager.getExamAttemptForReview(attemptId, user.uid);
      
      if (!attempt) {
        setError("Exam results not found or you don't have permission to view them.");
        return;
      }
      
      setExamAttempt(attempt);
    } catch (error) {
      console.error("Error loading exam results:", error);
      setError("Failed to load exam results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const isPassing = (percentage: number): boolean => {
    return percentage >= 70; // 70% passing grade
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Results...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your exam results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !examAttempt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Results Not Available
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const passed = isPassing(examAttempt.percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className={`bg-gradient-to-r rounded-lg p-8 text-white mb-8 ${
          passed ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                {passed ? (
                  <Trophy className="h-8 w-8 mr-3" />
                ) : (
                  <Target className="h-8 w-8 mr-3" />
                )}
                <h1 className="text-3xl font-bold">
                  {passed ? 'Congratulations!' : 'Exam Completed'}
                </h1>
              </div>
              <p className="text-lg opacity-90">
                {examAttempt.examCategory} Exam - {passed ? 'Passed' : 'Not Passed'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {examAttempt.percentage}%
              </div>
              <div className="text-lg">
                Grade: {getGradeLetter(examAttempt.percentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-600 mb-1">
              {examAttempt.correctAnswers}
            </div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-red-600 mb-1">
              {examAttempt.wrongAnswers}
            </div>
            <div className="text-sm text-gray-600">Wrong</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {examAttempt.unanswered}
            </div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatTime(examAttempt.timeSpent)}
            </div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Score</span>
                <span className={`font-semibold ${getGradeColor(examAttempt.percentage)}`}>
                  {examAttempt.score}/{examAttempt.assignedQuestions.length}
                </span>
              </div>
              <Progress value={examAttempt.percentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-medium">
                  Correct: {((examAttempt.correctAnswers / examAttempt.assignedQuestions.length) * 100).toFixed(1)}%
                </div>
                <Progress value={(examAttempt.correctAnswers / examAttempt.assignedQuestions.length) * 100} className="h-2" />
              </div>
              <div>
                <div className="text-red-600 font-medium">
                  Wrong: {((examAttempt.wrongAnswers / examAttempt.assignedQuestions.length) * 100).toFixed(1)}%
                </div>
                <Progress value={(examAttempt.wrongAnswers / examAttempt.assignedQuestions.length) * 100} className="h-2" />
              </div>
              <div>
                <div className="text-yellow-600 font-medium">
                  Unanswered: {((examAttempt.unanswered / examAttempt.assignedQuestions.length) * 100).toFixed(1)}%
                </div>
                <Progress value={(examAttempt.unanswered / examAttempt.assignedQuestions.length) * 100} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Pass/Fail Status */}
        <div className={`border-2 rounded-lg p-6 mb-8 ${
          passed 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center">
            {passed ? (
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
            )}
            <div>
              <h3 className={`font-semibold ${passed ? 'text-green-900' : 'text-red-900'}`}>
                {passed ? 'Exam Passed!' : 'Exam Not Passed'}
              </h3>
              <p className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
                {passed 
                  ? `Congratulations! You achieved ${examAttempt.percentage}% which meets the 70% passing requirement.`
                  : `You scored ${examAttempt.percentage}% but need 70% to pass. You can retake this exam.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Exam Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Exam ID:</span>
                <span className="font-medium">{examAttempt.examId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{examAttempt.assignedQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flagged Questions:</span>
                <span className="font-medium">{examAttempt.flaggedQuestions.length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium">
                  {new Date(examAttempt.startTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Time:</span>
                <span className="font-medium">
                  {examAttempt.endTime ? new Date(examAttempt.endTime).toLocaleString() : 'Not completed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{formatTime(examAttempt.timeSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setShowReview(true)}
            variant="outline"
            className="flex-1 flex items-center justify-center"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Review Answers
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1 flex items-center justify-center"
          >
            Back to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          {!passed && (
            <Button
              onClick={() => router.push(`/exam/${examId}`)}
              className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Exam
            </Button>
          )}
        </div>
      </div>

      {/* Review Modal - Placeholder for future implementation */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
            <p className="text-gray-600 mb-4">
              Detailed answer review with explanations will be available soon.
            </p>
            <Button onClick={() => setShowReview(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
