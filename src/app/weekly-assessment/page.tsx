// src/app/weekly-assessment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { standaloneWeeklyAssessmentManager, StandaloneWeeklyAssessment, StandaloneAssessmentAttempt } from "../../lib/standaloneWeeklyAssessments";
import StandaloneWeeklyAssessmentFlow from "../../components/exam/StandaloneWeeklyAssessmentFlow";
import { Calendar, Clock, Users, Trophy, AlertCircle, Play } from "lucide-react";

const WeeklyAssessmentPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAssessment, setCurrentAssessment] = useState<StandaloneWeeklyAssessment | null>(null);
  const [userAttempt, setUserAttempt] = useState<StandaloneAssessmentAttempt | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchAssessmentData(currentUser);
      } else {
        router.push("/auth/login");
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAssessmentData = async (currentUser: User) => {
    try {
      // Get current assessment
      const assessment = await standaloneWeeklyAssessmentManager.getCurrentStandaloneAssessment();
      setCurrentAssessment(assessment);

      if (assessment) {
        // Check if user has already attempted this assessment
        const attempt = await standaloneWeeklyAssessmentManager.getUserAttemptForCurrentAssessment(currentUser.uid);
        setUserAttempt(attempt);
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Not specified";
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (endDate: Date | undefined) => {
    if (!endDate) return null;
    
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weekly assessment...</p>
        </div>
      </div>
    );
  }

  if (showAssessment && currentAssessment) {
    return <StandaloneWeeklyAssessmentFlow />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Assessment</h1>
                    <p className="text-lg text-purple-100 mb-6">
            Test your knowledge with our weekly assessment
          </p>
        </div>

        {!currentAssessment ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Assessment
              </h2>
              <p className="text-gray-600 mb-4">
                There is no weekly assessment available at the moment. Please check back later.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : userAttempt && userAttempt.completed ? (
          // User has already completed the assessment
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900">Assessment Completed</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{userAttempt.score}</div>
                  <div className="text-sm text-blue-800">Correct Answers</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{userAttempt.percentage}%</div>
                  <div className="text-sm text-green-800">Score Percentage</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{Math.floor(userAttempt.timeSpent / 60)}</div>
                  <div className="text-sm text-purple-800">Minutes Taken</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Assessment:</strong> {currentAssessment.title}</p>
                <p><strong>Completed:</strong> {formatDate(userAttempt.endTime)}</p>
                <p><strong>Total Questions:</strong> {userAttempt.totalQuestions}</p>
                <p><strong>Wrong Answers:</strong> {userAttempt.wrongAnswers}</p>
                <p><strong>Unanswered:</strong> {userAttempt.unanswered}</p>
              </div>

              {/* Review Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/weekly-assessment/review?attemptId=${userAttempt.id}&assessmentId=${currentAssessment.id}`)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Trophy className="w-5 h-5" />
                  <span>Review Answers</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Review your answers and explanations anytime while this assessment is available
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{currentAssessment.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium">{currentAssessment.description || "No description"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{currentAssessment.timeLimit} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{currentAssessment.totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Assessment is available to take
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentAssessment.title}</h2>
              
              {currentAssessment.description && (
                <p className="text-gray-600 mb-4">{currentAssessment.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">{currentAssessment.timeLimit} minutes</div>
                    <div className="text-sm text-blue-700">Time Limit</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">{currentAssessment.totalQuestions}</div>
                    <div className="text-sm text-green-700">Questions</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-900">Weekly</div>
                    <div className="text-sm text-purple-700">Assessment Type</div>
                  </div>
                </div>
              </div>

              {currentAssessment.isScheduled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Scheduled Assessment</h4>
                      <div className="text-sm text-yellow-800 mt-1 space-y-1">
                        {currentAssessment.availableDate && (
                          <p><strong>Available from:</strong> {formatDate(currentAssessment.availableDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Answer all questions to the best of your ability</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Flag questions you want to review later</li>
                  <li>• Use the calculator tool if needed (Ctrl+Shift+C)</li>
                  <li>• Submit your assessment when you're ready or when time runs out</li>
                  <li>• This is a weekly assessment - independent of exam categories</li>
                </ul>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAssessment(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Assessment</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyAssessmentPage;
