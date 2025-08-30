import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/database';

export async function POST() {
  try {
    console.log('🔄 Cleaning up database issues...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Find and delete rows with NULL id values
    console.log('🔄 Checking for NULL id values...');
    const nullIdCount = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM questions WHERE id IS NULL;
    `);
    console.log('NULL id rows found:', nullIdCount[0].count);
    
    if (parseInt(nullIdCount[0].count) > 0) {
      console.log('🔄 Deleting rows with NULL id values...');
      await AppDataSource.query(`
        DELETE FROM questions WHERE id IS NULL;
      `);
      console.log('✅ Deleted rows with NULL id values');
    }
    
    // Check for empty string id values and fix them
    console.log('🔄 Checking for empty string id values...');
    const emptyIdCount = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM questions WHERE id = '';
    `);
    console.log('Empty id rows found:', emptyIdCount[0].count);
    
    if (parseInt(emptyIdCount[0].count) > 0) {
      console.log('🔄 Deleting rows with empty id values...');
      await AppDataSource.query(`
        DELETE FROM questions WHERE id = '';
      `);
      console.log('✅ Deleted rows with empty id values');
    }
    
    // Check for duplicate id values
    console.log('🔄 Checking for duplicate id values...');
    const duplicates = await AppDataSource.query(`
      SELECT id, COUNT(*) as count 
      FROM questions 
      WHERE id IS NOT NULL AND id != '' 
      GROUP BY id 
      HAVING COUNT(*) > 1;
    `);
    console.log('Duplicate id rows found:', duplicates.length);
    
    if (duplicates.length > 0) {
      console.log('🔄 Fixing duplicate id values...');
      for (const dup of duplicates) {
        // Keep the first one, delete the rest
        await AppDataSource.query(`
          DELETE FROM questions 
          WHERE id = $1 AND ctid NOT IN (
            SELECT ctid FROM questions WHERE id = $1 LIMIT 1
          );
        `, [dup.id]);
      }
      console.log('✅ Fixed duplicate id values');
    }
    
    // Get final count
    const finalCount = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM questions WHERE id IS NOT NULL AND id != '';
    `);
    
    console.log('✅ Database cleanup completed');
    console.log(`📊 Valid questions remaining: ${finalCount[0].count}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed',
      validQuestionsCount: finalCount[0].count,
      cleanupActions: {
        deletedNullIds: parseInt(nullIdCount[0].count),
        deletedEmptyIds: parseInt(emptyIdCount[0].count),
        fixedDuplicates: duplicates.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
