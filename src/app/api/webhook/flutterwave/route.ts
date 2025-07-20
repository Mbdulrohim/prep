// src/app/api/webhook/flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server";
import { flutterwaveService } from "@/lib/flutterwave";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload
    const body = await request.text();
    const signature = request.headers.get("verif-hash");

    // Verify webhook signature (Flutterwave uses verif-hash header)
    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Flutterwave sends a test webhook during setup
    const secretHash =
      process.env.FLUTTERWAVE_SECRET_HASH || "flw-webhook-secret";

    // For testing, let's temporarily allow webhooks without strict signature verification
    // TODO: Implement proper signature verification in production
    console.log("Webhook signature received:", signature);
    console.log("Expected signature:", secretHash);

    // if (signature !== secretHash) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    // }

    const event = JSON.parse(body);

    // Handle different event types
    if (event.event === "charge.completed") {
      await handleSuccessfulPayment(event.data);
    } else if (event.event === "charge.failed") {
      await handleFailedPayment(event.data);
    } else {
      console.log("Unhandled webhook event:", event.event);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Flutterwave webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    console.log("Processing successful payment:", data);

    // Verify the payment with Flutterwave
    const verification = await flutterwaveService.verifyPayment(data.id);

    if (
      verification.status !== "success" ||
      verification.data.status !== "successful"
    ) {
      console.error("Payment verification failed:", verification);
      return;
    }

    const { tx_ref, customer, amount, currency } = verification.data;
    const metadata = verification.data.meta || {};

    // Extract user information
    const userId = metadata.userId;
    const planType = metadata.planType || "premium_access";

    if (!userId) {
      console.error("No userId found in payment metadata");
      return;
    }

    // Handle individual payment - Premium Access with 3 mock exams
    const accessRef = doc(db, "userAccess", userId);

    // Calculate expiry date (90 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    const accessData = {
      userId,
      planType,
      isActive: true,
      hasAccess: true,
      isRestricted: false,
      purchaseDate: new Date(),
      expiryDate,
      maxAttempts: 6, // 3 mock exams (Paper 1 & Paper 2)
      remainingAttempts: 6,
      paymentReference: tx_ref,
      paymentProvider: "flutterwave",
      amount: verification.data.amount,
      currency,
      customerEmail: customer.email,
      transactionId: data.id,
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
      paymentProvider: "flutterwave",
      planType: "premium_access",
      updatedAt: new Date(),
    });

    // Log the successful transaction
    const transactionRef = doc(db, "transactions", tx_ref);
    await setDoc(transactionRef, {
      userId,
      transactionId: data.id,
      txRef: tx_ref,
      amount: verification.data.amount, // Flutterwave amount is already in base currency
      currency,
      status: "successful",
      paymentProvider: "flutterwave",
      customerEmail: customer.email,
      planType,
      metadata,
      processedAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`Payment processed successfully for user ${userId}`);
  } catch (error) {
    console.error("Error processing successful payment:", error);
  }
}

async function handleFailedPayment(data: any) {
  try {
    console.log("Processing failed payment:", data);

    const { tx_ref, customer } = data;
    const metadata = data.meta || {};
    const userId = metadata.userId;

    if (!userId) {
      console.error("No userId found in failed payment metadata");
      return;
    }

    // Log the failed transaction
    const transactionRef = doc(db, "transactions", tx_ref);
    await setDoc(transactionRef, {
      userId,
      transactionId: data.id,
      txRef: tx_ref,
      amount: data.amount,
      currency: data.currency,
      status: "failed",
      paymentProvider: "flutterwave",
      customerEmail: customer?.email,
      failureReason: data.failure_reason || "Unknown error",
      metadata,
      processedAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`Failed payment logged for user ${userId}`);
  } catch (error) {
    console.error("Error processing failed payment:", error);
  }
}
