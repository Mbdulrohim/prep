// src/app/api/validate-access-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Access code is required' },
        { status: 400 }
      );
    }

    // Clean the code (remove spaces, convert to uppercase)
    const cleanCode = code.replace(/\s+/g, '').toUpperCase();

    // Get access code from Firestore
    const accessCodeDoc = await getDoc(doc(db, 'accessCodes', cleanCode));

    if (!accessCodeDoc.exists()) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid access code'
      });
    }

    const accessCodeData = accessCodeDoc.data();

    // Check if code is active
    if (!accessCodeData.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'This access code has been deactivated'
      });
    }

    // Check if code has expired
    const now = new Date();
    const expiryDate = accessCodeData.expiryDate.toDate();
    if (now > expiryDate) {
      return NextResponse.json({
        valid: false,
        error: 'This access code has expired'
      });
    }

    // Check if code has reached max uses
    if (accessCodeData.currentUses >= accessCodeData.maxUses) {
      return NextResponse.json({
        valid: false,
        error: 'This access code has been fully used'
      });
    }

    return NextResponse.json({
      valid: true,
      accessCode: {
        examCategory: accessCodeData.examCategory,
        papers: accessCodeData.papers,
        expiryDate: accessCodeData.expiryDate,
        remainingUses: accessCodeData.maxUses - accessCodeData.currentUses
      }
    });

  } catch (error) {
    console.error('Error validating access code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate access code' },
      { status: 500 }
    );
  }
}
