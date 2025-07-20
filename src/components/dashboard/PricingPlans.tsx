"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PRICING_PLANS, formatPriceWithDiscount } from "@/lib/pricing";
import { flutterwaveService } from "@/lib/flutterwave";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { 
  CreditCard, 
  CheckCircle, 
  Clock,
  Loader,
  Calendar,
  BookOpen,
  Target,
  Users,
  Award
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
        <Alert type="error" message="Pricing information not available" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {plan.name}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Promotion Timer */}
      {priceInfo.isPromotionActive && (
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-semibold">Limited Time Offer!</span>
            </div>
            <p className="text-sm">
              {priceInfo.daysLeft} days left to save ₦{priceInfo.savings?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Main Pricing Card */}
      <div className="max-w-md mx-auto">
        <div className="relative bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-b-lg text-sm font-semibold">
              🔥 66% OFF FOR NEXT {priceInfo.daysLeft} DAYS
            </div>
          </div>

          <div className="p-8 pt-16">
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
            <div className="space-y-3 mb-8">
              {plan.features.map((feature, index) => {
                // Split feature text on ** to make bold parts
                const parts = feature.split('**');
                return (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {parts.map((part, partIndex) => 
                        partIndex % 2 === 1 ? (
                          <strong key={partIndex} className="text-gray-900 font-semibold">{part}</strong>
                        ) : (
                          <span key={partIndex}>{part}</span>
                        )
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4">
                <Alert type="error" message={error} onClose={() => setError(null)} />
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
                  Get Access Now - Save ₦2,000
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

      {/* Key Benefits */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-xl">
          <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">CBT Experience</h3>
          <p className="text-gray-600 text-sm">
            Simulate the real exam environment with our computer-based testing platform
          </p>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-xl">
          <BookOpen className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">NMCN Curriculum</h3>
          <p className="text-gray-600 text-sm">
            Questions drawn exclusively from the current NMCN curriculum
          </p>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-xl">
          <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Exam Readiness</h3>
          <p className="text-gray-600 text-sm">
            Identify strengths and weaknesses to focus your final revision
          </p>
        </div>
      </div>

      {/* Promotion Details */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <div className="flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 mr-3" />
          <h3 className="text-2xl font-bold">Limited Time Offer</h3>
        </div>
        <p className="text-xl mb-2">66% OFF - Save ₦2,000</p>
        <p className="text-blue-100">
          Offer starts August 1st, 2025 and runs for 50 days only!
        </p>
        <div className="mt-4 text-2xl font-bold">
          Only {priceInfo.daysLeft} days remaining
        </div>
      </div>
    </div>
  );
}
