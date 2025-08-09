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
  BookOpen,
  Home,
  Award,
  TrendingUp,
} from "lucide-react";
import { examAttemptManager, ExamAttempt } from "@/lib/examAttempts";

interface ExamResults {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  totalQuestions: number;
  timeSpent: number;
  autoSubmitted?: boolean;
  questions?: any[];
  userAnswers?: any[];
  endTime: Date;
  createdAt: Date;
}

export default function ExamResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const examId = params.examId as string;
  const attemptId = searchParams.get('attemptId');
  const isImmediate = searchParams.get('immediate') === 'true';
  const isAutoSubmit = searchParams.get('autoSubmit') === 'true';
  
  const [results, setResults] = useState<ExamResults | null>(null);
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, [isImmediate, attemptId, user]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // First check localStorage for immediate results
      if (isImmediate) {
        const storedResults = localStorage.getItem('lastExamResults');
        if (storedResults) {
          try {
            const parsed = JSON.parse(storedResults);
            console.log('Loading immediate results:', parsed);
            setResults(parsed);
            setLoading(false);
            
            // Clear localStorage after loading
            localStorage.removeItem('lastExamResults');
            return;
          } catch (parseError) {
            console.error('Error parsing stored results:', parseError);
          }
        }
      }
      
      // Fallback to database lookup
      if (user?.uid && attemptId) {
        const attempt = await examAttemptManager.getExamAttemptForReview(attemptId, user.uid);
        if (attempt) {
          setExamAttempt(attempt);
          setResults({
            id: attempt.id,
            examId: attempt.examId,
            examTitle: attempt.examId,
            score: attempt.score,
            percentage: Math.round((attempt.score / attempt.assignedQuestions.length) * 100),
            correctAnswers: attempt.score,
            wrongAnswers: attempt.assignedQuestions.length - attempt.score - (attempt.unanswered || 0),
            unanswered: attempt.unanswered || 0,
            totalQuestions: attempt.assignedQuestions.length,
            timeSpent: attempt.timeSpent || 0,
            autoSubmitted: attempt.submitted,
            questions: attempt.assignedQuestions,
            userAnswers: attempt.userAnswers,
            endTime: attempt.endTime || attempt.updatedAt,
            createdAt: attempt.createdAt,
          });
        } else {
          setError("Exam results not found");
        }
      } else {
        setError("Invalid exam attempt");
      }
      
    } catch (error) {
      console.error('Error loading results:', error);
      setError("Failed to load exam results");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor((seconds / 60) % 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (percentage >= 80) return { level: "Very Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (percentage >= 70) return { level: "Good", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (percentage >= 60) return { level: "Fair", color: "text-orange-600", bg: "bg-orange-100" };
    return { level: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  const handleReviewAnswers = () => {
    if (examAttempt) {
      router.push(`/exam/${examId}/review?attemptId=${examAttempt.id}`);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Results
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(results.percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Submission Alert */}
        {isAutoSubmit && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                <span className="font-medium">Auto-submitted:</span> Your exam was automatically submitted when time expired.
              </p>
            </div>
          </div>
        )}

        {/* Main Results Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Exam Completed!</h1>
                <p className="text-blue-100">{results.examTitle}</p>
              </div>
            </div>
          </div>

          {/* Score Section */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {results.percentage}%
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Final Score
                </h2>
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${performance.bg}`}>
                  <Award className={`h-4 w-4 mr-2 ${performance.color}`} />
                  <span className={`font-medium ${performance.color}`}>
                    {performance.level}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <Progress 
                  value={results.percentage} 
                  className="h-3 mb-2"
                />
                <p className="text-sm text-gray-600">
                  {results.score} out of {results.totalQuestions} questions correct
                </p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {results.correctAnswers}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Correct Answers
                </div>
              </div>

              <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">
                  {results.wrongAnswers}
                </div>
                <div className="text-sm text-red-600 font-medium">
                  Incorrect Answers
                </div>
              </div>

              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-700">
                  {results.unanswered}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Unanswered
                </div>
              </div>
            </div>

            {/* Time Spent */}
            <div className="text-center mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Time Spent: {formatTime(results.timeSpent)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Button
                onClick={handleReviewAnswers}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Review Your Answers
              </Button>
              
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">What's Next?</p>
                  <ul className="space-y-1">
                    <li>• Review your answers to understand any mistakes</li>
                    <li>• Get AI explanations for questions you found challenging</li>
                    <li>• Use this feedback to improve your performance</li>
                    <li>• Consider taking more practice exams to strengthen weak areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
