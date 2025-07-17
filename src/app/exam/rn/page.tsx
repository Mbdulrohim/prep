"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen, Clock, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const rnExams = [
  {
    id: "rn-fundamentals",
    title: "RN Fundamentals",
    description:
      "Core nursing principles, patient care basics, and fundamental skills",
    questions: 100,
    duration: "2 hours",
    difficulty: "Beginner",
    topics: [
      "Basic Patient Care",
      "Vital Signs",
      "Infection Control",
      "Safety",
      "Ethics",
    ],
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "rn-medical-surgical",
    title: "RN Medical-Surgical",
    description: "Advanced medical-surgical nursing concepts and procedures",
    questions: 120,
    duration: "2.5 hours",
    difficulty: "Intermediate",
    topics: [
      "Cardiovascular",
      "Respiratory",
      "Gastrointestinal",
      "Endocrine",
      "Surgical Care",
    ],
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: "rn-pediatrics",
    title: "RN Pediatrics",
    description:
      "Pediatric nursing care for infants, children, and adolescents",
    questions: 90,
    duration: "2 hours",
    difficulty: "Intermediate",
    topics: [
      "Growth & Development",
      "Immunizations",
      "Pediatric Conditions",
      "Family Care",
      "Emergency Care",
    ],
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function RNExamPage() {
  const { user } = useAuth();
  const router = useRouter();

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
            </div>

            <div className="grid gap-6 md:gap-8">
              {rnExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`bg-gradient-to-r ${exam.color} p-6 text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          {exam.title}
                        </h3>
                        <p className="text-blue-100 mb-4">{exam.description}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>{exam.questions} questions</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{exam.duration}</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            <span>{exam.difficulty}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Link href={`/exam/${exam.id}`}>
                          <Button
                            variant="secondary"
                            size="lg"
                            className="text-slate-900"
                          >
                            Start Exam
                          </Button>
                        </Link>
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
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-blue-600" />
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
