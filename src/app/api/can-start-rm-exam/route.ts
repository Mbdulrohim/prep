import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";

export async function POST(request: NextRequest) {
  try {
    const { userId, examId } = await request.json();

    if (!userId || !examId) {
      return NextResponse.json(
        { error: "User ID and Exam ID are required" },
        { status: 400 }
      );
    }

    const result = await rmUserAccessManager.canStartRMExam(userId, examId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking if user can start RM exam:", error);
    return NextResponse.json(
      {
        error: "Failed to check exam eligibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
