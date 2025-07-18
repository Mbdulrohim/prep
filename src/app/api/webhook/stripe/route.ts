// src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    
    if (!metadata?.userEmail || !metadata?.productId) {
      console.error('Missing required metadata in session');
      return;
    }

    // Generate access code
    const accessCode = generateAccessCode();
    
    // Calculate expiry date
    const validityDays = parseInt(metadata.validityDays || '90');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    // Save access code to Firestore
    const accessCodeData = {
      id: accessCode,
      code: accessCode,
      examCategory: metadata.examCategory,
      papers: metadata.papers.split(','),
      expiryDate,
      maxUses: 1,
      currentUses: 0,
      isActive: true,
      createdAt: new Date(),
      price: session.amount_total! / 100,
      currency: session.currency!,
      userEmail: metadata.userEmail,
      sessionId: session.id,
      productId: metadata.productId
    };

    await setDoc(doc(db, 'accessCodes', accessCode), accessCodeData);

    // Save payment record
    const paymentData = {
      sessionId: session.id,
      userEmail: metadata.userEmail,
      productId: metadata.productId,
      amount: session.amount_total! / 100,
      currency: session.currency!,
      status: 'completed',
      accessCode,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'payments'), paymentData);

    // TODO: Send email with access code
    console.log(`Payment successful! Access code: ${accessCode} for ${metadata.userEmail}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX-XXXX
  return result.match(/.{1,4}/g)?.join('-') || result;
}
