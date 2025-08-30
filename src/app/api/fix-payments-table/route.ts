import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const queryRunner = AppDataSource.createQueryRunner();

    console.log('🔧 Fixing payments table schema...');

    try {
      // Add planType column if it doesn't exist
      await queryRunner.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS "planType" VARCHAR(255) NULL;
      `);
      console.log('✅ Added planType column');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ planType column might already exist:', errorMessage);
    }

    try {
      // Add paymentDetails column if it doesn't exist  
      await queryRunner.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS "paymentDetails" JSONB NULL;
      `);
      console.log('✅ Added paymentDetails column');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ paymentDetails column might already exist:', errorMessage);
    }

    try {
      // Add processedAt column if it doesn't exist
      await queryRunner.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP NULL;
      `);
      console.log('✅ Added processedAt column');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ processedAt column might already exist:', errorMessage);
    }

    try {
      // Add paymentDate column if it doesn't exist
      await queryRunner.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      console.log('✅ Added paymentDate column');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ paymentDate column might already exist:', errorMessage);
    }

    // Check current schema
    const result = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);

    await queryRunner.release();

    return NextResponse.json({
      success: true,
      message: 'Payments table schema updated successfully',
      columns: result
    });

  } catch (error) {
    console.error('❌ Error fixing payments table:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
