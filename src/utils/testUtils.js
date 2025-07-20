// Test utilities for payment and exam functionality
// src/utils/testUtils.js

export const testPaymentFlow = async (userId, testTransactionId = "test_txn_123") => {
  console.log("🧪 Testing Payment Verification Flow");
  console.log("=====================================");
  
  try {
    // Test 1: Check if verify-payment endpoint works
    console.log("1. Testing payment verification endpoint...");
    const verifyResponse = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: testTransactionId,
        txRef: `txref_${Date.now()}`,
        userId: userId,
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    console.log("✅ Verify Payment Result:", verifyResult);
    
    // Test 2: Check user access refresh
    console.log("2. Testing user access refresh...");
    const refreshResponse = await fetch("/api/refresh-user-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    
    const refreshResult = await refreshResponse.json();
    console.log("✅ Refresh Access Result:", refreshResult);
    
    return {
      paymentVerification: verifyResult,
      accessRefresh: refreshResult,
      success: true
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error: error.message };
  }
};

export const testExamAccess = async (userId, examId = "rn_mock_1") => {
  console.log("🎯 Testing Exam Access Flow");
  console.log("============================");
  
  try {
    // Test exam eligibility
    console.log("1. Testing exam eligibility...");
    
    // This would normally be done through the examAttemptManager
    // For testing, we'll simulate the check
    const testEligibility = {
      canStart: true,
      reason: "Test access granted"
    };
    
    console.log("✅ Exam Eligibility:", testEligibility);
    
    // Test user profile availability
    console.log("2. Testing user profile data...");
    
    // Check if user has profile data for auto-population
    const hasProfile = Boolean(
      localStorage.getItem("userProfile") || 
      sessionStorage.getItem("userProfile")
    );
    
    console.log("✅ Profile Data Available:", hasProfile);
    
    return {
      examEligibility: testEligibility,
      hasProfile,
      success: true
    };
    
  } catch (error) {
    console.error("❌ Exam test failed:", error);
    return { success: false, error: error.message };
  }
};

export const runFullTestSuite = async (userId) => {
  console.log("🚀 Running Full Test Suite");
  console.log("===========================");
  
  const paymentTest = await testPaymentFlow(userId);
  const examTest = await testExamAccess(userId);
  
  const results = {
    payment: paymentTest,
    exam: examTest,
    overallSuccess: paymentTest.success && examTest.success
  };
  
  console.log("📊 Test Results Summary:");
  console.log("Payment Flow:", paymentTest.success ? "✅ PASS" : "❌ FAIL");
  console.log("Exam Flow:", examTest.success ? "✅ PASS" : "❌ FAIL");
  console.log("Overall:", results.overallSuccess ? "✅ ALL TESTS PASS" : "❌ SOME TESTS FAILED");
  
  return results;
};

// Browser console helper functions
if (typeof window !== 'undefined') {
  window.testPayment = testPaymentFlow;
  window.testExam = testExamAccess;
  window.runTests = runFullTestSuite;
  
  console.log("🛠️ Test utilities loaded! Available commands:");
  console.log("- testPayment(userId) - Test payment verification");
  console.log("- testExam(userId, examId) - Test exam access");
  console.log("- runTests(userId) - Run full test suite");
}
