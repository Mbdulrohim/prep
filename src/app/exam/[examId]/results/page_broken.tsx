"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Calculating Your Results...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your exam answers and calculate your score.
            </p>
          </div>
        </div>
      </div>
    );
  }eExam } from "@/context/ExamContext";
import { ExamProvider } from "@/components/exam/ExamProvider";
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

function ExamResultsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const examId = params.examId as string;
  const attemptId = searchParams.get('attemptId');
  
  // Use exam context to get questions and answers
  const { questions, userAnswers, examDetails } = useExam();
  
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState<{
    score: number;
    percentage: number;
    correctAnswers: number;
    wrongAnswers: number;
    unanswered: number;
    totalQuestions: number;
  } | null>(null);

  // Calculate results from current exam data IMMEDIATELY
  useEffect(() => {
    // First check if we have immediate results in localStorage
    const isImmediate = searchParams.get('immediate') === 'true';
    
    if (isImmediate) {
      const storedResults = localStorage.getItem('lastExamResults');
      if (storedResults) {
        try {
          const results = JSON.parse(storedResults);
          console.log('Loading immediate results from localStorage:', results);
          
          setCalculatedResults({
            score: results.score,
            percentage: results.percentage,
            correctAnswers: results.correctAnswers,
            wrongAnswers: results.wrongAnswers,
            unanswered: results.unanswered,
            totalQuestions: results.totalQuestions
          });
          
          setExamAttempt(results);
          setLoading(false);
          
          // Clear stored results after loading
          localStorage.removeItem('lastExamResults');
          return;
        } catch (error) {
          console.error('Error parsing stored results:', error);
        }
      }
    }
    
    // Fallback to context data
    if (questions.length > 0 && userAnswers.length > 0) {
      console.log('Calculating results from exam context...');
      calculateResults();
    } else if (user && attemptId) {
      // Only load from database if we don't have any data
      console.log('Loading results from database...');
      loadExamResults();
    } else {
      // No data available, show error
      setError('No exam data found. Please retake the exam.');
      setLoading(false);
    }
  }, [questions, userAnswers, user, attemptId, searchParams]);

  const calculateResults = () => {
    console.log('Calculating results with:', { questions: questions.length, answers: userAnswers.length });
    
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      if (userAnswer === null || userAnswer === undefined) {
        unanswered++;
      } else if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });
    
    const totalQuestions = questions.length;
    const score = correctAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    const results = {
      score,
      percentage,
      correctAnswers,
      wrongAnswers,
      unanswered,
      totalQuestions
    };
    
    console.log('Results calculated:', results);
    
    setCalculatedResults(results);
    setLoading(false);
  };

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

  if (error || (!calculatedResults && !examAttempt)) {
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

  // Use calculated results or fallback to exam attempt data
  const results = calculatedResults || {
    score: examAttempt?.score || 0,
    percentage: examAttempt?.percentage || 0,
    correctAnswers: examAttempt?.correctAnswers || 0,
    wrongAnswers: examAttempt?.wrongAnswers || 0,
    unanswered: examAttempt?.unanswered || 0,
    totalQuestions: (examAttempt?.assignedQuestions?.length || questions.length || 0)
  };

  const passed = isPassing(results.percentage);

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
                {examDetails?.category || examAttempt?.examCategory || 'Exam'} - {passed ? 'Passed' : 'Not Passed'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {results.percentage}%
              </div>
              <div className="text-lg">
                Grade: {getGradeLetter(results.percentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-600 mb-1">
              {results.correctAnswers}
            </div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-red-600 mb-1">
              {results.wrongAnswers}
            </div>
            <div className="text-sm text-gray-600">Wrong</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {results.unanswered}
            </div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {examAttempt ? formatTime(examAttempt.timeSpent || 0) : 'N/A'}
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
                <span className={`font-semibold ${getGradeColor(results.percentage)}`}>
                  {results.score}/{results.totalQuestions}
                </span>
              </div>
              <Progress value={results.percentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-medium">
                  Correct: {((results.correctAnswers / results.totalQuestions) * 100).toFixed(1)}%
                </div>
                <Progress value={(results.correctAnswers / results.totalQuestions) * 100} className="h-2" />
              </div>
              <div>
                <div className="text-red-600 font-medium">
                  Wrong: {((results.wrongAnswers / results.totalQuestions) * 100).toFixed(1)}%
                </div>
                <Progress value={(results.wrongAnswers / results.totalQuestions) * 100} className="h-2" />
              </div>
              <div>
                <div className="text-yellow-600 font-medium">
                  Unanswered: {((results.unanswered / results.totalQuestions) * 100).toFixed(1)}%
                </div>
                <Progress value={(results.unanswered / results.totalQuestions) * 100} className="h-2" />
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
                  ? `Congratulations! You achieved ${results.percentage}% which meets the 70% passing requirement.`
                  : `You scored ${results.percentage}% but need 70% to pass. You can retake this exam.`
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
                <span className="font-medium">{examId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{results.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flagged Questions:</span>
                <span className="font-medium">{examAttempt?.flaggedQuestions?.length || 0}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium">
                  {examAttempt ? new Date(examAttempt.startTime).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Time:</span>
                <span className="font-medium">
                  {examAttempt?.endTime ? new Date(examAttempt.endTime).toLocaleString() : 'Just completed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{examAttempt ? formatTime(examAttempt.timeSpent || 0) : 'N/A'}</span>
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

// Wrap with ExamProvider and export
export default function ExamResultsPage() {
  return (
    <ExamProvider>
      <ExamResultsContent />
    </ExamProvider>
  );
}
