import { NextRequest, NextResponse } from 'next/server';
import { rmQuestionService } from '@/lib/services/rmQuestionService';
import { rmAccessService } from '@/lib/services/rmAccessService';
import { QuestionParser } from '@/lib/services/questionParser';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'start_exam':
        const { userId, userEmail, examCategory = 'RM' } = data;
        
        if (!userId || !userEmail) {
          return NextResponse.json(
            { success: false, error: 'userId and userEmail are required' },
            { status: 400 }
          );
        }

        // Check if user has access
        const accessCheck = await rmAccessService.checkUserAccess(userId, examCategory);
        
        if (!accessCheck.hasAccess) {
          return NextResponse.json({
            success: false,
            error: 'User does not have access to RM exams',
            requiresAccess: true
          }, { status: 403 });
        }

        // Assign questions for exam
        const assignment = await rmQuestionService.assignQuestionsToUser(
          userId,
          examCategory,
          60, // 60 questions for RM exam
          { category: examCategory }
        );

        return NextResponse.json({
          success: true,
          assignment,
          accessInfo: {
            expiresAt: accessCheck.expiresAt
          },
          message: 'Exam started successfully'
        });

      case 'submit_exam':
        const { userId: submitUserId, assignmentId, answers, examCategory: submitExamCategory = 'RM' } = data;
        
        if (!submitUserId || !assignmentId || !answers) {
          return NextResponse.json(
            { success: false, error: 'userId, assignmentId, and answers are required' },
            { status: 400 }
          );
        }

        // Submit exam answers
        const examResult = await rmQuestionService.submitExamAnswers(
          submitUserId,
          assignmentId,
          answers
        );

        // Note: Attempt count increment moved to exam service

        return NextResponse.json({
          success: true,
          result: examResult,
          message: 'Exam submitted successfully'
        });

      case 'import_questions':
        try {
          const questionsFilePath = path.join(process.cwd(), 'dev', 'questions.txt');
          const importResult = await QuestionParser.importQuestionsFromFile(questionsFilePath);
          
          return NextResponse.json({
            success: true,
            result: importResult,
            message: `Imported ${importResult.imported} questions, ${importResult.failed} failed`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Failed to import questions: ${error instanceof Error ? error.message : 'Unknown error'}`
          }, { status: 500 });
        }

      case 'preview_questions':
        try {
          const questionsFilePath = path.join(process.cwd(), 'dev', 'questions.txt');
          const parsedQuestions = QuestionParser.parseQuestionsFromFile(questionsFilePath);
          const previewCount = data.count || 5;
          
          return NextResponse.json({
            success: true,
            preview: parsedQuestions.slice(0, previewCount),
            totalCount: parsedQuestions.length,
            message: `Preview of ${Math.min(previewCount, parsedQuestions.length)} questions`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Failed to preview questions: ${error instanceof Error ? error.message : 'Unknown error'}`
          }, { status: 500 });
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Exam API error:', error);
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
      case 'get_exam_questions':
        const userId = searchParams.get('userId');
        const assignmentId = searchParams.get('assignmentId');
        
        if (!userId || !assignmentId) {
          return NextResponse.json(
            { success: false, error: 'userId and assignmentId are required' },
            { status: 400 }
          );
        }

        // Get assigned questions for the exam
        const examQuestions = await rmQuestionService.getAssignedQuestions(userId, assignmentId);
        
        // Remove correct answers and explanations from the response (for security)
        const sanitizedQuestions = examQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          category: q.category,
          subcategory: q.subcategory,
          difficulty: q.difficulty
        }));

        return NextResponse.json({
          success: true,
          questions: sanitizedQuestions,
          count: sanitizedQuestions.length,
          assignmentId
        });

      case 'check_exam_status':
        const statusUserId = searchParams.get('userId');
        const examCategory = searchParams.get('examCategory') || 'RM';
        
        if (!statusUserId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }

        // Check access status
        const accessStatus = await rmAccessService.checkUserAccess(statusUserId, examCategory);
        
        // Get exam history
        const examHistory = await rmQuestionService.getUserExamHistory(statusUserId, 5);
        
        return NextResponse.json({
          success: true,
          access: accessStatus,
          examHistory: examHistory.filter(exam => exam.examCategory === examCategory),
          message: 'Exam status retrieved successfully'
        });

      case 'get_exam_results':
        const resultUserId = searchParams.get('userId');
        const resultExamCategory = searchParams.get('examCategory') || 'RM';
        
        if (!resultUserId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }

        const userExamHistory = await rmQuestionService.getUserExamHistory(resultUserId, 10);
        const rmExamResults = userExamHistory.filter(exam => 
          exam.examCategory === resultExamCategory && exam.completed
        );

        return NextResponse.json({
          success: true,
          results: rmExamResults.map(exam => ({
            id: exam.id,
            examCategory: exam.examCategory,
            score: exam.score,
            percentage: exam.percentage,
            totalQuestions: exam.totalQuestions,
            completed: exam.completed,
            startTime: exam.startTime,
            endTime: exam.endTime,
            timeTaken: exam.timeTaken
          })),
          count: rmExamResults.length
        });

      case 'system_status':
        // Get overall system statistics
        const [questionStats, accessCodes] = await Promise.all([
          rmQuestionService.getQuestionStats(),
          rmAccessService.getAccessCodes()
        ]);

        const accessCodeStats = {
          totalCodes: accessCodes.length,
          activeCodes: accessCodes.filter(c => !c.isUsed).length,
          usedCodes: accessCodes.filter(c => c.isUsed).length
        };

        return NextResponse.json({
          success: true,
          stats: {
            questions: questionStats,
            accessCodes: accessCodeStats,
            systemTime: new Date().toISOString()
          },
          message: 'System status retrieved successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Exam API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
