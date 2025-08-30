import { NextRequest, NextResponse } from "next/server";
import { grantRMAccessViaPaymentDirect } from "@/lib/rmUserAccessDirect";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { transactionId, txRef, userId } = await request.json();

    if (!transactionId || !txRef || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(
      `Manually granting access for: ${transactionId}, user: ${userId}`
    );

    // Check if this is likely an RM payment based on txRef pattern
    const isLikelyRMPayment = txRef.toLowerCase().includes('rm') || 
                             txRef.toLowerCase().includes('midwife') ||
                             txRef.toLowerCase().includes('midwifery');

    // Get user information
    const userDoc = await getDoc(doc(db, "users", userId));
    const userEmail = userDoc.exists() ? userDoc.data()?.email : `user-${userId}@example.com`;

    if (isLikelyRMPayment) {
      // Handle RM payment manually
      console.log("Manually processing RM payment...");
      
      try {
        const rmPaymentInfo = {
          amount: 5000, // Default amount for manual verification
          currency: "NGN",
          paymentMethod: "manual" as const,
          transactionId: transactionId,
          paymentDate: new Date(),
          paymentStatus: "completed" as const,
        };

        const rmAccessResult = await grantRMAccessViaPaymentDirect(
          userEmail,
          rmPaymentInfo
        );

        if (rmAccessResult.success) {
          // Save transaction record
          await setDoc(doc(db, "transactions", txRef), {
            transactionId,
            userId,
            amount: 5000,
            currency: "NGN",
            status: "successful",
            examCategory: "RM",
            planType: "rm_premium",
            processedAt: new Date(),
            customerEmail: userEmail,
            paymentProvider: "manual",
            isManualVerification: true,
          });

          return NextResponse.json({
            success: true,
            message: "RM payment manually verified and access granted successfully",
            examCategory: "RM",
            hasAccess: true,
            transaction: { tx_ref: txRef, transaction_id: transactionId },
            rmAccess: rmAccessResult,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `Manual RM access grant failed: ${rmAccessResult.message}`,
            examCategory: "RM",
            hasAccess: false,
          }, { status: 500 });
        }
      } catch (error) {
        console.error("❌ Error manually granting RM access:", error);
        return NextResponse.json({
          success: false,
          message: "Failed to manually grant RM access",
          examCategory: "RM",
          hasAccess: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
      }
    } else {
      // Handle regular RN payment manually
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      // Grant regular user access
      const accessRef = doc(db, "userAccess", userId);
      const accessData = {
        userId: userId,
        planType: "premium_access",
        isActive: true,
        hasAccess: true,
        isRestricted: false,
        purchaseDate: new Date(),
        expiryDate,
        maxAttempts: 6,
        remainingAttempts: 6,
        paymentReference: txRef,
        paymentProvider: "manual",
        transactionId: transactionId,
        retakeAllowed: true,
        groupLeaderboard: false,
        examTypes: ["RN", "RM", "RPHN"],
        attemptsMade: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(accessRef, accessData, { merge: true });

      // Update user's payment status
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        hasAccess: true,
        isActive: true,
        lastPaymentDate: new Date(),
        paymentProvider: "manual",
        planType: "premium_access",
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment manually verified and access granted successfully",
        examCategory: "RN",
        hasAccess: true,
        transaction: { tx_ref: txRef, transaction_id: transactionId },
        accessData: {
          expiryDate: expiryDate.toISOString(),
          remainingAttempts: 6,
          planType: "premium_access",
        },
      });
    }
  } catch (error) {
    console.error("Manual payment verification error:", error);
    return NextResponse.json(
      {
        error: "Manual payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
