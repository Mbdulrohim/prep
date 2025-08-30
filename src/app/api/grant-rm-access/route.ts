// API to manually grant RM access for users who paid but didn't get access
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Check if admin SDK is properly initialized
    if (!adminDb || typeof adminDb.collection !== 'function') {
      return NextResponse.json(
        { error: "Firebase Admin SDK not properly initialized" },
        { status: 500 }
      );
    }

    // Determine the user ID
    let targetUserId = userId;
    
    // If no userId provided, try to find user by email
    if (!targetUserId) {
      const usersRef = adminDb.collection("users");
      const userQuery = usersRef.where("email", "==", userEmail);
      const userDocs = await userQuery.get();
      
      if (userDocs.empty) {
        return NextResponse.json(
          { error: "User not found with this email" },
          { status: 404 }
        );
      }
      
      targetUserId = userDocs.docs[0].id;
      console.log("✅ Found user ID:", targetUserId);
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Could not determine user ID" },
        { status: 400 }
      );
    }

    console.log("🔧 Manually granting RM access for user:", targetUserId, userEmail);

    // Check if user already has RM access
    const existingAccessDoc = await adminDb.collection("rmUserAccess").doc(targetUserId).get();
    if (existingAccessDoc.exists && existingAccessDoc.data()?.hasAccess) {
      return NextResponse.json({
        success: true,
        message: "User already has RM access",
        userId: targetUserId,
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
        const transactionDoc = await adminDb.collection("transactions").doc(transactionId).get();
        
        if (transactionDoc.exists) {
          const txData = transactionDoc.data();
          paymentInfo = {
            amount: txData?.amount || 2000,
            currency: txData?.currency || "NGN",
            paymentMethod: "flutterwave",
            transactionId: transactionId,
            paymentDate: txData?.processedAt?.toDate() || new Date(),
            paymentStatus: "completed",
          };
          console.log("📄 Found transaction data:", paymentInfo);
        }
      } catch (error) {
        console.log("⚠️ Could not find transaction data, using defaults");
      }
    }

    // Grant RM access directly using admin SDK
    const accessData = {
      id: targetUserId,
      userId: targetUserId,
      userEmail,
      examCategory: "RM" as const,
      hasAccess: true,
      accessMethod: "admin_grant" as const,
      accessGrantedAt: new Date(),
      paymentInfo,
      rmAttempts: {},
      adminSettings: {
        maxAttempts: 1,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("rmUserAccess").doc(targetUserId).set(accessData);

    // Verify the access was granted
    const verificationDoc = await adminDb.collection("rmUserAccess").doc(targetUserId).get();
    const hasAccess = verificationDoc.exists && verificationDoc.data()?.hasAccess;

    return NextResponse.json({
      success: true,
      message: "RM access granted successfully",
      userId: targetUserId,
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

// GET endpoint to check RM access status for debugging
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adminKey = url.searchParams.get("adminKey");
    
    if (adminKey !== "fix_rm_access_2025") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all transactions for RM that might not have granted access
    const transactionsQuery = adminDb.collection("transactions")
      .where("examCategory", "==", "RM");
    
    const transactionsSnapshot = await transactionsQuery.get();
    
    const usersWithoutAccess = [];
    
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transaction = transactionDoc.data();
      const userId = transaction.userId;
      
      if (userId) {
        const rmAccessDoc = await adminDb.collection("rmUserAccess").doc(userId).get();
        const hasAccess = rmAccessDoc.exists && rmAccessDoc.data()?.hasAccess;
        
        if (!hasAccess) {
          usersWithoutAccess.push({
            userId,
            userEmail: transaction.userEmail,
            transactionId: transactionDoc.id,
            amount: transaction.amount,
            processedAt: transaction.processedAt?.toDate(),
            status: transaction.status,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      usersWithoutAccess,
      totalCount: usersWithoutAccess.length,
    });

  } catch (error) {
    console.error("Error checking RM access status:", error);
    return NextResponse.json(
      {
        error: "Failed to check RM access status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
