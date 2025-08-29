// src/app/rm/payment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { standaloneRMExamManager, StandaloneRMExam } from "../../../lib/standaloneRMExams";
import { flutterwaveService } from "../../../lib/flutterwave";
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Target, 
  Shield,
  AlertCircle,
  Loader2
} from "lucide-react";

const RMPaymentPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<StandaloneRMExam | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing' | 'verifying' | 'complete'>('ready');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && examId) {
        await fetchExamData(examId);
      } else if (!examId) {
        router.push("/rm");
      } else {
        router.push("/auth/login");
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId, router]);

  const fetchExamData = async (examId: string) => {
    try {
      const examData = await standaloneRMExamManager.getRMExamById(examId);
      if (!examData) {
        setError("Exam not found");
        return;
      }
      
      setExam(examData);
      
      // Check if user already has access
      if (user) {
        const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
        const hasAccess = await rmUserAccessManager.hasRMAccess(user.uid);
        if (hasAccess) {
          router.push(`/rm/${examId}`);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching exam data:", error);
      setError("Failed to load exam details");
    }
  };

  const refreshAccess = async () => {
    if (!user || !examId) return;
    
    try {
      setCheckingAccess(true);
      setError(null);
      const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
      const hasAccess = await rmUserAccessManager.hasRMAccess(user.uid);
      if (hasAccess) {
        console.log("✅ RM access confirmed, redirecting to exam...");
        setPaymentStep('complete');
        setTimeout(() => {
          router.push(`/rm/${examId}`);
        }, 1500);
      } else {
        console.log("❌ No RM access found");
        setError("No RM access found. Please complete payment first.");
      }
    } catch (error) {
      console.error("Error checking RM access:", error);
      setError("Failed to check access. Please try again.");
    } finally {
      setCheckingAccess(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !exam) return;

    setPaymentLoading(true);
    setPaymentStep('processing');
    setError(null);

    try {
      // Create payment session
      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: exam.price,
          email: user.email,
          userId: user.uid,
          txRef: `rm-${exam.id}-${user.uid}-${Date.now()}`,
          customerName: user.displayName || user.email,
          planType: "rm_access",
          planName: `RM Exam - ${exam.title}`,
          examCategory: "RM",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create payment session");
      }

      console.log("🎯 Redirecting to payment page...");
      setPaymentStep('verifying');
      
      // Redirect to Flutterwave payment page
      window.location.href = result.data.link;
    } catch (error) {
      console.error("Payment error:", error);
      setError(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setPaymentStep('ready');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Issue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setPaymentStep('ready');
                if (examId) fetchExamData(examId);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={refreshAccess}
              disabled={checkingAccess}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {checkingAccess ? "Checking..." : "Check if Already Paid"}
            </button>
            <button
              onClick={() => router.push("/rm")}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to RM Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">The requested exam could not be found.</p>
          <button
            onClick={() => router.push("/rm")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to RM Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/rm")}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RM Exams
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Exam Access</h1>
          <p className="text-gray-600 mt-2">Get access to take the RM exam</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exam Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{exam.title}</h3>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Paper {exam.paper}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 capitalize">
                    {exam.difficulty} level
                  </span>
                </div>
              </div>

              {exam.description && (
                <p className="text-gray-600">{exam.description}</p>
              )}

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3" />
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">{exam.timeLimit} minutes</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Target className="h-5 w-5 mr-3" />
                  <span className="font-medium">Questions:</span>
                  <span className="ml-2">{exam.totalQuestions} questions</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span className="font-medium">Passing Score:</span>
                  <span className="ml-2">{exam.passingScore}%</span>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3">What's Included:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Access to full exam with {exam.totalQuestions} questions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {exam.timeLimit} minutes exam duration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instant results and detailed explanations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Multiple retakes allowed
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  30 days access from purchase
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Leaderboard ranking
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
            
            {/* Price Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Exam Access</span>
                <span className="text-2xl font-bold text-gray-900">
                  {exam.currency} {exam.price}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                One-time payment for 30 days access
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payment</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment is processed securely through Flutterwave. 
                    We don't store your payment information.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Progress Indicator */}
            {paymentStep !== 'ready' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {paymentStep === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                    {paymentStep === 'verifying' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                    {paymentStep === 'complete' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      {paymentStep === 'processing' && "Setting up your payment..."}
                      {paymentStep === 'verifying' && "Redirecting to secure payment..."}
                      {paymentStep === 'complete' && "Payment successful! Redirecting to exam..."}
                    </p>
                    <p className="text-sm text-blue-600">
                      {paymentStep === 'processing' && "Please wait while we prepare your payment session"}
                      {paymentStep === 'verifying' && "You'll be taken to Flutterwave payment page"}
                      {paymentStep === 'complete' && "You now have access to all RM exams"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={paymentLoading || paymentStep !== 'ready'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {paymentStep === 'processing' ? "Setting up payment..." : "Processing..."}
                </>
              ) : paymentStep === 'complete' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Payment Complete
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {exam.currency} {exam.price}
                </>
              )}
            </button>

            {/* Refresh Access Button */}
            <button
              onClick={refreshAccess}
              disabled={checkingAccess || paymentStep === 'complete'}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
            >
              {checkingAccess ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking access...
                </>
              ) : paymentStep === 'complete' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Access confirmed
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already paid? Check Access
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By clicking "Pay", you agree to our terms of service and privacy policy.
            </p>

            {/* Payment Methods */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Accepted Payment Methods</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit/Debit Cards
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bank Transfer
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Mobile Money
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Digital Wallets
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">How long do I have access after payment?</h4>
              <p className="text-sm text-gray-600 mt-1">
                You get 30 days of access from the time of purchase. You can take the exam multiple times within this period.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I get a refund?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Refunds are available within 24 hours of purchase if you haven't started the exam. Contact support for assistance.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What if I have technical issues during the exam?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Our support team is available 24/7 to help with any technical issues. Your progress is automatically saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RMPaymentPage;
