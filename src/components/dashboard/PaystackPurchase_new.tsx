"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { paystackService } from "@/lib/paystack";
import { CreditCard, CheckCircle, AlertCircle, Zap } from "lucide-react";

export function PaystackPurchase() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const examPlan = {
    name: "Full Exam Access",
    price: 1000, // ₦1,000 for all exam access
    features: [
      "Access to all exam categories",
      "Paper 1 & Paper 2 for each exam",
      "10,000+ practice questions",
      "AI-powered explanations",
      "Advanced analytics & progress tracking",
      "Unlimited retakes",
      "90 days access",
      "Priority support",
    ],
    description: "Complete exam preparation package",
  };

  const handlePayment = async () => {
    if (!user || !userProfile) {
      alert("Please complete your profile setup first");
      return;
    }

    setIsLoading(true);

    try {
      const amountInKobo = paystackService.nairaToKobo(examPlan.price);

      // Initialize payment with Paystack
      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          planName: examPlan.name,
          userId: user.uid,
          metadata: {
            userId: user.uid,
            userEmail: user.email,
            userName: userProfile.displayName,
            university: userProfile.university,
            planType: "full_access",
            custom_fields: [
              {
                display_name: "Plan Type",
                variable_name: "plan_type",
                value: "full_access",
              },
              {
                display_name: "University",
                variable_name: "university",
                value: userProfile.university || "Not specified",
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (data.status && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Failed to start payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Plan Display */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Exam Access Plan
        </h3>
        <div className="max-w-md mx-auto">
          <div className="relative bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-lg">
            {/* Plan Header */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900">
                  {examPlan.name}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">{examPlan.description}</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ₦{examPlan.price.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">One-time payment</p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {examPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pay with Paystack
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 text-sm font-medium">Secure Payment</p>
            <p className="text-blue-700 text-sm mt-1">
              Your payment is processed securely through Paystack. You'll get
              instant access after successful payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
