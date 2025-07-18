// src/app/api/webhook/paystack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      await handleSuccessfulPayment(event.data);
    } else if (event.event === 'charge.failed') {
      await handleFailedPayment(event.data);
    } else if (event.event === 'transfer.success') {
      // Handle transfer success if needed
      console.log('Transfer successful:', event.data);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    const { reference, amount, customer, metadata } = data;
    
    if (!metadata?.userId) {
      console.error('No userId in payment metadata');
      return;
    }

    const userId = metadata.userId;
    const planType = metadata.planType || 'basic';
    const planName = metadata.planName || 'Basic Access';
    const university = metadata.university || 'Not specified';

    // Verify payment with Paystack
    const verificationResult = await paystackService.verifyPayment(reference);
    
    if (!verificationResult.status || verificationResult.data.status !== 'success') {
      console.error('Payment verification failed:', verificationResult);
      return;
    }

    // Create payment record
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'payments', paymentId), {
      id: paymentId,
      userId,
      reference,
      amount: amount / 100, // Convert kobo to naira
      currency: 'NGN',
      status: 'success',
      planType,
      planName,
      university,
      customerEmail: customer.email,
      paymentMethod: 'paystack',
      paymentDate: new Date(),
      createdAt: new Date(),
      metadata
    });

    // Grant user access based on plan
    const accessDuration = planType === 'premium' ? 90 : 30; // days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + accessDuration);

    // Update user access
    const userAccessDoc = doc(db, 'userAccess', userId);
    const existingAccess = await getDoc(userAccessDoc);
    
    const accessData = {
      userId,
      planType,
      planName,
      hasAccess: true,
      accessGrantedAt: new Date(),
      accessExpiresAt: expiryDate,
      paymentReference: reference,
      lastUpdated: new Date(),
      examAccess: {
        'medical-surgical': true,
        'pediatric': true,
        'obstetric': true,
        'psychiatric': true,
        'community': true,
        'fundamentals': true
      }
    };

    if (existingAccess.exists()) {
      await updateDoc(userAccessDoc, accessData);
    } else {
      await setDoc(userAccessDoc, accessData);
    }

    // Log activity
    await setDoc(doc(db, 'userActivity', `${userId}_${Date.now()}`), {
      userId,
      type: 'payment',
      description: `Payment successful for ${planName}`,
      timestamp: new Date(),
      metadata: {
        paymentId,
        reference,
        amount: amount / 100,
        planType
      }
    });

    console.log(`Payment processed successfully for user ${userId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(data: any) {
  try {
    const { reference, amount, customer, metadata } = data;
    
    if (!metadata?.userId) {
      console.error('No userId in failed payment metadata');
      return;
    }

    const userId = metadata.userId;

    // Create failed payment record
    const paymentId = `payment_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'payments', paymentId), {
      id: paymentId,
      userId,
      reference,
      amount: amount / 100,
      currency: 'NGN',
      status: 'failed',
      customerEmail: customer.email,
      paymentMethod: 'paystack',
      paymentDate: new Date(),
      createdAt: new Date(),
      metadata
    });

    // Log activity
    await setDoc(doc(db, 'userActivity', `${userId}_${Date.now()}`), {
      userId,
      type: 'payment',
      description: 'Payment failed',
      timestamp: new Date(),
      metadata: {
        paymentId,
        reference,
        amount: amount / 100,
        status: 'failed'
      }
    });

    console.log(`Payment failed for user ${userId}, reference: ${reference}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}
