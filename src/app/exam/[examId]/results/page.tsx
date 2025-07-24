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
  ArrowLeft,
  BookOpen,
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
  const [showReview, setShowReview] = useState(false);
  
  // Pagination state for question review
  const [currentQuestionPage, setCurrentQuestionPage] = useState(0);
  const [loadingAI, setLoadingAI] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<{[key: number]: string}>({});
  
  const questionsPerPage = 1; // Show one question at a time for better focus

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
            examTitle: attempt.examId, // You might want to fetch the actual title
            score: attempt.score,
            percentage: attempt.percentage,
            correctAnswers: attempt.correctAnswers,
            wrongAnswers: attempt.wrongAnswers,
            unanswered: attempt.unanswered,
            totalQuestions: attempt.correctAnswers + attempt.wrongAnswers + attempt.unanswered,
            timeSpent: attempt.timeSpent,
            questions: (attempt as any).questions,
            userAnswers: (attempt as any).userAnswers,
            endTime: attempt.endTime || new Date(),
            createdAt: attempt.createdAt,
          });
        } else {
          setError("Exam results not found.");
        }
      } else {
        setError("No exam data available. Please retake the exam.");
      }
    } catch (error) {
      console.error("Error loading results:", error);
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
    return percentage >= 70;
  };

  // Get AI explanation for a specific question
  const getAIExplanation = async (questionIndex: number) => {
    if (!results?.questions || !results?.userAnswers) return;
    
    const question = results.questions[questionIndex];
    const userAnswer = results.userAnswers[questionIndex];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (aiExplanations[questionIndex]) {
      return; // Already have explanation
    }
    
    setLoadingAI(questionIndex);
    
    try {
      // Call AI explanation API
      const response = await fetch('/api/ai-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer,
          isCorrect: isCorrect
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiExplanations(prev => ({
          ...prev,
          [questionIndex]: data.explanation
        }));
      } else {
        // Fallback explanation
        const correctOptionText = question.options[question.correctAnswer];
        const userAnswerText = userAnswer !== null ? question.options[userAnswer] : 'No answer selected';
        
        let explanation = `**Correct Answer:** ${correctOptionText}\n\n`;
        
        if (isCorrect) {
          explanation += "✅ **Well done!** You selected the correct answer.\n\n";
        } else {
          explanation += `❌ **Your Answer:** ${userAnswerText}\n\n`;
          explanation += "**Why this is incorrect:** This option doesn't fully address the question requirements.\n\n";
        }
        
        explanation += "**Key Learning Point:** Review the fundamental concepts related to this topic for better understanding.";
        
        setAiExplanations(prev => ({
          ...prev,
          [questionIndex]: explanation
        }));
      }
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      // Provide basic explanation as fallback
      const correctOptionText = question.options[question.correctAnswer];
      const explanation = `**Correct Answer:** ${correctOptionText}\n\nFor detailed explanations, please review your study materials or consult with your instructor.`;
      
      setAiExplanations(prev => ({
        ...prev,
        [questionIndex]: explanation
      }));
    } finally {
      setLoadingAI(null);
    }
  };

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
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Results Not Available
            </h2>
            <p className="text-gray-600 mb-6">{error || 'No results found'}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-8 text-center">
            {isAutoSubmit && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="text-orange-800 text-sm">
                  Time expired - Exam was automatically submitted
                </p>
              </div>
            )}
            
            <div className="mb-6">
              {isPassing(results.percentage) ? (
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              ) : (
                <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              )}
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isPassing(results.percentage) ? "Congratulations!" : "Exam Completed"}
              </h1>
              
              <p className="text-lg text-gray-600 mb-4">
                {results.examTitle}
              </p>
              
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getGradeColor(results.percentage)}`}>
                    {results.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getGradeColor(results.percentage)}`}>
                    {getGradeLetter(results.percentage)}
                  </div>
                  <div className="text-sm text-gray-600">Grade</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {results.correctAnswers}/{results.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
              </div>
            </div>
            
            <Progress 
              value={results.percentage} 
              className="w-full max-w-md mx-auto mb-4"
            />
            
            <p className={`text-lg font-medium ${
              isPassing(results.percentage) 
                ? "text-green-600" 
                : "text-red-600"
            }`}>
              {isPassing(results.percentage) 
                ? "🎉 You passed!" 
                : "Keep studying and try again!"}
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {results.correctAnswers}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Correct Answers</h3>
            <p className="text-sm text-gray-600">
              {Math.round((results.correctAnswers / results.totalQuestions) * 100)}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {results.wrongAnswers}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Wrong Answers</h3>
            <p className="text-sm text-gray-600">
              {Math.round((results.wrongAnswers / results.totalQuestions) * 100)}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {results.unanswered}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Unanswered</h3>
            <p className="text-sm text-gray-600">
              {Math.round((results.unanswered / results.totalQuestions) * 100)}% of total
            </p>
          </div>
        </div>

        {/* Time Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Clock className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Time Statistics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(results.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {Math.round(results.timeSpent / results.totalQuestions)}s
              </div>
              <div className="text-sm text-gray-600">Average per Question</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {results.questions && results.userAnswers && (
            <Button
              onClick={() => setShowReview(!showReview)}
              variant="outline"
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {showReview ? 'Hide Review' : 'Review Answers'}
            </Button>
          )}
          
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button 
            onClick={() => router.push(`/exam/${examId}`)} 
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Exam
          </Button>
        </div>

        {/* Question Review with Pagination */}
        {showReview && results.questions && results.userAnswers && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Question Review
              </h3>
              <div className="text-sm text-gray-500">
                Question {currentQuestionPage + 1} of {results.questions.length}
              </div>
            </div>
            
            {/* Current Question Display */}
            {(() => {
              const questionIndex = currentQuestionPage;
              const question = results.questions[questionIndex];
              const userAnswer = results.userAnswers[questionIndex];
              const isCorrect = userAnswer === question.correctAnswer;
              const isUnanswered = userAnswer === null || userAnswer === undefined;
              
              return (
                <div className="space-y-6">
                  <div 
                    className={`p-6 rounded-lg border-2 ${
                      isUnanswered 
                        ? 'border-yellow-300 bg-yellow-50'
                        : isCorrect 
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start space-x-3 mb-4">
                      {isUnanswered ? (
                        <AlertCircle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                      ) : isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Question {questionIndex + 1}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isUnanswered 
                              ? 'bg-yellow-100 text-yellow-800'
                              : isCorrect 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isUnanswered ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        
                        <p className="text-gray-800 text-base mb-4 leading-relaxed">
                          {question.question}
                        </p>
                        
                        {/* Answer Options */}
                        <div className="space-y-3 mb-4">
                          {question.options.map((option: string, optionIndex: number) => (
                            <div 
                              key={optionIndex}
                              className={`p-3 rounded-lg border text-sm ${
                                optionIndex === question.correctAnswer
                                  ? 'bg-green-100 border-green-300 text-green-900 font-medium'
                                  : optionIndex === userAnswer && !isCorrect
                                  ? 'bg-red-100 border-red-300 text-red-900'
                                  : optionIndex === userAnswer && isCorrect
                                  ? 'bg-green-100 border-green-300 text-green-900 font-medium'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex-1">{option}</span>
                                <div className="flex items-center space-x-2 ml-3">
                                  {optionIndex === question.correctAnswer && (
                                    <span className="text-green-600 font-medium">✓ Correct</span>
                                  )}
                                  {optionIndex === userAnswer && optionIndex !== question.correctAnswer && (
                                    <span className="text-red-600 font-medium">✗ Your choice</span>
                                  )}
                                  {optionIndex === userAnswer && optionIndex === question.correctAnswer && (
                                    <span className="text-green-600 font-medium">✓ Your choice</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Status Message */}
                        {isUnanswered && (
                          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <p className="text-yellow-800 text-sm font-medium">
                              ⚠️ You did not answer this question. Make sure to answer all questions in future exams!
                            </p>
                          </div>
                        )}
                        
                        {/* AI Explanation Section */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">AI Explanation</h5>
                            {!aiExplanations[questionIndex] && (
                              <Button
                                onClick={() => getAIExplanation(questionIndex)}
                                disabled={loadingAI === questionIndex}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                {loadingAI === questionIndex ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                                    Getting explanation...
                                  </>
                                ) : (
                                  'Get AI Explanation'
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {aiExplanations[questionIndex] ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="prose prose-sm text-blue-900 whitespace-pre-line">
                                {aiExplanations[questionIndex]}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-gray-600 text-sm italic">
                                Click "Get AI Explanation" to understand why this answer is correct and learn more about the topic.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      onClick={() => setCurrentQuestionPage(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionPage === 0}
                      variant="outline"
                      className="flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    {/* Question Progress Dots */}
                    <div className="flex items-center space-x-2">
                      {results.questions.map((_, index) => {
                        const qUserAnswer = results.userAnswers![index];
                        const qIsCorrect = qUserAnswer === results.questions![index].correctAnswer;
                        const qIsUnanswered = qUserAnswer === null || qUserAnswer === undefined;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentQuestionPage(index)}
                            className={`w-8 h-8 rounded-full text-xs font-medium border-2 transition-all ${
                              index === currentQuestionPage
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : qIsUnanswered
                                ? 'border-yellow-300 bg-yellow-100 text-yellow-800 hover:border-yellow-400'
                                : qIsCorrect
                                ? 'border-green-300 bg-green-100 text-green-800 hover:border-green-400'
                                : 'border-red-300 bg-red-100 text-red-800 hover:border-red-400'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    <Button
                      onClick={() => setCurrentQuestionPage(prev => Math.min(results.questions!.length - 1, prev + 1))}
                      disabled={currentQuestionPage === results.questions.length - 1}
                      variant="outline"
                      className="flex items-center"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
