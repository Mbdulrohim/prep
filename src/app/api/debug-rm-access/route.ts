// Debug API to check RM access
import { NextRequest, NextResponse } from "next/server";
import { rmUserAccessManager } from "@/lib/rmUserAccess";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Debug: Checking RM access for user:", userId);

    // Check access using the manager
    const hasAccess = await rmUserAccessManager.hasRMAccess(userId);
    
    // Get raw access data for debugging
    const rawAccess = await rmUserAccessManager.getRMUserAccess(userId);

    return NextResponse.json({
      userId,
      hasAccess,
      rawAccessData: rawAccess,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Debug RM access error:", error);
    return NextResponse.json(
      {
        error: "Failed to check RM access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
