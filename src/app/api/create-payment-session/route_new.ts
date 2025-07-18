// src/app/api/create-payment-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const { email, amount, planName, userId, metadata } = await request.json();

    if (!email || !amount || !planName || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate reference
    const reference = paystackService.generateReference();

    // Initialize Paystack payment
    const paymentData = await paystackService.initializePayment({
      email,
      amount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      metadata: {
        ...metadata,
        planName,
        userId,
        reference,
      },
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    });

    if (!paymentData.status) {
      return NextResponse.json(
        { error: paymentData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      authorization_url: paymentData.data.authorization_url,
      access_code: paymentData.data.access_code,
      reference: paymentData.data.reference,
    });
  } catch (error) {
    console.error("Payment session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
