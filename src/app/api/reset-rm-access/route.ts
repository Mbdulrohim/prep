// API to reset and re-grant RM access for a specific user
import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessAdminManager } from "@/lib/rmUserAccessAdmin";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, adminKey, force } = await request.json();

    // Simple admin verification
    if (adminKey !== "fix_rm_access_2025") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required" },
        { status: 400 }
      );
    }

    // Find user by email if userId not provided
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      console.log("🔍 Finding user by email:", userEmail);
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", userEmail));
      const userDocs = await getDocs(userQuery);
      
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

    console.log("🔄 Resetting RM access for user:", targetUserId, userEmail);

    // If force is true, delete existing access first
    if (force) {
      try {
        await deleteDoc(doc(db, "rmUserAccess", targetUserId));
        console.log("🗑️ Deleted existing RM access document");
      } catch (error) {
        console.log("⚠️ No existing RM access document to delete or error:", error);
      }
    }

    // Grant fresh RM access
    await rmUserAccessAdminManager.grantRMAccessViaPayment(
      targetUserId,
      userEmail,
      {
        amount: 2000,
        currency: "NGN",
        paymentMethod: "flutterwave",
        transactionId: `manual_reset_${Date.now()}`,
        paymentDate: new Date(),
        paymentStatus: "completed",
      }
    );

    // Verify the access was granted
    const hasAccess = await rmUserAccessAdminManager.hasRMAccess(targetUserId);
    const accessData = await rmUserAccessAdminManager.getRMUserAccess(targetUserId);

    return NextResponse.json({
      success: true,
      message: force ? "RM access reset and granted successfully" : "RM access granted successfully",
      userId: targetUserId,
      userEmail,
      hasAccess,
      accessData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error resetting RM access:", error);
    return NextResponse.json(
      {
        error: "Failed to reset RM access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
