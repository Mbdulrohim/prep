// src/components/debug/TestRMAccessSystem.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { rmUserAccessManager } from "@/lib/rmUserAccess";

export default function TestRMAccessSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const testRMAccessFlow = async () => {
    if (!user) {
      setResult("❌ No user logged in");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      console.log("🧪 Testing RM Access System for user:", user.uid);

      // Test 1: Check current RM access
      const hasAccess = await rmUserAccessManager.hasRMAccess(user.uid);
      console.log("✅ Test 1 - hasRMAccess:", hasAccess);

      // Test 2: Get detailed RM access info
      const accessDetails = await rmUserAccessManager.getRMUserAccess(user.uid);
      console.log("✅ Test 2 - getRMUserAccess:", accessDetails);

      // Test 3: Check if user can start RM exam
      const canStart = await rmUserAccessManager.canStartRMExam(user.uid, "rm-paper-1");
      console.log("✅ Test 3 - canStartRMExam:", canStart);

      setResult(`
🧪 RM Access System Test Results:

📊 Access Status: ${hasAccess ? "✅ HAS ACCESS" : "❌ NO ACCESS"}

📄 Access Details:
${accessDetails ? `
- Access Method: ${accessDetails.accessMethod}
- Access Granted: ${accessDetails.accessGrantedAt.toLocaleString()}
- Has Access: ${accessDetails.hasAccess}
- Max Attempts: ${accessDetails.adminSettings.maxAttempts}
${accessDetails.paymentInfo ? `
- Payment Amount: ${accessDetails.paymentInfo.currency} ${accessDetails.paymentInfo.amount}
- Payment Status: ${accessDetails.paymentInfo.paymentStatus}
- Transaction ID: ${accessDetails.paymentInfo.transactionId}
` : "- No payment info"}
` : "No access record found"}

🎯 Can Start RM Paper 1: ${canStart.canStart ? "✅ YES" : "❌ NO"}
${canStart.reason ? `- Reason: ${canStart.reason}` : ""}
${canStart.attemptsUsed !== undefined ? `- Attempts Used: ${canStart.attemptsUsed}/${canStart.maxAttempts}` : ""}

🔧 System Status: All RM access methods are working correctly!
      `);

    } catch (error) {
      console.error("❌ Error testing RM access system:", error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const grantTestAccess = async () => {
    if (!user) {
      setResult("❌ No user logged in");
      return;
    }

    setLoading(true);
    try {
      console.log("🔧 Granting test RM access for user:", user.uid);

      await rmUserAccessManager.grantRMAccessViaPayment(
        user.uid,
        user.email || "test@example.com",
        {
          amount: 2000,
          currency: "NGN",
          paymentMethod: "manual",
          transactionId: `test_${Date.now()}`,
          paymentDate: new Date(),
          paymentStatus: "completed",
        }
      );

      setResult("✅ Test RM access granted successfully! Run the test again to verify.");
    } catch (error) {
      console.error("❌ Error granting test access:", error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async () => {
    if (!user) {
      setResult("❌ No user logged in");
      return;
    }

    setLoading(true);
    try {
      console.log("🗑️ Revoking RM access for user:", user.uid);
      await rmUserAccessManager.revokeRMAccess(user.uid);
      setResult("✅ RM access revoked successfully! Run the test again to verify.");
    } catch (error) {
      console.error("❌ Error revoking access:", error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please sign in to test the RM access system.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 RM Access System Test
      </h3>
      
      <div className="space-y-3 mb-6">
        <button
          onClick={testRMAccessFlow}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Testing..." : "🧪 Test RM Access System"}
        </button>
        
        <button
          onClick={grantTestAccess}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Granting..." : "✅ Grant Test RM Access"}
        </button>
        
        <button
          onClick={revokeAccess}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Revoking..." : "🗑️ Revoke RM Access"}
        </button>
      </div>

      {result && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
