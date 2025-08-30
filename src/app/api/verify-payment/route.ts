import { NextRequest, NextResponse } from "next/server";
import { flutterwaveService } from "@/lib/flutterwave";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { rmAccessService } from "@/lib/services/rmAccessService";

export async function POST(request: NextRequest) {
  try {
    const { transactionId, txRef, userId } = await request.json();

      if (!transactionId || !txRef) {
        return NextResponse.json(
          { error: "Missing transaction details" },
          { status: 400 }
        );
      }

      console.log(`Verifying payment: ${transactionId} for user: ${userId}`);

      // Verify payment with Flutterwave
      const verification = await flutterwaveService.verifyPayment(transactionId);

      if (
        verification.status !== "success" ||
        verification.data.status !== "successful"
      ) {
        console.error("Payment verification failed:", verification);
        return NextResponse.json(
          {
            success: false,
            message: "Payment verification failed",
            details: verification,
          },
          { status: 400 }
        );
      }

      const { customer, amount, currency } = verification.data;
      const metadata = verification.data.meta || {};
      const verifiedUserId = metadata.userId || userId;
      const planType = metadata.planType;
      const examCategory = metadata.examCategory || "RN"; // Default to RN if not specified

      console.log("Payment metadata:", {
        userId: verifiedUserId,
        planType,
        examCategory,
        amount,
        currency,
      }); if (!verifiedUserId) {
        console.error("No userId found in payment metadata");
        return NextResponse.json(
          { error: "No user ID found in payment data" },
          { status: 400 }
        );
      }

            // Handle RM-specific payments using Admin SDK
      if (examCategory === "RM" || planType?.toLowerCase().includes("midwife")) {
        console.log("Processing RM payment with Admin SDK...");
        
        try {
          // Prepare payment info for RM access
          const rmPaymentInfo = {
            userId: verifiedUserId,
            examCategory: "RM",
            amount: verification.data.amount,
            currency: verification.data.currency,
            paymentMethod: "flutterwave",
            transactionId: transactionId,
            status: "completed" as const,
          };

          // Grant RM access using PostgreSQL service
          const rmAccessResult = await rmAccessService.grantAccessViaPayment(
            rmPaymentInfo
          );

          if (rmAccessResult.success) {
            console.log("✅ RM access granted successfully via PostgreSQL");
            
            // Save transaction record
            await setDoc(doc(db, "transactions", txRef), {
              transactionId,
              userId: verifiedUserId,
              amount,
              currency,
              status: "successful",
              examCategory: "RM",
              planType,
              processedAt: new Date(),
              customerEmail: customer.email,
              paymentProvider: "flutterwave",
              transaction: verification.data,
            });

            return NextResponse.json({
              success: true,
              message: "RM payment verified and access granted successfully!",
              examCategory: "RM",
              hasAccess: true,
              transaction: verification.data,
              rmAccess: rmAccessResult,
            });
          } else {
            console.error("❌ Failed to grant RM access:", rmAccessResult.message);
            return NextResponse.json({
              success: false,
              message: `RM access grant failed: ${rmAccessResult.message}`,
              examCategory: "RM",
              hasAccess: false,
            }, { status: 500 });
          }
        } catch (error) {
          console.error("❌ Error granting RM access:", error);
          return NextResponse.json({
            success: false,
            message: "Failed to grant RM access due to server error",
            examCategory: "RM",
            hasAccess: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }, { status: 500 });
        }
      }

      // Check if this payment has already been processed
      const existingTransaction = await getDoc(doc(db, "transactions", txRef));
      if (
        existingTransaction.exists() &&
        existingTransaction.data().status === "successful"
      ) {
        console.log("Payment already processed, checking user access...");

        // Return success but check if user actually has access
        const userAccessDoc = await getDoc(doc(db, "userAccess", verifiedUserId));
        const userDoc = await getDoc(doc(db, "users", verifiedUserId));

        return NextResponse.json({
          success: true,
          message: "Payment already processed",
          examCategory: examCategory,
          hasAccess: userAccessDoc.exists() && userAccessDoc.data()?.isActive,
          hasUserAccess: userDoc.exists() && userDoc.data()?.hasAccess,
          transaction: verification.data,
        });
      }

      // Calculate expiry date (90 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      // Grant user access
      const accessRef = doc(db, "userAccess", verifiedUserId);
      const accessData = {
        userId: verifiedUserId,
        planType,
        isActive: true,
        hasAccess: true,
        isRestricted: false,
        purchaseDate: new Date(),
        expiryDate,
        maxAttempts: 6, // 3 mock exams (Paper 1 & Paper 2)
        remainingAttempts: 6,
        paymentReference: txRef,
        paymentProvider: "flutterwave",
        amount: verification.data.amount,
        currency,
        customerEmail: customer.email,
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
      const userRef = doc(db, "users", verifiedUserId);
      await updateDoc(userRef, {
        hasAccess: true,
        isActive: true,
        lastPaymentDate: new Date(),
        paymentProvider: "flutterwave",
        planType: "premium_access",
        updatedAt: new Date(),
      });

      // Log the successful transaction
      const transactionRef = doc(db, "transactions", txRef);
      await setDoc(transactionRef, {
        userId: verifiedUserId,
        transactionId: transactionId,
        txRef: txRef,
        amount: verification.data.amount,
        currency,
        status: "successful",
        paymentProvider: "flutterwave",
        customerEmail: customer.email,
        planType,
        metadata,
        processedAt: new Date(),
        createdAt: new Date(),
      });

      console.log(
        `Payment verified and access granted for user ${verifiedUserId}`
      );

      return NextResponse.json({
        success: true,
        message: "Payment verified and access granted successfully",
        examCategory: examCategory,
        hasAccess: true,
        transaction: verification.data,
        accessData: {
          expiryDate: expiryDate.toISOString(),
          remainingAttempts: 6,
          planType,
        },
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      return NextResponse.json(
        {
          error: "Payment verification failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
