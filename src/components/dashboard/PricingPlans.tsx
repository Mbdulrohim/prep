"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PRICING_PLANS, formatPriceWithDiscount } from "@/lib/pricing";
import { flutterwaveService } from "@/lib/flutterwave";
import { Button } from "@/components/ui/Button";
import { 
  CreditCard, 
  CheckCircle, 
  Trophy, 
  BookOpen, 
  Clock,
  Loader,
  Zap,
  Target,
  Award,
  Brain
} from "lucide-react";

export function PricingPlans() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!user || !userProfile) {
      setError("Please sign in to continue");
      return;
    }

    const plan = PRICING_PLANS[0]; // Single plan
    if (!plan) return;

    setIsLoading(true);
    setError(null);

    try {
      const txRef = flutterwaveService.generateTxRef();

      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price,
          email: user.email,
          userId: user.uid,
          txRef,
          customerName: userProfile.displayName,
          planType: plan.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.data?.link) {
        window.location.href = result.data.link;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const plan = PRICING_PLANS[0];
  const priceInfo = formatPriceWithDiscount();

  if (!plan) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Pricing information not available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Get Premium Access
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Master your nursing exams with our comprehensive preparation platform. 
          Limited time offer - save 66% on your exam preparation!
        </p>
      </div>

      {/* Main Pricing Card */}
      <div className="max-w-md mx-auto">
        <div className="relative bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-b-lg text-sm font-semibold">
              🔥 LIMITED TIME OFFER
            </div>
          </div>

          <div className="p-8 pt-16">
            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl text-gray-400 line-through mr-3">
                  {priceInfo.originalFormatted}
                </span>
                <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                  -{priceInfo.discountPercent}% OFF
                </div>
              </div>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {priceInfo.discountedFormatted}
              </div>
              <p className="text-green-600 font-semibold">
                You save {priceInfo.savingsFormatted}!
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">3 Complete Mock Exams</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Access to all RN, RM & RPHN questions</span>
              </div>
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">AI-powered explanations & hints</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">University leaderboards</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Exam readiness assessment</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Unlimited practice sessions</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Retake exams capability</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Purchase Button */}
            <Button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Get Premium Access Now
                </div>
              )}
            </Button>

            {/* Trust Indicators */}
            <div className="mt-6 text-center space-y-2">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Secure payment with Flutterwave
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                Instant access after payment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-xl">
          <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">3 Mock Exams</h3>
          <p className="text-gray-600 text-sm">
            Complete Paper 1 & Paper 2 practice exams to assess your readiness
          </p>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-xl">
          <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">AI Assistance</h3>
          <p className="text-gray-600 text-sm">
            Get intelligent explanations and hints powered by advanced AI
          </p>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-xl">
          <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
          <p className="text-gray-600 text-sm">
            Monitor your performance and compete on university leaderboards
          </p>
        </div>
      </div>
    </div>
  );
}
