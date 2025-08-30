import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/databaseClean";
import { RMExamAttempt } from "@/lib/entities/RMExamAttempt";

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

    const rmExamAttemptRepo = await getRepository(RMExamAttempt);
    
    const attempts = await rmExamAttemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

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
