// API to manually grant RM access for users who paid but didn't get access
import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, transactionId, adminKey } = await request.json();

    // Simple admin verification (you can enhance this)
    if (adminKey !== "fix_rm_access_2025") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "userId and userEmail are required" },
        { status: 400 }
      );
    }

    console.log("🔧 Manually granting RM access for user:", userId, userEmail);

    // Check if user already has RM access
    const existingAccess = await rmUserAccessManager.hasRMAccess(userId);
    if (existingAccess) {
      return NextResponse.json({
        success: true,
        message: "User already has RM access",
        userId,
        hasAccess: true,
      });
    }

    // Look for any transaction evidence for this user
    let paymentInfo = {
      amount: 2000, // Default RM amount
      currency: "NGN",
      paymentMethod: "flutterwave" as const,
      transactionId: transactionId || `manual_fix_${Date.now()}`,
      paymentDate: new Date(),
      paymentStatus: "completed" as const,
    };

    // Try to find actual transaction data
    if (transactionId) {
      try {
        const transactionRef = doc(db, "transactions", transactionId);
        const transactionDoc = await getDoc(transactionRef);
        
        if (transactionDoc.exists()) {
          const txData = transactionDoc.data();
          paymentInfo = {
            amount: txData.amount || 2000,
            currency: txData.currency || "NGN",
            paymentMethod: "flutterwave",
            transactionId: transactionId,
            paymentDate: txData.processedAt?.toDate() || new Date(),
            paymentStatus: "completed",
          };
          console.log("📄 Found transaction data:", paymentInfo);
        }
      } catch (error) {
        console.log("⚠️ Could not find transaction data, using defaults");
      }
    }

    // Grant RM access using the proper method
    await rmUserAccessManager.grantRMAccessViaPayment(
      userId,
      userEmail,
      paymentInfo
    );

    // Verify the access was granted
    const hasAccess = await rmUserAccessManager.hasRMAccess(userId);
    const accessData = await rmUserAccessManager.getRMUserAccess(userId);

    return NextResponse.json({
      success: true,
      message: "RM access granted successfully",
      userId,
      userEmail,
      hasAccess,
      accessData,
      paymentInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error manually granting RM access:", error);
    return NextResponse.json(
      {
        error: "Failed to grant RM access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET method to find users who might need manual fixes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    
    if (adminKey !== "fix_rm_access_2025") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔍 Looking for RM transactions without access...");

    // Find RM transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("examCategory", "==", "RM")
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const usersNeedingFix = [];

    for (const doc of transactionsSnapshot.docs) {
      const txData = doc.data();
      const userId = txData.userId;
      
      if (userId) {
        // Check if they have RM access
        const hasAccess = await rmUserAccessManager.hasRMAccess(userId);
        
        if (!hasAccess) {
          usersNeedingFix.push({
            userId,
            userEmail: txData.customerEmail,
            transactionId: doc.id,
            amount: txData.amount,
            processedAt: txData.processedAt?.toDate(),
            status: txData.status,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      usersNeedingFix,
      count: usersNeedingFix.length,
      message: `Found ${usersNeedingFix.length} users who paid for RM but don't have access`,
    });

  } catch (error) {
    console.error("❌ Error finding users needing RM access fix:", error);
    return NextResponse.json(
      {
        error: "Failed to find users needing fix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
