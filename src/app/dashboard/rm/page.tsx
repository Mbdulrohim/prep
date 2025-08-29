// src/app/dashboard/rm/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { RMPurchase } from "@/components/dashboard/RMPurchase";
import { RMCodeRedemption } from "@/components/dashboard/RMCodeRedemption";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  Lock, 
  FileText, 
  Clock,
  AlertTriangle,
  Star,
  Users,
  Target,
  Zap,
  Award,
  BookOpen
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchRMExams, RMExamData } from "@/lib/rmExamData";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";

export default function RMDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  // State
  const [rmExams, setRmExams] = useState<RMExamData[]>([]);
  const [rmUserAccess, setRmUserAccess] = useState<any>(null);
  const [rmUserAttempts, setRmUserAttempts] = useState<RMExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load RM data
  useEffect(() => {
    if (user && userProfile) {
      loadRMData();
    }
  }, [user, userProfile]);

  const loadRMData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const [exams, access, attempts] = await Promise.all([
        fetchRMExams(),
        rmUserAccessManager.getRMUserAccess(user.uid),
        rmExamAttemptManager.getUserRMExamAttempts(user.uid),
      ]);
      
      setRmExams(exams);
      setRmUserAccess(access);
      setRmUserAttempts(attempts);
    } catch (error) {
      console.error("Error loading RM data:", error);
      setError("Failed to load RM exam data");
    } finally {
      setLoading(false);
    }
  };

  const refreshRMAccess = async () => {
    if (!user?.uid) return;
    
    try {
      setAccessLoading(true);
      const access = await rmUserAccessManager.getRMUserAccess(user.uid);
      setRmUserAccess(access);
    } catch (error) {
      console.error("Error refreshing RM access:", error);
    } finally {
      setAccessLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!user) {
    router.push("/");
    return null;
  }

  // Show profile setup if incomplete
  if (!userProfile?.displayName || !userProfile?.university) {
    router.push("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-700">Loading RM dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasRMAccess = rmUserAccess?.hasAccess;
  const completedAttempts = rmUserAttempts.filter(a => a.completed).length;
  const averageScore = rmUserAttempts.length > 0 
    ? Math.round(rmUserAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / rmUserAttempts.length)
    : 0;
  const bestScore = rmUserAttempts.length > 0 
    ? Math.max(...rmUserAttempts.map(a => a.percentage || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-6 text-green-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main Dashboard
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🩺 RM (Registered Midwifery) Exams
            </h1>
            <p className="text-gray-600">
              {userProfile.displayName} • {userProfile.university}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {!hasRMAccess ? (
          /* Payment and Access Section */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Payment Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Get RM Exam Access</h2>
                      <p className="text-green-100">
                        Specialized midwifery exam preparation
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">500+</div>
                      <div className="text-sm text-green-100">RM Questions</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">2 Papers</div>
                      <div className="text-sm text-green-100">Complete Coverage</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Award className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-lg font-bold">₦2,000</div>
                      <div className="text-sm text-green-100">One-time Payment</div>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      RM Exam Access Package
                    </h3>
                    <div className="text-4xl font-bold text-green-600 mb-2">₦2,000</div>
                    <p className="text-gray-600">One-time payment • Lifetime access</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                        RM Paper 1
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Antenatal Care
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Labor & Delivery
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Postnatal Care
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Newborn Care
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Family Planning
                        </li>
                      </ul>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                        RM Paper 2
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          High-Risk Pregnancies
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Obstetric Emergencies
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Advanced Procedures
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Neonatal Resuscitation
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Professional Practice
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Payment Components */}
                  <div className="space-y-6">
                    <RMPurchase />
                    
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    <RMCodeRedemption />
                  </div>
                </div>
              </div>
            </div>

            {/* Side Information */}
            <div className="space-y-6">
              {/* Features Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  RM Package Includes
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Complete RM Paper 1 & Paper 2 access
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    500+ specialized midwifery questions
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Detailed clinical explanations
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    AI-powered assistance
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Progress tracking & analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Independent from RN exams
                  </li>
                </ul>
              </div>

              {/* Info Card */}
              <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Why Separate RM Access?
                </h3>
                <div className="text-sm text-green-700 space-y-2">
                  <p>• RM exams require specialized midwifery knowledge</p>
                  <p>• Independent question bank with clinical scenarios</p>
                  <p>• Focused preparation for midwifery practice</p>
                  <p>• Admin-configurable exam settings</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard for users with RM access */
          <div>
            {/* Access Status Hero */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>

                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold">
                            RM Access Active
                          </h2>
                          <p className="text-green-100">
                            Ready for midwifery excellence
                          </p>
                        </div>
                      </div>

                      <p className="text-lg text-white/90 mb-6 max-w-2xl">
                        Access method: {rmUserAccess.accessMethod} • 
                        Attempts used: {Object.keys(rmUserAccess.rmAttempts || {}).length} / {rmUserAccess.adminSettings?.maxAttempts || 1}
                      </p>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{completedAttempts}</div>
                          <div className="text-sm text-green-200">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{averageScore}%</div>
                          <div className="text-sm text-green-200">Average</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{bestScore}%</div>
                          <div className="text-sm text-green-200">Best Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 lg:w-64">
                      <Button
                        onClick={() => router.push("/exam/rm")}
                        className="bg-white text-green-600 hover:bg-gray-50 font-semibold py-4 text-lg shadow-lg"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Choose RM Paper
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RM Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rmExams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${exam.color.replace('from-', 'bg-').replace('to-', '').split(' ')[0].replace('bg-', 'bg-') || 'bg-green-100'}`}>
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    {exam.available ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Available
                      </span>
                    ) : exam.scheduling?.isScheduled ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Scheduled
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Schedule Required
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {exam.description}
                  </p>

                  {/* Show scheduling info if exam is scheduled but not available */}
                  {exam.scheduling?.isScheduled && !exam.available && exam.scheduling.scheduledDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-sm text-blue-700">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          Scheduled for {exam.scheduling.scheduledDate.toLocaleDateString()} at{' '}
                          {exam.scheduling.scheduledDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Questions:</span>
                      <div className="font-semibold">{exam.questionsCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-semibold">{exam.durationMinutes} mins</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/exam/rm/${exam.id}`)}
                    disabled={!exam.available}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {exam.available 
                      ? 'Start Exam' 
                      : exam.scheduling?.isScheduled 
                        ? 'Scheduled - Not Yet Available'
                        : 'Waiting for Schedule'
                    }
                  </Button>
                </div>
              ))}
            </div>

            {/* Recent Attempts */}
            {rmUserAttempts.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent RM Attempts
                </h3>
                <div className="space-y-3">
                  {rmUserAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{attempt.examTitle}</div>
                        <div className="text-sm text-gray-600">
                          {attempt.completed ? (
                            <>Score: {attempt.percentage}% • {attempt.correctAnswers}/{attempt.assignedQuestions.length}</>
                          ) : (
                            'In Progress'
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {attempt.endTime ? new Date(attempt.endTime).toLocaleDateString() : 'Ongoing'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
