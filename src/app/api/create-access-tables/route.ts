import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/database';

export async function POST() {
  try {
    console.log('🔄 Creating access_codes table manually...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Create access_codes table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR UNIQUE NOT NULL,
        "examCategory" VARCHAR NOT NULL,
        "codeType" VARCHAR NOT NULL,
        "maxUses" INTEGER,
        "usedCount" INTEGER DEFAULT 0,
        "expiresAt" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        description TEXT,
        "createdByUserId" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create user_access table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS user_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" VARCHAR NOT NULL,
        "userEmail" VARCHAR NOT NULL,
        "examCategory" VARCHAR NOT NULL,
        "accessType" VARCHAR NOT NULL,
        "status" VARCHAR DEFAULT 'active',
        "expiresAt" TIMESTAMP,
        "accessCodeId" UUID REFERENCES access_codes(id),
        "paymentId" UUID,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create payments table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" VARCHAR NOT NULL,
        "userEmail" VARCHAR NOT NULL,
        "examCategory" VARCHAR NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR DEFAULT 'NGN',
        "paymentMethod" VARCHAR NOT NULL,
        "transactionId" VARCHAR UNIQUE NOT NULL,
        status VARCHAR DEFAULT 'pending',
        "paymentGateway" VARCHAR,
        "gatewayResponse" JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Access system tables created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Access system tables created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
