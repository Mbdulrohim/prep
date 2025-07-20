// src/app/api/refresh-user-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user access data
    const userAccessDoc = await getDoc(doc(db, "userAccess", userId));
    const userDoc = await getDoc(doc(db, "users", userId));

    const hasUserAccess = userAccessDoc.exists() && userAccessDoc.data()?.isActive;
    const hasUserFlag = userDoc.exists() && userDoc.data()?.hasAccess;

    let userAccessData = null;
    if (userAccessDoc.exists()) {
      const data = userAccessDoc.data();
      userAccessData = {
        isActive: data.isActive,
        hasAccess: data.hasAccess,
        isRestricted: data.isRestricted,
        expiryDate: data.expiryDate?.toDate?.() || data.expiryDate,
        remainingAttempts: data.remainingAttempts,
        planType: data.planType,
        paymentProvider: data.paymentProvider,
      };
    }

    let userData = null;
    if (userDoc.exists()) {
      const data = userDoc.data();
      userData = {
        hasAccess: data.hasAccess,
        isActive: data.isActive,
        planType: data.planType,
        lastPaymentDate: data.lastPaymentDate?.toDate?.() || data.lastPaymentDate,
      };
    }

    return NextResponse.json({
      success: true,
      hasAccess: hasUserAccess && hasUserFlag,
      userAccess: userAccessData,
      user: userData,
      debug: {
        userAccessExists: userAccessDoc.exists(),
        userExists: userDoc.exists(),
        userAccessActive: hasUserAccess,
        userHasAccess: hasUserFlag,
      }
    });

  } catch (error) {
    console.error("Error refreshing user access:", error);
    return NextResponse.json(
      { 
        error: "Failed to refresh user access",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
