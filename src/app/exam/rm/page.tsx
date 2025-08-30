// src/app/exam/rm/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  Lock,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define interfaces for PostgreSQL data
interface RMExamData {
  id: string;
  title: string;
  paper: string;
  description?: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  instructions?: any;
  settings?: any;
  isActive: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RMUserAccess {
  hasAccess: boolean;
  accessData?: any;
}

export default function RMExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rmExams, setRmExams] = useState<RMExamData[]>([]);
  const [rmUserAccess, setRmUserAccess] = useState<any>(null);
  const [rmAttempts, setRmAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRmExams = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch RM exams from PostgreSQL API
        const examsResponse = await fetch('/api/rm-exams');
        const examsResult = await examsResponse.json();

        // Fetch user access from PostgreSQL API
        let access = null;
        if (user?.uid) {
          const accessResponse = await fetch(`/api/check-rm-access?userId=${user.uid}`);
          const accessResult = await accessResponse.json();
          access = accessResult;
        }

        // Fetch user attempts from PostgreSQL API (if available)
        let attempts: any[] = [];
        if (user?.uid) {
          try {
            const attemptsResponse = await fetch(`/api/get-user-rm-attempts?userId=${user.uid}`);
            const attemptsResult = await attemptsResponse.json();
            attempts = attemptsResult.success ? attemptsResult.attempts : [];
          } catch (err) {
            console.warn('Could not fetch user attempts:', err);
            // Fallback to empty array if attempts API is not ready
            attempts = [];
          }
        }

        if (examsResult.success) {
          setRmExams(examsResult.exams || []);
        } else {
          setError("Failed to load RM exams.");
        }
        
        setRmUserAccess(access);
        setRmAttempts(attempts);

        if (!examsResult.success || (examsResult.exams && examsResult.exams.length === 0)) {
          setError("No RM exams found at this time.");
        }
      } catch (err) {
        console.error("Failed to fetch RM exams:", err);
        setError("Failed to load RM exams. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadRmExams();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-emerald-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Sign In Required
            </h2>
            <p className="text-slate-600 mb-6">
              Please sign in to access the RM exams.
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="primary"
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const hasRMAccess = rmUserAccess?.hasAccess;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-emerald-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-6 text-green-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                🩺 Registered Midwifery (RM) Exams
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Comprehensive midwifery exam preparation covering maternal care,
                obstetrics, and specialized midwifery practice.
              </p>
            </div>

            {/* Access Status */}
            {!hasRMAccess && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <Lock className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      RM Access Required
                    </h3>
                    <p className="text-blue-700 mb-4">
                      RM exams require separate access from RN exams. Purchase
                      RM exam access to unlock specialized midwifery questions
                      and practice materials.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => router.push("/dashboard/rm")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase RM Access (₦2,000)
                      </Button>
                      <Button
                        onClick={() => router.push("/dashboard/rm")}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Redeem Access Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasRMAccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      RM Access Active
                    </h3>
                    <p className="text-green-700">
                      You have full access to RM exams. Choose your paper below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-12">
                <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Reload Page
                </Button>
              </div>
            ) : rmExams.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  No RM exams found at this time.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Please check back later for more exams.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:gap-8">
                {rmExams.map((exam) => {
                  const canAccess = hasRMAccess;
                  const canStart = canAccess && exam.isActive && exam.isPublished;

                  // Check if user has completed this exam
                  const examAttempt = rmAttempts.find(
                    (attempt) => attempt.examId === exam.id && attempt.completed
                  );
                  const hasCompletedExam = !!examAttempt;

                  // Map PostgreSQL data to expected format
                  const examColor = exam.paper === 'paper1' ? 'from-green-500 to-emerald-600' : 'from-blue-500 to-cyan-600';

                  return (
                    <div
                      key={exam.id}
                      className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                        !canAccess ? "opacity-75" : ""
                      }`}
                    >
                      <div
                        className={`bg-gradient-to-r ${examColor} p-6 text-white relative`}
                      >
                        {!canAccess && (
                          <div className="absolute top-4 right-4">
                            <Lock className="h-6 w-6 text-white/70" />
                          </div>
                        )}

                        {hasCompletedExam && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">
                              {exam.title}
                            </h3>
                            <p className="text-green-100 mb-4">
                              {exam.description || `RM ${exam.paper} examination`}
                            </p>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                <span>{exam.totalQuestions} questions</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{exam.duration} minutes</span>
                              </div>
                            </div>

                            {hasCompletedExam && (
                              <div className="mt-3 text-sm">
                                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Score: {examAttempt.percentage}% (
                                  {examAttempt.correctAnswers}/
                                  {examAttempt.assignedQuestions.length})
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            {hasCompletedExam ? (
                              <Link
                                href={`/exam/rm/${exam.id}/results?attemptId=${examAttempt.id}`}
                              >
                                <Button
                                  variant="secondary"
                                  size="lg"
                                  className="text-slate-900"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Results
                                </Button>
                              </Link>
                            ) : canStart ? (
                              <Link href={`/exam/rm/${exam.id}`}>
                                <Button
                                  variant="secondary"
                                  size="lg"
                                  className="text-slate-900"
                                >
                                  Start Exam
                                </Button>
                              </Link>
                            ) : canAccess ? (
                              <Button
                                variant="secondary"
                                size="lg"
                                disabled
                                className="text-slate-900 opacity-50"
                              >
                                Schedule Required
                              </Button>
                            ) : (
                              <Button
                                onClick={() => router.push("/dashboard/rm")}
                                variant="secondary"
                                size="lg"
                                className="text-slate-900"
                              >
                                Get Access
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-4">
                          <p className="text-slate-600 text-sm">
                            {exam.paper === 'paper1' ? 'Paper 1' : 'Paper 2'} - RM Examination
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            Passing Score: {exam.passingScore}%
                          </p>
                        </div>

                        {!canAccess && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Access Required
                              </span>
                              <Link href="/rm/payment">
                                <span className="text-green-600 hover:text-green-700 text-sm font-medium">
                                  Purchase Access →
                                </span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-users-round text-green-600"
                  >
                    <path d="M18 21a8 8 0 0 0-16 0" />
                    <circle cx="10" cy="8" r="5" />
                    <path d="M22 21a8 8 0 0 0-16 0" />
                    <polyline points="13 2 13 9 22 9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Join the RM Community
                </h3>
                <p className="text-slate-600 mb-6">
                  Connect with other midwifery students and track your progress
                  on our specialized RM leaderboard
                </p>
                <Link href="/leaderboard">
                  <Button variant="outline" className="mx-auto">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
