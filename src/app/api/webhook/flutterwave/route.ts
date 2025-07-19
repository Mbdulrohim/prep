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
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || "flw-webhook-secret";
    if (signature !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

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
    
    if (verification.status !== "success" || verification.data.status !== "successful") {
      console.error("Payment verification failed:", verification);
      return;
    }

    const { tx_ref, customer, amount, currency } = verification.data;
    const metadata = verification.data.meta || {};

    // Extract user information
    const userId = metadata.userId;
    const planType = metadata.planType || "complete_access";

    if (!userId) {
      console.error("No userId found in payment metadata");
      return;
    }

    // Create access record in Firestore
    const accessRef = doc(db, "userAccess", userId);
    const accessData = {
      userId,
      planType,
      isActive: true,
      purchaseDate: new Date(),
      maxAttempts: 10,
      remainingAttempts: 10,
      paymentReference: tx_ref,
      paymentProvider: "flutterwave",
      amount: verification.data.amount, // Flutterwave amount is already in base currency
      currency,
      customerEmail: customer.email,
      transactionId: data.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(accessRef, accessData);

    // Update user's payment status
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      hasAccess: true,
      lastPaymentDate: new Date(),
      paymentProvider: "flutterwave",
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
