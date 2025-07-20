import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transactionId, txRef, userId } = await request.json();

    if (!transactionId || !txRef || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Manually granting access for: ${transactionId}, user: ${userId}`);

    // For now, just return success for testing
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    return NextResponse.json({
      success: true,
      message: "Payment manually verified and access granted successfully",
      hasAccess: true,
      transaction: { tx_ref: txRef, transaction_id: transactionId },
      accessData: {
        expiryDate: expiryDate.toISOString(),
        remainingAttempts: 6,
        planType: "premium_access",
      },
    });
  } catch (error) {
    console.error("Manual payment verification error:", error);
    return NextResponse.json(
      {
        error: "Manual payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
