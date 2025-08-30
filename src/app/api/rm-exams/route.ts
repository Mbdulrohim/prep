import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { RMExam } from '@/lib/entities/RMExam';
import { RMQuestion } from '@/lib/entities/RMQuestion';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paper = searchParams.get('paper');
    const includeQuestions = searchParams.get('includeQuestions') === 'true';

    const rmExamRepo = await getRepository(RMExam);
    const rmQuestionRepo = await getRepository(RMQuestion);

      const whereConditions: any = {};
    
    if (paper) {
      whereConditions.paper = paper;
    }

    const exams = await rmExamRepo.find({
      where: whereConditions,
      order: { paper: 'ASC', createdAt: 'DESC' }
    });

    // Add question counts to each exam
    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await rmQuestionRepo.count({
          where: { examId: exam.id, isActive: true }
        });

        const examData = {
          id: exam.id,
          title: exam.title,
          paper: exam.paper,
          description: exam.description,
          duration: exam.duration,
          totalQuestions: questionCount,
          passingScore: exam.passingScore,
          instructions: exam.instructions,
          settings: exam.settings,
          isActive: exam.isActive,
          isPublished: exam.isPublished,
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt
        };

        if (includeQuestions) {
          const questions = await rmQuestionRepo.find({
            where: { examId: exam.id, isActive: true },
            order: { createdAt: 'ASC' }
          });
          return { ...examData, questions };
        }

        return examData;
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        exams: examsWithStats,
        total: examsWithStats.length
      }
    });
  } catch (error) {
    console.error('Error fetching RM exams:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RM exams'
    }, { status: 500 });
  }
}
