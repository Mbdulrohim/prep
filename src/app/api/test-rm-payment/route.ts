// API route to test RM payment flow
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { rmUserAccessAdminManager } from "@/lib/rmUserAccessAdmin";

export async function GET(request: NextRequest) {
  console.log('🧪 Testing RM Payment Flow - Real Firebase Test');
  
  // Use the actual user ID you want to test
  const testUserId = 'SSBTIgDhLpSJrFOEeqxyqGRAvrX2';
  const testEmail = 'test@firebase.com';
  
  const results = {
    steps: [] as string[],
    success: false,
    testUserId,
    finalState: {} as any
  };
  
  try {
    results.steps.push('1️⃣ Starting RM Access Test');
    console.log('\n1️⃣ Testing RM Access Creation');
    console.log('Test User ID:', testUserId);
    console.log('Test Email:', testEmail);
    
    // Step 1: Check initial state
    results.steps.push('2️⃣ Checking initial state');
    console.log('\n2️⃣ Checking initial state');
    
    const initialAccess = await rmUserAccessAdminManager.hasRMAccess(testUserId);
    const initialRawAccess = await rmUserAccessAdminManager.getRMUserAccess(testUserId);
    
    console.log('Initial hasRMAccess:', initialAccess);
    console.log('Initial rawAccess:', initialRawAccess);
    
    results.steps.push(`Initial state: hasAccess=${initialAccess}, rawData=${initialRawAccess ? 'exists' : 'null'}`);
    
    // Step 2: Grant access
    results.steps.push('3️⃣ Granting RM access');
    console.log('\n3️⃣ Using rmUserAccessAdminManager.grantRMAccessViaPayment()');
    
    try {
      const grantResult = await rmUserAccessAdminManager.grantRMAccessViaPayment(
        testUserId,
        testEmail,
        {
          amount: 2000,
          currency: "NGN",
          paymentMethod: "flutterwave",
          transactionId: `api_test_${Date.now()}`,
          paymentDate: new Date(),
          paymentStatus: "completed",
        }
      );
      
      if (!grantResult.success) {
        throw new Error(grantResult.error || "Failed to grant access");
      }
      
      console.log('✅ grantRMAccessViaPayment succeeded');
      results.steps.push('✅ grantRMAccessViaPayment succeeded');
    } catch (grantError) {
      console.error('❌ grantRMAccessViaPayment failed:', grantError);
      results.steps.push(`❌ grantRMAccessViaPayment failed: ${grantError instanceof Error ? grantError.message : grantError}`);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to grant RM access',
        results,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
    
    // Step 3: Wait a moment for Firebase to process
    results.steps.push('4️⃣ Waiting for Firebase processing');
    console.log('\n4️⃣ Waiting for Firebase processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Check if access was granted
    results.steps.push('5️⃣ Checking access after grant');
    console.log('\n5️⃣ Testing hasRMAccess()');
    
    const hasAccess = await rmUserAccessAdminManager.hasRMAccess(testUserId);
    console.log('hasRMAccess result:', hasAccess);
    results.steps.push(`hasRMAccess result: ${hasAccess}`);
    
    // Step 5: Get raw data
    results.steps.push('6️⃣ Getting raw access data');
    console.log('\n6️⃣ Getting raw access data');
    
    const rawAccess = await rmUserAccessAdminManager.getRMUserAccess(testUserId);
    console.log('Raw access data:', rawAccess);
    results.steps.push(`Raw access data: ${rawAccess ? 'exists' : 'null'}`);
    
    // Step 6: Direct Firebase check
    results.steps.push('7️⃣ Direct Firebase document check');
    console.log('\n7️⃣ Direct Firebase document check');
    
    try {
      const directDoc = await getDoc(doc(db, "rmUserAccess", testUserId));
      console.log('Direct document exists:', directDoc.exists());
      
      if (directDoc.exists()) {
        const directData = directDoc.data();
        console.log('Direct document data:', directData);
        results.steps.push(`Direct Firebase check: document exists with hasAccess=${directData?.hasAccess}`);
      } else {
        console.log('Direct document does not exist');
        results.steps.push('Direct Firebase check: document does not exist');
      }
    } catch (directError) {
      console.error('Direct Firebase check failed:', directError);
      results.steps.push(`Direct Firebase check failed: ${directError instanceof Error ? directError.message : directError}`);
    }
    
    results.success = hasAccess;
    results.finalState = {
      hasAccess,
      rawAccess,
      testUserId,
    };
    
    return NextResponse.json({
      success: true,
      message: 'RM access test completed',
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.steps.push(`❌ Test failed: ${error instanceof Error ? error.message : error}`);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
