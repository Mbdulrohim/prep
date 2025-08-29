"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { flutterwaveService } from "@/lib/flutterwave";
import { Button } from "@/components/ui/Button";
import { CreditCard, Loader, Crown, CheckCircle, AlertCircle } from "lucide-react";

export function RMPurchase() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing' | 'redirecting'>('ready');

  const rmPlan = {
    name: "RM Exam Access Package",
    price: 2000, // ₦2,000 for RM exams
    description: "Complete access to all RM exam materials (Paper 1 & Paper 2)",
    features: [
      "RM Paper 1 - Antenatal, Labor, Postnatal & Newborn Care",
      "RM Paper 2 - High-Risk Pregnancies & Emergency Procedures", 
      "2,000+ RM-specific practice questions",
      "AI-powered explanations for midwifery topics",
      "Progress tracking and performance analytics",
      "Unlimited exam attempts",
      "90 days access",
      "Priority support for RM students"
    ]
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
    setPaymentStep('processing');
    setError(null);

    try {
      const txRef = flutterwaveService.generateTxRef();

      // Create RM payment session
      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: rmPlan.price,
          email: user.email,
          userId: user.uid,
          txRef,
          customerName: userProfile.displayName,
          planType: "rm_access", // RM-specific plan type
          planName: rmPlan.name,
          examCategory: "RM", // Important for RM access
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create RM payment session");
      }

      setPaymentStep('redirecting');
      
      // Redirect to Flutterwave payment page
      if (result.data?.link) {
        window.location.href = result.data.link;
      } else {
        throw new Error("No payment link received");
      }
    } catch (error) {
      console.error("RM Payment error:", error);
      setPaymentStep('ready');
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initialize RM payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-green-600" />
          <h3 className="text-2xl font-bold text-gray-900">{rmPlan.name}</h3>
        </div>
        <div className="text-4xl font-bold text-green-600 mb-2">
          ₦{rmPlan.price.toLocaleString()}
        </div>
        <p className="text-gray-600">{rmPlan.description}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-3 mb-8">
        {rmPlan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      {/* Payment Status */}
      {paymentStep !== 'ready' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {paymentStep === 'processing' && "Setting up your payment..."}
                {paymentStep === 'redirecting' && "Redirecting to secure payment..."}
              </p>
              <p className="text-sm text-blue-600">
                {paymentStep === 'processing' && "Please wait while we prepare your payment session"}
                {paymentStep === 'redirecting' && "You'll be taken to Flutterwave payment page"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isLoading || paymentStep !== 'ready'}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            {paymentStep === 'processing' ? "Setting up payment..." : 
             paymentStep === 'redirecting' ? "Redirecting..." : "Processing..."}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pay ₦{rmPlan.price.toLocaleString()} for RM Access
          </div>
        )}
      </Button>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 text-sm font-medium">Secure Payment</p>
            <p className="text-green-700 text-sm mt-1">
              Your payment is processed securely through Flutterwave. You'll get
              instant access to all RM exam materials after successful payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
