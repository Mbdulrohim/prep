import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { RMExam } from '@/lib/entities/RMExam';

interface Params {
  examId: string;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const examRepository = await getRepository(RMExam);
    
    const { examId } = await context.params;
    const updates = await request.json();

    // Find the exam
    const exam = await examRepository.findOne({
      where: { id: examId }
    });

    if (!exam) {
      return NextResponse.json({
        success: false,
        error: 'RM exam not found'
      }, { status: 404 });
    }

        // Update the exam
    const updatedExam = examRepository.merge(exam, {
      ...updates,
      updatedAt: new Date()
    });

    await examRepository.save(updatedExam);

    // If this is Paper 1 and scheduledDate is being set, automatically schedule Paper 2
    if (exam.paper === 'paper1' && updates.scheduledDate) {
      const paper2Exam = await examRepository.findOne({
        where: { paper: 'paper2' }
      });
      
      if (paper2Exam) {
        const paper1Date = new Date(updates.scheduledDate);
        const paper2Date = new Date(paper1Date.getTime() + 24 * 60 * 60 * 1000); // Next day
        
        paper2Exam.scheduledDate = paper2Date.toISOString().split('T')[0];
        paper2Exam.updatedAt = new Date();
        
        await examRepository.save(paper2Exam);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Exam updated successfully',
        exam: updatedExam
      }
    });

  } catch (error) {
    console.error('Error updating RM exam:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update RM exam'
    }, { status: 500 });
  }
}
