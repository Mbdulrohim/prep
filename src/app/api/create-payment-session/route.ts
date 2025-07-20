// src/app/api/create-payment-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { flutterwaveService } from "@/lib/flutterwave";

export async function POST(request: NextRequest) {
  try {
    const { email, amount, planType, userId, txRef, customerName } = await request.json();

    if (!email || !amount || !planType || !userId || !txRef) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the correct redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/payment/success`;
    
    console.log("Payment session redirect URL:", redirectUrl);

    // Initialize Flutterwave payment
    const paymentData = await flutterwaveService.initializePayment({
      tx_ref: txRef,
      amount,
      currency: "NGN",
      redirect_url: redirectUrl,
      payment_options: "card,mobilemoney,ussd,banktransfer",
      customer: {
        email,
        name: customerName || "PREP Student",
        phonenumber: "",
      },
      customizations: {
        title: "PREP - Premium Nursing Exam Access",
        description: "Payment for premium exam preparation with 3 mock exams",
        logo: `${baseUrl}/image.png`,
      },
      meta: flutterwaveService.createPaymentMetadata(userId, planType, {
        txRef,
        customerName,
      }),
    });

    if (paymentData.status !== "success") {
      return NextResponse.json(
        { error: paymentData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        link: paymentData.data.link,
        tx_ref: txRef,
      },
    });
  } catch (error) {
    console.error("Payment session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
