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
            result.examCategory === "RM" 
              ? "Payment successful! You now have access to all RM exam materials."
              : "Payment successful! You now have access to all exam materials."
          );
          setTransactionDetails(result.transaction);
          
          // Trigger access refresh for RM payments
          if (result.examCategory === "RM") {
            localStorage.setItem('rm_payment_success', Date.now().toString());
            console.log("🎉 RM payment success - triggering access refresh");
          }
        } else if (result.success && !result.hasAccess) {
          setStatus("failed");
          setMessage(
            "Payment was processed but access was not granted. Please contact support."
          );
        } else {
          // Try manual verification as fallback
          console.log(
            "Standard verification failed, trying manual verification..."
          );

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
              manualResult.examCategory === "RM" 
                ? "Payment verified! You now have access to all RM exam materials."
                : "Payment verified! You now have access to all exam materials."
            );
            setTransactionDetails(manualResult.transaction);
            
            // Trigger access refresh for RM payments
            if (manualResult.examCategory === "RM") {
              localStorage.setItem('rm_payment_success', Date.now().toString());
              console.log("🎉 RM payment success (manual verification) - triggering access refresh");
            }
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
              {/* Check if this is RM payment and show WhatsApp join button */}
              {transactionDetails?.examCategory === "RM" && (
                <a
                  href="https://chat.whatsapp.com/BRzLmPSb1a07fPLLZbf6Ws"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515" />
                    </svg>
                    Join RM WhatsApp Group
                  </Button>
                </a>
              )}

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
