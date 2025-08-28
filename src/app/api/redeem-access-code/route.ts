import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { accessCode, userId, examCategory, userEmail, userName, university } = await request.json();

    if (!accessCode || !userId) {
      return NextResponse.json(
        { success: false, error: "Access code and user ID are required" },
        { status: 400 }
      );
    }

    // Clean the code
    const cleanCode = accessCode.replace(/\s+/g, "").toUpperCase();

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

    // Check if requesting RM access and code is for RM
    if (examCategory === "RM") {
      if (accessCodeData.examCategory !== "RM") {
        return NextResponse.json({
          success: false,
          error: "This access code is not valid for RM exams",
        });
      }

      // Check if user already has RM access
      const { rmUserAccessManager } = await import("@/lib/rmUserAccess");
      const existingAccess = await rmUserAccessManager.getRMUserAccess(userId);
      
      if (existingAccess?.hasAccess) {
        return NextResponse.json({
          success: false,
          error: "You already have RM access",
        });
      }

      // Grant RM access via access code
      await rmUserAccessManager.grantRMAccessViaCode(
        userId,
        userEmail || "",
        {
          code: cleanCode,
          redeemedAt: new Date(),
          codeType: accessCodeData.maxUses > 1 ? "multi_use" : "single_use",
        }
      );

      // Update access code usage
      await updateDoc(doc(db, "accessCodes", cleanCode), {
        currentUses: accessCodeData.currentUses + 1,
        lastUsedAt: new Date(),
        lastUsedBy: userId,
      });

      return NextResponse.json({
        success: true,
        message: "RM access granted successfully!",
        accessDetails: {
          examCategory: "RM",
          papers: ["Paper 1", "Paper 2"],
          expiryDate: accessCodeData.expiryDate,
        },
      });
    }

    // Handle regular RN access code redemption
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
      userEmail: userAccessData.userEmail || userEmail || "",
      userName: userAccessData.userName || userName || "",
      userUniversity: userAccessData.userUniversity || university || "",
      examCategory: accessCodeData.examCategory,
      papers: accessCodeData.papers,
      expiryDate: accessCodeData.expiryDate,
      accessGrantedAt: new Date(),
      accessCode: cleanCode,
      hasAccess: true,
      isActive: true,
      isRestricted: false,
      redeemedCodes: [...(userAccessData.redeemedCodes || []), cleanCode],
      examAttempts: userAccessData.examAttempts || {},
      attemptsMade: userAccessData.attemptsMade || {},
      maxAttempts: 10,
      remainingAttempts: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
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
