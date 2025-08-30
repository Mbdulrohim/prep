import { NextRequest, NextResponse } from "next/server";
import { rmAccessService } from "@/lib/services/rmAccessService";

export async function POST(request: NextRequest) {
  try {
    const {
      accessCode,
      userId,
      examCategory,
      userEmail,
      userName,
      university,
    } = await request.json();

    if (!accessCode || !userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: "Access code, user ID, and email are required" },
        { status: 400 }
      );
    }

    // Clean the code
    const cleanCode = accessCode.replace(/\s+/g, "").toUpperCase();

    console.log(
      `🔑 Attempting to redeem access code: ${cleanCode} for user: ${userId}`
    );

    // Use our PostgreSQL-based rmAccessService
    const redeemResult = await rmAccessService.redeemAccessCode(
      userId,
      userEmail,
      cleanCode
    );

    if (redeemResult.success) {
      console.log(`✅ Access code redeemed successfully for user: ${userId}`);
      return NextResponse.json({
        success: true,
        message: redeemResult.message,
        accessGranted: redeemResult.accessGranted
      });
    } else {
      console.log(`❌ Failed to redeem access code: ${redeemResult.message}`);
      return NextResponse.json(
        { success: false, error: redeemResult.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("❌ Error redeeming access code:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to redeem access code" 
      },
      { status: 500 }
    );
  }
}
