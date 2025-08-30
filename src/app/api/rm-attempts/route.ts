import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { RMExamAttempt } from '@/lib/entities/RMExamAttempt';
import { RMExam } from '@/lib/entities/RMExam';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const examId = searchParams.get('examId');
    const paper = searchParams.get('paper');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const rmAttemptRepo = await getRepository(RMExamAttempt);
    const rmExamRepo = await getRepository(RMExam);

      const whereConditions: any = {};

    if (examId) {
      whereConditions.examId = examId;
    }

    // If paper is specified, find the exam for that paper
    if (paper && !examId) {
      const exam = await rmExamRepo.findOne({ where: { paper } });
      if (exam) {
        whereConditions.examId = exam.id;
      }
    }

    const attempts = await rmAttemptRepo.find({
      where: whereConditions,
      order: { createdAt: 'DESC' }
    });

    // Get exam details for each attempt
    const attemptsWithExamData = await Promise.all(
      attempts.map(async (attempt) => {
        const exam = await rmExamRepo.findOne({ where: { id: attempt.examId } });
        
        return {
          id: attempt.id,
          examId: attempt.examId,
          userId: attempt.userId,
          userEmail: attempt.userEmail,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          answers: attempt.answers,
          score: attempt.score,
          percentage: attempt.percentage,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          timeSpent: attempt.timeSpent,
          isCompleted: attempt.isCompleted,
          isSubmitted: attempt.isSubmitted,
          isPassed: attempt.isPassed,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          questionOrder: attempt.questionOrder,
          analytics: attempt.analytics,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
          // Include exam details
          exam: exam ? {
            id: exam.id,
            title: exam.title,
            paper: exam.paper,
            duration: exam.duration,
            passingScore: exam.passingScore
          } : null
        };
      })
    );

    // Calculate user statistics
    const stats = {
      totalAttempts: attemptsWithExamData.length,
      completedAttempts: attemptsWithExamData.filter(a => a.isCompleted).length,
      passedAttempts: attemptsWithExamData.filter(a => a.isPassed).length,
      averageScore: attemptsWithExamData.length > 0 
        ? attemptsWithExamData
            .filter(a => a.isCompleted)
            .reduce((sum, a) => sum + a.percentage, 0) / 
          attemptsWithExamData.filter(a => a.isCompleted).length || 0
        : 0,
      bestScore: attemptsWithExamData.length > 0 
        ? Math.max(...attemptsWithExamData.map(a => a.percentage))
        : 0,
      paper1Attempts: attemptsWithExamData.filter(a => a.exam?.paper === 'paper1').length,
      paper2Attempts: attemptsWithExamData.filter(a => a.exam?.paper === 'paper2').length
    };

    return NextResponse.json({
      success: true,
      data: {
        attempts: attemptsWithExamData,
        stats,
        total: attemptsWithExamData.length
      }
    });
  } catch (error) {
    console.error('Error fetching RM exam attempts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RM exam attempts'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, examId, action } = data;

    if (!userId || !examId) {
      return NextResponse.json({
        success: false,
        error: 'User ID and Exam ID are required'
      }, { status: 400 });
    }

    const rmAttemptRepo = await getRepository(RMExamAttempt);
    const rmExamRepo = await getRepository(RMExam);

    if (action === 'start') {
      // Start a new exam attempt
      const exam = await rmExamRepo.findOne({ where: { id: examId } });
      if (!exam) {
        return NextResponse.json({
          success: false,
          error: 'Exam not found'
        }, { status: 404 });
      }

      // Check if user has any previous attempts
      const previousAttempts = await rmAttemptRepo.find({
        where: { userId, examId },
        order: { attemptNumber: 'DESC' }
      });

      const attemptNumber = previousAttempts.length > 0 
        ? previousAttempts[0].attemptNumber + 1 
        : 1;

      const newAttempt = rmAttemptRepo.create({
        examId,
        userId,
        userEmail: data.userEmail || '',
        attemptNumber,
        status: 'in_progress',
        answers: {},
        score: 0,
        percentage: 0,
        correctAnswers: 0,
        totalQuestions: exam.totalQuestions,
        timeSpent: 0,
        isCompleted: false,
        isSubmitted: false,
        isPassed: false,
        startedAt: new Date(),
        questionOrder: [],
        analytics: {
          timePerQuestion: {},
          categoryPerformance: {},
          difficultyPerformance: {}
        }
      });

      const savedAttempt = await rmAttemptRepo.save(newAttempt);

      return NextResponse.json({
        success: true,
        data: savedAttempt,
        message: 'Exam attempt started successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
  } catch (error) {
    console.error('Error handling RM exam attempt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle exam attempt'
    }, { status: 500 });
  }
}
