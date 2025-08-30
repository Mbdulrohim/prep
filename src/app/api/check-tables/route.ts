import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔄 Checking database tables...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Check if access_codes table exists
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_codes'
      );
    `);
    
    console.log('Access codes table exists:', tableExists[0].exists);
    
    // List all tables
    const tables = await AppDataSource.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Available tables:', tables.map((t: { table_name: string }) => t.table_name));
    
    return NextResponse.json({
      success: true,
      accessCodesTableExists: tableExists[0].exists,
      availableTables: tables.map((t: { table_name: string }) => t.table_name)
    });
    
  } catch (error) {
    console.error('❌ Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
