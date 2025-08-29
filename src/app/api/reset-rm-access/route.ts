// API to reset and re-grant RM access for a specific user
import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

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

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "userId and userEmail are required" },
        { status: 400 }
      );
    }

    console.log("🔄 Resetting RM access for user:", userId, userEmail);

    // If force is true, delete existing access first
    if (force) {
      try {
        await deleteDoc(doc(db, "rmUserAccess", userId));
        console.log("🗑️ Deleted existing RM access document");
      } catch (error) {
        console.log("⚠️ No existing RM access document to delete or error:", error);
      }
    }

    // Grant fresh RM access
    await rmUserAccessManager.grantRMAccessViaPayment(
      userId,
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
    const hasAccess = await rmUserAccessManager.hasRMAccess(userId);
    const accessData = await rmUserAccessManager.getRMUserAccess(userId);

    return NextResponse.json({
      success: true,
      message: force ? "RM access reset and granted successfully" : "RM access granted successfully",
      userId,
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
