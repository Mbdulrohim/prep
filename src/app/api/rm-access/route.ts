import { NextRequest, NextResponse } from 'next/server';
import { rmAccessService } from '@/lib/services/rmAccessService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_access_code':
        const { code, examCategory, codeType, maxUses, expiresAt, description } = data;
        const accessCode = await rmAccessService.createAccessCode({
          code,
          examCategory,
          codeType,
          maxUses,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          description
        });
        return NextResponse.json({ 
          success: true, 
          accessCode,
          message: 'Access code created successfully'
        });

      case 'redeem_access_code':
        const { userId, userEmail, code: redeemCode } = data;
        if (!userId || !userEmail || !redeemCode) {
          return NextResponse.json(
            { success: false, error: 'userId, userEmail, and code are required' },
            { status: 400 }
          );
        }
        
        const redeemResult = await rmAccessService.redeemAccessCode(userId, userEmail, redeemCode);
        return NextResponse.json(redeemResult);

      case 'check_access':
        const { userId: checkUserId, examCategory: checkExamCategory } = data;
        if (!checkUserId || !checkExamCategory) {
          return NextResponse.json(
            { success: false, error: 'userId and examCategory are required' },
            { status: 400 }
          );
        }
        
        const accessResult = await rmAccessService.checkUserAccess(checkUserId, checkExamCategory);
        return NextResponse.json({ 
          success: true, 
          ...accessResult,
          message: accessResult.hasAccess ? 'User has access' : 'User does not have access'
        });

      case 'grant_payment_access':
        const { userId: paymentUserId, userEmail: paymentUserEmail, examCategory: paymentExamCategory, paymentData } = data;
        if (!paymentUserId || !paymentUserEmail || !paymentExamCategory || !paymentData) {
          return NextResponse.json(
            { success: false, error: 'userId, userEmail, examCategory, and paymentData are required' },
            { status: 400 }
          );
        }
        
        const paymentResult = await rmAccessService.grantAccessViaPayment(
          paymentData
        );
        
        if (paymentResult.success) {
          return NextResponse.json({
            success: true,
            message: paymentResult.message,
            userAccessId: paymentResult.userAccessId
          });
        } else {
          return NextResponse.json(
            { success: false, error: paymentResult.message },
            { status: 500 }
          );
        }

      // Payment processing moved to dedicated webhook endpoints

      case 'generate_bulk_codes':
        const { count, examCategory: bulkExamCategory, prefix } = data;
        if (!count || !bulkExamCategory) {
          return NextResponse.json(
            { success: false, error: 'count and examCategory are required' },
            { status: 400 }
          );
        }

        const bulkCodes = await rmAccessService.generateBulkAccessCodes(count, bulkExamCategory, prefix);
        return NextResponse.json({ 
          success: true, 
          codes: bulkCodes,
          count: bulkCodes.length,
          message: `Generated ${bulkCodes.length} access codes`
        });

      // Attempt increment moved to exam submission handlers

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Access API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'check_access':
        const userId = searchParams.get('userId');
        const examCategory = searchParams.get('examCategory') || 'RM';
        
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }

        const accessCheck = await rmAccessService.checkUserAccess(userId, examCategory);
        return NextResponse.json({ 
          success: true, 
          access: accessCheck
        });

      // User access history moved to user profile endpoint

      case 'code_stats':
        const codes = await rmAccessService.getAccessCodes();
        return NextResponse.json({ 
          success: true, 
          stats: {
            totalCodes: codes.length,
            activeCodes: codes.filter(c => !c.isUsed).length,
            usedCodes: codes.filter(c => c.isUsed).length
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Access API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
