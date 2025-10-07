// src/app/exam/rn/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen, Clock, Award, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllExams, ExamData } from "@/lib/examData"; // Import fetchAllExams
import { examAttemptManager } from "@/lib/examAttempts";

export default function RNExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rnExams, setRnExams] = useState<ExamData[]>([]);
  const [completedExams, setCompletedExams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRnExams = async () => {
      setLoading(true);
      setError(null);
      try {
        const allExams = await fetchAllExams();
        // Filter for exams specifically under the 'RN' category
        const filteredExams = allExams.filter((exam) => exam.category === "RN");
        setRnExams(filteredExams);

        // Load completed exams for this user
        if (user?.uid) {
          const attempts = await examAttemptManager.getUserExamAttempts(
            user.uid
          );
          const completed = new Set(
            attempts
              .filter(
                (attempt) => attempt.completed && attempt.examCategory === "RN"
              )
              .map((attempt) => attempt.examId)
          );
          setCompletedExams(completed);
        }

        if (filteredExams.length === 0) {
          setError("No Registered Nursing exams found at this time.");
        }
      } catch (err) {
        console.error("Failed to fetch RN exams:", err);
        setError("Failed to load RN exams. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadRnExams();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Sign In Required
            </h2>
            <p className="text-slate-600 mb-6">
              Please sign in to access the RN exams.
            </p>
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-6 text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                🩺 Registered Nursing (RN) Exams
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Choose from our comprehensive RN exam collection. Each exam is
                designed to test different aspects of nursing knowledge and
                practice.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span className="text-lg">ℹ️</span>
                <span className="font-medium">
                  Each exam can only be taken once. Choose wisely!
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-12">
                <p className="text-lg font-medium mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Reload Page
                </Button>
              </div>
            ) : rnExams.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  No RN exams found at this time.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Please check back later for more exams.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:gap-8">
                {rnExams.map((exam) => {
                  const isCompleted = completedExams.has(exam.id);

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative"
                    >
                      {isCompleted && (
                        <div className="absolute top-4 right-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </div>
                      )}

                      <div
                        className={`bg-gradient-to-r ${exam.color} p-6 text-white`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">
                              {exam.title}
                            </h3>
                            <p className="text-blue-100 mb-4">
                              {exam.description}
                            </p>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                <span>{exam.questionsCount} questions</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{exam.durationMinutes} minutes</span>
                              </div>
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                <span>{exam.difficulty}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {isCompleted ? (
                              <Button
                                variant="secondary"
                                size="lg"
                                className="text-slate-900"
                                onClick={async () => {
                                  // Get the attempt for this exam
                                  const attempts =
                                    await examAttemptManager.getUserExamAttempts(
                                      user.uid
                                    );
                                  const attempt = attempts.find(
                                    (a) =>
                                      a.examId === exam.id &&
                                      a.completed &&
                                      a.examCategory === "RN"
                                  );
                                  if (attempt) {
                                    router.push(
                                      `/exam/${exam.id}/results?attemptId=${attempt.id}`
                                    );
                                  }
                                }}
                              >
                                View Results
                              </Button>
                            ) : (
                              <Link href={`/exam/${exam.id}`}>
                                <Button
                                  variant="secondary"
                                  size="lg"
                                  className="text-slate-900"
                                  disabled={!exam.available} // Disable if not available
                                >
                                  {exam.available
                                    ? "Start Exam"
                                    : "Coming Soon"}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="font-semibold text-slate-800 mb-3">
                          Topics Covered:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exam.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center mb-4">
                  {/* Using a more generic icon for community */}
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
                    className="lucide lucide-users-round text-blue-600"
                  >
                    <path d="M18 21a8 8 0 0 0-16 0" />
                    <circle cx="10" cy="8" r="5" />
                    <path d="M22 21a8 8 0 0 0-16 0" />
                    <polyline points="13 2 13 9 22 9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Join the Community
                </h3>
                <p className="text-slate-600 mb-6">
                  See how you rank against other nursing students on our
                  leaderboard
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
