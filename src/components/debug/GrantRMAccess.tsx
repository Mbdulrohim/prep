// src/components/debug/GrantRMAccess.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { rmUserAccessManager } from "@/lib/rmUserAccess";

export default function GrantRMAccess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleGrantAccess = async () => {
    if (!user) {
      setResult("❌ No user logged in");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      console.log("🔧 Granting RM access for user:", user.uid);

      await rmUserAccessManager.grantRMAccessViaPayment(
        user.uid,
        user.email || "user@example.com",
        {
          amount: 5000,
          currency: "NGN",
          paymentMethod: "manual",
          transactionId: `manual_fix_${Date.now()}`,
          paymentDate: new Date(),
          paymentStatus: "completed",
        }
      );

      setResult("✅ RM access granted successfully!");
      console.log("✅ RM access granted for user:", user.uid);
    } catch (error) {
      console.error("❌ Error granting RM access:", error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAccess = async () => {
    if (!user) {
      setResult("❌ No user logged in");
      return;
    }

    setLoading(true);
    try {
      const access = await rmUserAccessManager.getRMUserAccess(user.uid);
      setResult(`📊 RM Access Status: ${access ? "✅ HAS ACCESS" : "❌ NO ACCESS"}`);
      console.log("📊 RM Access for user:", user.uid, access);
    } catch (error) {
      setResult(`❌ Error checking access: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">Please log in first</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">RM Access Debug Tool</h2>
      
      <div className="mb-4">
        <p><strong>User ID:</strong> {user.uid}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCheckAccess}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? "Checking..." : "Check Access"}
        </button>
        
        <button
          onClick={handleGrantAccess}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? "Granting..." : "Grant Access"}
        </button>
      </div>

      {result && (
        <div className="p-3 bg-gray-100 rounded text-sm">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
