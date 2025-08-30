import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { accessCode, userId, examCategory, userEmail, userName, university } = await request.json();

    if (!accessCode || !userId) {
      return NextResponse.json(
        { success: false, error: "Access code and user ID are required" },
        { status: 400 }
      );
    }

    // Check if admin SDK is properly initialized
    if (!adminDb || typeof adminDb.collection !== 'function') {
      return NextResponse.json(
        { success: false, error: "Firebase Admin SDK not properly initialized" },
        { status: 500 }
      );
    }

    // Clean the code
    const cleanCode = accessCode.replace(/\s+/g, "").toUpperCase();

    // Get access code from Firestore using admin SDK
    const accessCodeDoc = await adminDb.collection("accessCodes").doc(cleanCode).get();

    if (!accessCodeDoc.exists) {
      return NextResponse.json({
        success: false,
        error: "Invalid access code",
      });
    }

    const accessCodeData = accessCodeDoc.data();
    if (!accessCodeData) {
      return NextResponse.json({
        success: false,
        error: "Invalid access code data",
      });
    }

    // Validate access code
    if (!accessCodeData.isActive) {
      return NextResponse.json({
        success: false,
        error: "This access code has been deactivated",
      });
    }

    const now = new Date();
    const expiryDate = accessCodeData.expiresAt?.toDate ? accessCodeData.expiresAt.toDate() : accessCodeData.expiresAt;
    if (!expiryDate || now > expiryDate) {
      return NextResponse.json({
        success: false,
        error: "This access code has expired",
      });
    }

    if ((accessCodeData.currentUses || 0) >= (accessCodeData.maxUses || 1)) {
      return NextResponse.json({
        success: false,
        error: "This access code has been fully used",
      });
    }

    // Check if requesting RM access and code is for RM
    if (examCategory === "RM") {
      if (accessCodeData.examCategory !== "RM") {
        return NextResponse.json({
          success: false,
          error: "This access code is not valid for RM exams",
        });
      }

      // Check if user already has RM access
      const existingAccessDoc = await adminDb.collection("rmUserAccess").doc(userId).get();
      
      if (existingAccessDoc.exists && existingAccessDoc.data()?.hasAccess) {
        return NextResponse.json({
          success: false,
          error: "You already have RM access",
        });
      }

      // Grant RM access via access code using admin SDK
      const rmAccessData = {
        id: userId,
        userId,
        userEmail: userEmail || "",
        examCategory: "RM" as const,
        hasAccess: true,
        accessMethod: "access_code" as const,
        accessGrantedAt: new Date(),
        accessCodeInfo: {
          code: cleanCode,
          redeemedAt: new Date(),
          codeType: (accessCodeData.maxUses || 1) > 1 ? "multi_use" : "single_use",
        },
        rmAttempts: {},
        adminSettings: {
          maxAttempts: 1,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await adminDb.collection("rmUserAccess").doc(userId).set(rmAccessData);

      // Update access code usage
      await adminDb.collection("accessCodes").doc(cleanCode).update({
        currentUses: (accessCodeData.currentUses || 0) + 1,
        lastUsedAt: new Date(),
        lastUsedBy: userId,
      });

      return NextResponse.json({
        success: true,
        message: "RM access granted successfully!",
        accessDetails: {
          examCategory: "RM",
          papers: ["Paper 1", "Paper 2"],
          expiryDate: expiryDate,
        },
      });
    }

    // Handle regular RN access code redemption
    // Check if user already redeemed this code
    const userAccessDoc = await adminDb.collection("userAccess").doc(userId).get();
    const userAccessData = userAccessDoc.exists
      ? userAccessDoc.data()
      : { redeemedCodes: [] };

    if (userAccessData?.redeemedCodes?.includes(cleanCode)) {
      return NextResponse.json({
        success: false,
        error: "You have already redeemed this access code",
      });
    }

    // Update access code usage
    await adminDb.collection("accessCodes").doc(cleanCode).update({
      currentUses: (accessCodeData.currentUses || 0) + 1,
      lastUsedAt: new Date(),
      lastUsedBy: userId,
    });

    // Grant user access
    const userAccess = {
      userId,
      userEmail: userAccessData?.userEmail || userEmail || "",
      userName: userAccessData?.userName || userName || "",
      userUniversity: userAccessData?.userUniversity || university || "",
      examCategory: accessCodeData.examCategory,
      papers: accessCodeData.papers,
      expiryDate: expiryDate,
      accessGrantedAt: new Date(),
      accessCode: cleanCode,
      hasAccess: true,
      isActive: true,
      isRestricted: false,
      redeemedCodes: [...(userAccessData?.redeemedCodes || []), cleanCode],
      examAttempts: userAccessData?.examAttempts || {},
      attemptsMade: userAccessData?.attemptsMade || {},
      maxAttempts: 10,
      remainingAttempts: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("userAccess").doc(userId).set(userAccess);

    return NextResponse.json({
      success: true,
      message: `Access granted for ${
        accessCodeData.examCategory
      } ${(accessCodeData.papers || []).join(" & ")}`,
      accessDetails: {
        examCategory: accessCodeData.examCategory,
        papers: accessCodeData.papers,
        expiryDate: expiryDate,
      },
    });
  } catch (error) {
    console.error("Error redeeming access code:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to redeem access code",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
