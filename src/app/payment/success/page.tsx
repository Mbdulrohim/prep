"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { flutterwaveService } from "@/lib/flutterwave";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Loader, Home, BookOpen } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get("transaction_id");
        const txRef = searchParams.get("tx_ref");
        const status = searchParams.get("status");

        if (!transactionId || !txRef) {
          setStatus("failed");
          setMessage("Missing transaction details");
          return;
        }

        if (status === "cancelled") {
          setStatus("failed");
          setMessage("Payment was cancelled");
          return;
        }

        console.log("Verifying payment with details:", {
          transactionId,
          txRef,
          userId: user?.uid,
        });

        // Use our backend verification endpoint
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
            txRef,
            userId: user?.uid,
          }),
        });

        const result = await response.json();
        console.log("Verification result:", result);

        if (result.success && result.hasAccess) {
          setStatus("success");
          setMessage(
            "Payment successful! You now have access to all exam materials."
          );
          setTransactionDetails(result.transaction);
        } else if (result.success && !result.hasAccess) {
          setStatus("failed");
          setMessage(
            "Payment was processed but access was not granted. Please contact support."
          );
        } else {
          // Try manual verification as fallback
          console.log("Standard verification failed, trying manual verification...");
          
          const manualResponse = await fetch("/api/manual-verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionId,
              txRef,
              userId: user?.uid,
            }),
          });

          const manualResult = await manualResponse.json();
          console.log("Manual verification result:", manualResult);

          if (manualResult.success && manualResult.hasAccess) {
            setStatus("success");
            setMessage(
              "Payment verified! You now have access to all exam materials."
            );
            setTransactionDetails(manualResult.transaction);
          } else {
            setStatus("failed");
            setMessage(
              result.message ||
                "Payment verification failed. Please contact support if amount was debited."
            );
          }
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(
          "Unable to verify payment. Please contact support if amount was debited."
        );
      }
    };

    if (user?.uid) {
      verifyPayment();
    } else {
      // Wait for user to be loaded
      const timer = setTimeout(() => {
        if (!user?.uid) {
          setStatus("failed");
          setMessage("Please sign in to verify your payment");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, user?.uid]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            {transactionDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Transaction Details
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      {transactionDetails.currency}{" "}
                      {transactionDetails.amount?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-medium font-mono text-xs">
                      {transactionDetails.tx_ref}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">
                      Successful
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Practicing
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Try Again
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
