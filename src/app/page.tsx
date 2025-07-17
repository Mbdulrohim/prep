"use client";

import { ExamSelector } from "@/components/exam/ExamSelector";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Users,
  Award,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold tracking-wide text-blue-700 bg-blue-100 rounded-full mb-6">
                <CheckCircle className="h-4 w-4 mr-2" />
                PROFESSIONAL READINESS EXAM PLATFORM
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                Master Your{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text">
                  Nursing Exams
                </span>{" "}
                with Confidence
              </h1>

              <p className="mt-6 text-xl max-w-3xl mx-auto text-slate-600">
                Comprehensive mock exams for RN, RM, and RPHN certifications.
                Join thousands of successful healthcare professionals who
                trusted PREP.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      View Sample Questions
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-slate-600">
                    Professional Exams
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    10,000+
                  </div>
                  <div className="text-sm text-slate-600">
                    Practice Questions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-slate-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exam Selection Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Choose Your Exam Path
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Select the professional certification exam you're preparing for
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* RN Exam Card with Sub-exams */}
              <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 flex flex-col items-center">
                <h3 className="text-xl font-bold text-blue-700 mb-2">
                  Registered Nursing (RN)
                </h3>
                <p className="text-slate-600 mb-4 text-center">
                  Core professional nursing exam. Includes two papers.
                </p>
                <div className="w-full">
                  <div className="mb-2">
                    <Link href="/exam/rn-paper-1">
                      <Button variant="primary" className="w-full mb-2">
                        RN Paper 1
                      </Button>
                    </Link>
                  </div>
                  <div>
                    <Link href="/exam/rn-paper-2">
                      <Button variant="primary" className="w-full">
                        RN Paper 2
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              {/* RM Exam Card */}
              <div className="bg-white rounded-2xl shadow-md border border-green-200 p-6 flex flex-col items-center">
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  Registered Midwifery (RM)
                </h3>
                <p className="text-slate-600 mb-4 text-center">
                  Antenatal, intrapartum, and postnatal care exam.
                </p>
                <Link href="/exam/rm">
                  <Button variant="primary" className="w-full">
                    Start RM Exam
                  </Button>
                </Link>
              </div>
              {/* RPHN Exam Card */}
              <div className="bg-white rounded-2xl shadow-md border border-purple-200 p-6 flex flex-col items-center">
                <h3 className="text-xl font-bold text-purple-700 mb-2">
                  Public Health Nursing (RPHN)
                </h3>
                <p className="text-slate-600 mb-4 text-center">
                  Community health, disease prevention, and health promotion
                  exam.
                </p>
                <Link href="/exam/rphn">
                  <Button variant="primary" className="w-full">
                    Start RPHN Exam
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Why Choose PREP?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Our platform provides everything you need to succeed
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <BookOpen className="h-8 w-8 text-blue-600" />,
                  title: "Realistic Exams",
                  description:
                    "Simulate actual test conditions with timed exams and authentic question formats.",
                },
                {
                  icon: <Target className="h-8 w-8 text-green-600" />,
                  title: "Detailed Analysis",
                  description:
                    "Get performance breakdowns with explanations for every question.",
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
                  title: "Progress Tracking",
                  description:
                    "Monitor your improvement with comprehensive analytics and reports.",
                },
                {
                  icon: <Users className="h-8 w-8 text-orange-600" />,
                  title: "Leaderboard",
                  description:
                    "Compete with peers and see how you rank among other students.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 transition-all hover:shadow-lg hover:scale-105"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-4 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm text-center">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typing Page & University Selection Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                Get Started: Typing Page & University Selection
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Choose your university from the list and begin your journey.
                Your access code is just{" "}
                <span className="font-bold text-blue-600">₦1,000</span> per
                exam.
              </p>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Type your name..."
                  className="w-full px-4 py-2 border rounded-lg mb-4 text-lg"
                />
                <select className="w-full px-4 py-2 border rounded-lg text-lg">
                  <option value="">Select your university...</option>
                  <option value="University of Lagos">
                    University of Lagos
                  </option>
                  <option value="University of Ibadan">
                    University of Ibadan
                  </option>
                  <option value="Obafemi Awolowo University">
                    Obafemi Awolowo University
                  </option>
                  <option value="Ahmadu Bello University">
                    Ahmadu Bello University
                  </option>
                  <option value="University of Nigeria">
                    University of Nigeria
                  </option>
                  <option value="Lagos State University">
                    Lagos State University
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-blue-700">
                  Access Code:
                </span>{" "}
                ₦1,000 per exam
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl max-w-2xl mx-auto mb-10 text-blue-100">
                Join thousands of healthcare professionals who have passed their
                exams with confidence
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="mx-auto"
                onClick={() => {
                  const examSelector = document.getElementById("exam-selector");
                  examSelector?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Select Your Exam
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} PREP. All Rights Reserved.
              <span className="block mt-2 text-blue-300">
                Built for Excellence in Healthcare Education
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
