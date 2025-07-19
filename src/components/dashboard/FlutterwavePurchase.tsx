"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { flutterwaveService } from "@/lib/flutterwave";
import { Button } from "@/components/ui/Button";
import { CreditCard, Loader } from "lucide-react";

export function FlutterwavePurchase() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examPlan = {
    name: "Complete Exam Access",
    price: 1000,
    description: "Access to all RN exam questions (Paper 1 & Paper 2)",
  };

  const handlePayment = async () => {
    if (!user || !userProfile) {
      setError("Please sign in to continue with payment");
      return;
    }

    if (!userProfile.displayName || !userProfile.university) {
      setError("Please complete your profile setup first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const txRef = flutterwaveService.generateTxRef();

      // Create payment session
      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: examPlan.price,
          email: user.email,
          userId: user.uid,
          txRef,
          customerName: userProfile.displayName,
          planType: "complete_access",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create payment session");
      }

      // Redirect to Flutterwave payment page
      if (result.data?.link) {
        window.location.href = result.data.link;
      } else {
        throw new Error("No payment link received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initialize payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {examPlan.name}
          </h3>
          <p className="text-sm text-gray-600">{examPlan.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            ₦{examPlan.price.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">One-time payment</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Unlimited practice questions for both Paper 1 & Paper 2
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          AI-powered explanations for all questions
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Progress tracking and performance analytics
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Access to leaderboard and university rankings
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Instant access after payment
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Pay with Flutterwave
          </div>
        )}
      </Button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Your payment is processed securely through Flutterwave. You'll get
        instant access to all exam materials after successful payment.
      </p>
    </div>
  );
}
