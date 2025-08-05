"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  BookOpen,
  Users,
  Award,
  CheckCircle,
  LogIn,
  Brain,
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Eye,
  Clock,
  Shield,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, signInWithGoogle, loading } = useAuth();
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

            {/* Sign In Button */}
            <div className="mb-12">
              <Button
                onClick={signInWithGoogle}
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg transition-all transform hover:scale-105"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In with Google to Start
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Weekly Assessment - Hero Feature */}
          <div className="mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl shadow-2xl text-white p-8 lg:p-12 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-3">Weekly Assessment</h2>
                    <p className="text-xl text-purple-100 mb-2">
                      Exclusive Nursing Knowledge Challenge
                    </p>
                    <p className="text-purple-200 text-lg">
                      Test your comprehensive nursing knowledge with our expertly curated questions - included with platform access
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">150</div>
                      <div className="text-purple-200">Comprehensive Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">90</div>
                      <div className="text-purple-200">Minutes Duration</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-2xl p-1 mb-6">
                      <div className="bg-white text-purple-600 rounded-xl px-6 py-3 font-semibold mr-2">
                        🔒 Access Required
                      </div>
                      <div className="px-6 py-3 text-white">
                        Available with dashboard access
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              Professional Exam Categories
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
                      <span className="text-blue-600 font-medium">
                        Paper 1 & Paper 2
                      </span>
                      <span className="text-green-600 font-medium">
                        Available
                      </span>
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
                      <span className="text-gray-500 font-medium">
                        Paper 1 & Paper 2
                      </span>
                      <span className="text-red-500 font-medium">
                        Coming Soon
                      </span>
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
                      <span className="text-gray-500 font-medium">
                        Paper 1 & Paper 2
                      </span>
                      <span className="text-red-500 font-medium">
                        Coming Soon
                      </span>
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

      {/* AI Analysis Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Comprehensive Learning Experience
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Get detailed insights and personalized recommendations with our
              advanced analysis system
            </p>
          </div>

          {/* AI Features Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Side - AI Analysis Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Intelligent Answer Analysis
                  </h3>
                  <p className="text-slate-600">
                    AI analyzes your answers in real-time, providing detailed
                    explanations and identifying knowledge gaps
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Performance Insights
                  </h3>
                  <p className="text-slate-600">
                    Get comprehensive analytics on your strengths, weaknesses,
                    and improvement trends
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Personalized Study Plans
                  </h3>
                  <p className="text-slate-600">
                    AI creates customized study recommendations based on your
                    performance patterns
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Predictive Scoring
                  </h3>
                  <p className="text-slate-600">
                    Advanced algorithms predict your exam readiness and suggest
                    focus areas
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Visual Demo */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800">
                      Live Analysis Demo
                    </h4>
                  </div>

                  {/* Simulated Analysis Cards */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Knowledge Retention
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          87%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: "87%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Answer Accuracy
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          92%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "92%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Weak Areas
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          3 Topics
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Pharmacology, Anatomy, Clinical Skills
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          AI Recommendation
                        </span>
                      </div>
                      <p className="text-xs text-purple-700">
                        Focus on pharmacology calculations. Practice 20 more
                        questions in this area for optimal results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                10,000+ Practice Questions
              </h3>
              <p className="text-slate-600">
                Comprehensive question bank covering RN, RM, and RPHN categories plus weekly assessments
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Weekly Assessments
              </h3>
              <p className="text-slate-600">
                Weekly challenges with detailed explanations and comprehensive reviews
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Community Leaderboard
              </h3>
              <p className="text-slate-600">
                Compete with peers and learn from top performers across Nigeria
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Progress Tracking
              </h3>
              <p className="text-slate-600">
                Monitor your improvement with detailed analytics and performance
                insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              ₦1,000 covers both Paper 1 & Paper 2 for any exam category
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-slate-800">
                  Full Access Plan
                </h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-800">
                  ₦1,000
                </span>
                <span className="text-slate-600 ml-2">one-time payment</span>
              </div>

              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    Both Paper 1 & Paper 2 included
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    Weekly Assessment challenges
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    Detailed answer explanations
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    Multiple practice attempts
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">90 days access</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">
                    Performance insights & analytics
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">Priority support</span>
                </li>
              </ul>

              <Button
                onClick={signInWithGoogle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In to Get Started
                  </div>
                )}
              </Button>
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
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Start Practicing Now
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
