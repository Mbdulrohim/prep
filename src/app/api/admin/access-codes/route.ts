import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { AccessCode } from '@/lib/entities/AccessCode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const accessCodeRepo = await getRepository(AccessCode);

    if (action === 'stats') {
      const totalCodes = await accessCodeRepo.count();
      const usedCodes = await accessCodeRepo.count({ where: { isUsed: true } });
      const activeCodes = totalCodes - usedCodes;

      return NextResponse.json({
        success: true,
        stats: {
          total: totalCodes,
          used: usedCodes,
          active: activeCodes,
          usageRate: totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0
        }
      });
    }

    // Get all access codes with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all'; // all, used, unused

    const whereCondition: any = {};
    if (filter === 'used') whereCondition.isUsed = true;
    if (filter === 'unused') whereCondition.isUsed = false;

    const [codes, total] = await accessCodeRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      success: true,
      codes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Access codes fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, count = 10, batchId, description } = await request.json();

    if (action !== 'generate') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

    const accessCodeRepo = await getRepository(AccessCode);
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = generateAccessCode();
      const accessCode = accessCodeRepo.create({
        code,
        type: 'rm',
        examAccess: {
          paper1: true,
          paper2: true,
          attempts: 3
        },
        metadata: {
          batchId: batchId || `batch_${Date.now()}`,
          generatedBy: 'admin',
          description: description || `Generated ${new Date().toISOString()}`
        }
      });

      codes.push(accessCode);
    }

    await accessCodeRepo.save(codes);

    return NextResponse.json({
      success: true,
      message: `Generated ${count} access codes`,
      codes: codes.map(c => c.code),
      batchId: codes[0].metadata?.batchId
    });

  } catch (error) {
    console.error('❌ Access code generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');
    const batchId = searchParams.get('batchId');

    const accessCodeRepo = await getRepository(AccessCode);

    if (codeId) {
      // Delete single code
      const code = await accessCodeRepo.findOne({ where: { id: codeId } });
      if (!code) {
        return NextResponse.json({
          success: false,
          error: 'Access code not found'
        }, { status: 404 });
      }

      if (code.isUsed) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete used access code'
        }, { status: 400 });
      }

      await accessCodeRepo.remove(code);

      return NextResponse.json({
        success: true,
        message: 'Access code deleted successfully'
      });

    } else if (batchId) {
      // Delete entire batch (only unused codes)
      const result = await accessCodeRepo
        .createQueryBuilder()
        .delete()
        .where("metadata->>'batchId' = :batchId", { batchId })
        .andWhere("isUsed = false")
        .execute();

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.affected} unused codes from batch`,
        deletedCount: result.affected
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Must provide either codeId or batchId'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Access code deletion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
