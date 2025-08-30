"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Lock, CheckCircle, AlertCircle, Crown, Loader } from "lucide-react";

interface RMCodeRedemptionProps {
  onSuccess?: () => void;
}

export function RMCodeRedemption({ onSuccess }: RMCodeRedemptionProps) {
  const { user, userProfile } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleCodeRedemption = async () => {
    if (!user || !userProfile) {
      setError("Please sign in to redeem access code");
      return;
    }

    if (!accessCode.trim()) {
      setError("Please enter an access code");
      return;
    }

    setIsRedeeming(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/redeem-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          userId: user.uid,
          examCategory: "RM", // RM-specific redemption
          userEmail: user.email,
          userName: userProfile.displayName,
          university: userProfile.university,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to redeem access code");
      }

      setSuccess("RM access code redeemed successfully! You now have access to all RM exams.");
      setAccessCode("");
      
      // Call the success callback to refresh the parent component immediately
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500); // Small delay to ensure the success message is visible
      }

    } catch (error) {
      console.error("Code redemption error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to redeem access code. Please try again."
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-green-600" />
          <h3 className="text-2xl font-bold text-gray-900">RM Access Code</h3>
        </div>
        <p className="text-gray-600">
          Have an RM access code? Enter it below to unlock all RM exam materials.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Access Code Input */}
      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="rmAccessCode" className="block text-sm font-medium text-gray-700 mb-2">
            RM Access Code
          </label>
          <input
            id="rmAccessCode"
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Enter your RM access code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-wider"
            maxLength={20}
            disabled={isRedeeming}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Access codes are case-insensitive</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Valid for all RM exam materials (Paper 1 & Paper 2)</span>
          </div>
        </div>
      </div>

      {/* Redemption Button */}
      <Button
        onClick={handleCodeRedemption}
        disabled={isRedeeming || !accessCode.trim()}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRedeeming ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            Redeeming Code...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Redeem RM Access Code
          </div>
        )}
      </Button>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 text-sm font-medium">Need an Access Code?</p>
            <p className="text-blue-700 text-sm mt-1">
              Contact your institution or purchase RM access directly using the payment option above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
