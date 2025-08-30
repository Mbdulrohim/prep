import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

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

    if (!accessCode || !userId) {
      return NextResponse.json(
        { success: false, error: "Access code and user ID are required" },
        { status: 400 }
      );
    }

    // Clean the code
    const cleanCode = accessCode.replace(/\s+/g, "").toUpperCase();

    console.log(
      `🔑 Attempting to redeem access code: ${cleanCode} for user: ${userId}`
    );

    // Get access code from Firestore using client SDK
    const accessCodeRef = doc(db, "accessCodes", cleanCode);
    const accessCodeDoc = await getDoc(accessCodeRef);

    if (!accessCodeDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: "Invalid access code",
      });
    }

    const accessCodeData = accessCodeDoc.data();

    // Validate access code
    if (!accessCodeData?.isActive) {
      return NextResponse.json({
        success: false,
        error: "This access code has been deactivated",
      });
    }

    const now = new Date();
    const expiryDate = accessCodeData.expiresAt;
    if (expiryDate && now > expiryDate.toDate()) {
      return NextResponse.json({
        success: false,
        error: "This access code has expired",
      });
    }

    if ((accessCodeData.currentUses || 0) >= (accessCodeData.maxUses || 1)) {
      return NextResponse.json({
        success: false,
        error: "This access code has reached its usage limit",
      });
    }

    // Get user data
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const finalUserEmail = userEmail || userData?.email;

    // Handle RM-specific access codes
    if (accessCodeData?.examCategory === "RM") {
      console.log(`🏥 Processing RM access code for user: ${userId}`);

      // Check if user already has RM access
      const rmAccessRef = doc(db, "rmUserAccess", userId);
      const rmAccessDoc = await getDoc(rmAccessRef);

      if (rmAccessDoc.exists() && rmAccessDoc.data()?.hasAccess) {
        return NextResponse.json({
          success: true,
          message: "User already has RM access",
          accessType: "RM",
          alreadyHadAccess: true,
        });
      }

      // Grant RM access
      const rmAccessData = {
        id: userId,
        userId,
        userEmail: finalUserEmail,
        examCategory: "RM",
        hasAccess: true,
        accessMethod: "accessCode",
        accessGrantedAt: new Date(),
        accessCodeInfo: {
          code: cleanCode,
          redeemedAt: new Date(),
          codeType: accessCodeData.codeType || "standard",
        },
        rmAttempts: {},
        adminSettings: {
          maxAttempts: accessCodeData.maxAttempts || 1,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(rmAccessRef, rmAccessData);
      console.log(`✅ RM access granted to user: ${userId}`);
    } else {
      // Handle regular RN access codes
      console.log(`🩺 Processing RN access code for user: ${userId}`);

      const accessData = {
        userId,
        userEmail: finalUserEmail,
        examCategory: accessCodeData.examCategory || "RN",
        hasAccess: true,
        accessMethod: "accessCode",
        accessGrantedAt: new Date(),
        accessCodeInfo: {
          code: cleanCode,
          redeemedAt: new Date(),
          codeType: accessCodeData.codeType || "standard",
        },
        maxAttempts: accessCodeData.maxAttempts || 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "userAccess", userId), accessData);
      console.log(`✅ RN access granted to user: ${userId}`);
    }

    // Update access code usage
    await updateDoc(accessCodeRef, {
      currentUses: (accessCodeData.currentUses || 0) + 1,
      lastUsedAt: new Date(),
    });

    // Add user to code usage tracking
    await setDoc(doc(db, "accessCodes", cleanCode, "users", userId), {
      userId,
      userEmail: finalUserEmail,
      userName: userName || userData?.displayName || "Unknown",
      university: university || userData?.university || "Unknown",
      usedAt: new Date(),
    });

    console.log(
      `✅ Access code ${cleanCode} successfully redeemed by user ${userId}`
    );

    return NextResponse.json({
      success: true,
      message: "Access granted successfully!",
      accessType: accessCodeData?.examCategory || "RN",
      userId,
      redeemedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error redeeming access code:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to redeem access code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
