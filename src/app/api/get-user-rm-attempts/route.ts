import { NextRequest, NextResponse } from "next/server";
import { rmExamAttemptManager } from "@/lib/rmExamAttempts";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const attempts = await rmExamAttemptManager.getUserRMExamAttempts(userId);

    return NextResponse.json({
      success: true,
      attempts,
    });
  } catch (error) {
    console.error("Error getting user RM exam attempts:", error);
    return NextResponse.json(
      {
        error: "Failed to get exam attempts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
