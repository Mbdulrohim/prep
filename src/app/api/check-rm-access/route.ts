import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";

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

    const hasAccess = await rmUserAccessManager.hasRMAccess(userId);
    const accessData = hasAccess
      ? await rmUserAccessManager.getRMUserAccess(userId)
      : null;

    return NextResponse.json({
      hasAccess,
      accessData,
    });
  } catch (error) {
    console.error("Error checking RM access:", error);
    return NextResponse.json(
      {
        error: "Failed to check RM access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
