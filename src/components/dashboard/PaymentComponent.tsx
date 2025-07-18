"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { PaystackPurchase } from "./PaystackPurchase";
import { CodeRedemptionForm } from "./CodeRedemptionForm";
import { CreditCard, Gift, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface PaymentComponentProps {
  onAccessGranted: (accessDetails: any) => void;
}

export function PaymentComponent({ onAccessGranted }: PaymentComponentProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"purchase" | "redeem">("purchase");

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sign In Required
        </h3>
        <p className="text-gray-600">
          Please sign in to access payment options
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab("purchase")}
            className={`
              flex-1 py-4 px-6 text-center font-medium transition-colors
              ${
                activeTab === "purchase"
                  ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Pay with Paystack</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("redeem")}
            className={`
              flex-1 py-4 px-6 text-center font-medium transition-colors
              ${
                activeTab === "redeem"
                  ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-5 h-5" />
              <span>Redeem Code</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "purchase" && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pay ₦1,000 with Paystack
              </h3>
              <p className="text-gray-600">
                Secure payment via Paystack - covers both Paper 1 & Paper 2 for
                any exam category
              </p>
            </div>
            <PaystackPurchase />
          </div>
        )}

        {activeTab === "redeem" && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Redeem Access Code
              </h3>
              <p className="text-gray-600">
                Have an access code? Enter it below to unlock your exam access
              </p>
            </div>
            <CodeRedemptionForm onSuccess={() => onAccessGranted({})} />
          </div>
        )}
      </div>
    </div>
  );
}
