"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
// We can use a credit card icon for a payment button
import { CreditCard } from "lucide-react";

export function PaystackPurchase() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = () => {
    setIsLoading(true);
    // --- Frontend-Only Logic ---
    // In a real application, this is where you would call the Paystack API.
    // For now, we'll just simulate the action.
    console.log("Initiating Paystack payment...");
    alert("This will open the Paystack payment modal.");

    // Simulate the payment process finishing after a few seconds
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Button onClick={handlePayment} disabled={isLoading} className="w-full">
      {isLoading ? (
        "Processing..."
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pay with Paystack
        </>
      )}
    </Button>
  );
}
