"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ArrowRight, BookOpen, Users, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Show landing page for non-authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-lg text-slate-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Header />

      {/* Hero Section with Exam Categories */}
      <section className="px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
              Master Your <span className="text-blue-600">Professional</span>{" "}
              Exams
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              The premier platform for nursing and midwifery exam preparation.
              Practice with real-world questions and track your progress.
            </p>
          </div>

          {/* Exam Categories - Prominently Displayed */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              Choose Your Exam Category
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* RN Category - Available */}
              <Link href="/category/rn" className="block group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border group-hover:border-blue-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Registered Nurse (RN)
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    Comprehensive nursing practice exams
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 font-medium">Paper 1 & Paper 2</span>
                      <span className="text-green-600 font-medium">Available</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>250 questions each</span>
                      <span>2.5 hours</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* RM Category - Locked */}
              <div className="block group opacity-60 cursor-not-allowed">
                <div className="bg-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Registered Midwife (RM)
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Specialized midwifery practice exams
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Paper 1 & Paper 2</span>
                      <span className="text-red-500 font-medium">Coming Soon</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>250 questions each</span>
                      <span>2.5 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RPHN Category - Locked */}
              <div className="block group opacity-60 cursor-not-allowed">
                <div className="bg-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Public Health Nurse (RPHN)
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Community health and public health nursing practice
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Paper 1 & Paper 2</span>
                      <span className="text-red-500 font-medium">Coming Soon</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>250 questions each</span>
                      <span>2.5 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="px-8 py-3 text-lg">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline" className="px-8 py-3 text-lg">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
            Why Choose PREP?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Comprehensive Practice
              </h3>
              <p className="text-slate-600">
                Access hundreds of practice questions across RN, RM, and RPHN
                categories
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Compete & Learn
              </h3>
              <p className="text-slate-600">
                Join the community leaderboard and learn from top performers
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Track Progress
              </h3>
              <p className="text-slate-600">
                Monitor your performance and identify areas for improvement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Excel in Your Professional Exams?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Join thousands of healthcare professionals who trust PREP for their
            exam preparation
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Start Practicing Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
