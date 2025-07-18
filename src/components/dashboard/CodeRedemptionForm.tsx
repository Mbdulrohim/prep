"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function CodeRedemptionForm({ onAccessGranted }: { onAccessGranted?: (accessDetails: any) => void }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 5) {
      // Basic validation
      setError("Please enter a valid access code.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    // --- Placeholder Logic ---
    // In the future, this is where we will call a Firebase Cloud Function
    // to securely validate the code and grant access to the exam.
    console.log("Attempting to redeem code:", code);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

    // Simulate success/failure for now
    if (code.toUpperCase() === "RN-TEST-2025") {
      setSuccess(
        "Success! The Registered Nursing exam has been added to your account."
      );
      setCode("");
    } else {
      setError("This access code is invalid or has already been used.");
    }
    // --- End of Placeholder Logic ---

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-grow w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter your unique access code"
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="!w-full sm:!w-auto"
          disabled={isLoading || !code}
        >
          {isLoading ? "Verifying..." : "Redeem Code"}
        </Button>
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-center text-green-600">{success}</p>
      )}
    </form>
  );
}
