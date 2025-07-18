// src/app/api/redeem-access-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: "Access code and user ID are required" },
        { status: 400 }
      );
    }

    // Clean the code
    const cleanCode = code.replace(/\s+/g, "").toUpperCase();

    // Get access code from Firestore
    const accessCodeDoc = await getDoc(doc(db, "accessCodes", cleanCode));

    if (!accessCodeDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: "Invalid access code",
      });
    }

    const accessCodeData = accessCodeDoc.data();

    // Validate access code
    if (!accessCodeData.isActive) {
      return NextResponse.json({
        success: false,
        error: "This access code has been deactivated",
      });
    }

    const now = new Date();
    const expiryDate = accessCodeData.expiryDate.toDate();
    if (now > expiryDate) {
      return NextResponse.json({
        success: false,
        error: "This access code has expired",
      });
    }

    if (accessCodeData.currentUses >= accessCodeData.maxUses) {
      return NextResponse.json({
        success: false,
        error: "This access code has been fully used",
      });
    }

    // Check if user already redeemed this code
    const userAccessDoc = await getDoc(doc(db, "userAccess", userId));
    const userAccessData = userAccessDoc.exists()
      ? userAccessDoc.data()
      : { redeemedCodes: [] };

    if (userAccessData.redeemedCodes?.includes(cleanCode)) {
      return NextResponse.json({
        success: false,
        error: "You have already redeemed this access code",
      });
    }

    // Update access code usage
    await updateDoc(doc(db, "accessCodes", cleanCode), {
      currentUses: accessCodeData.currentUses + 1,
      lastUsedAt: new Date(),
      lastUsedBy: userId,
    });

    // Grant user access
    const userAccess = {
      userId,
      examCategory: accessCodeData.examCategory,
      papers: accessCodeData.papers,
      expiryDate: accessCodeData.expiryDate,
      accessGrantedAt: new Date(),
      accessCode: cleanCode,
      redeemedCodes: [...(userAccessData.redeemedCodes || []), cleanCode],
      examAttempts: userAccessData.examAttempts || {},
    };

    await setDoc(doc(db, "userAccess", userId), userAccess);

    return NextResponse.json({
      success: true,
      message: `Access granted for ${
        accessCodeData.examCategory
      } ${accessCodeData.papers.join(" & ")}`,
      accessDetails: {
        examCategory: accessCodeData.examCategory,
        papers: accessCodeData.papers,
        expiryDate: accessCodeData.expiryDate,
      },
    });
  } catch (error) {
    console.error("Error redeeming access code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem access code" },
      { status: 500 }
    );
  }
}
