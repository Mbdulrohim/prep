// API to manually grant RM access for users who paid but didn't get access
import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, transactionId, adminKey } = await request.json();

    // Simple admin verification (you can enhance this)
    if (adminKey !== "fix_rm_access_2025") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Determine the user ID
    let targetUserId = userId;

    // If no userId provided, try to find user by email
    if (!targetUserId) {
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return NextResponse.json(
          { error: "User not found with this email" },
          { status: 404 }
        );
      }

      targetUserId = userSnapshot.docs[0].id;
      console.log("✅ Found user ID:", targetUserId);
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Could not determine user ID" },
        { status: 400 }
      );
    }

    console.log(
      "🔧 Manually granting RM access for user:",
      targetUserId,
      userEmail
    );

    // Check if user already has RM access
    const existingAccess = await rmUserAccessManager.hasRMAccess(targetUserId);
    if (existingAccess) {
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
      targetUserId,
      userEmail,
      paymentInfo
    );

    // Verify the access was granted
    const hasAccess = await rmUserAccessManager.hasRMAccess(targetUserId);
    const accessData = await rmUserAccessManager.getRMUserAccess(targetUserId);

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all transactions for RM that might not have granted access
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("examCategory", "==", "RM")
    );

    const transactionsSnapshot = await getDocs(transactionsQuery);

    const usersWithoutAccess = [];

    for (const transactionDoc of transactionsSnapshot.docs) {
      const transaction = transactionDoc.data();
      const userId = transaction.userId;

      if (userId) {
        const hasAccess = await rmUserAccessManager.hasRMAccess(userId);

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
