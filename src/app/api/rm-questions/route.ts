import { NextRequest, NextResponse } from 'next/server';
import { rmQuestionService } from '@/lib/services/rmQuestionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const question = await rmQuestionService.createQuestion(data);
        return NextResponse.json({ 
          success: true, 
          question,
          message: 'Question created successfully'
        });

      case 'assign':
        const { userId, examType = 'RM', questionCount = 60, filters = {} } = data;
        const assignment = await rmQuestionService.assignQuestionsToUser(
          userId, 
          examType, 
          questionCount, 
          filters
        );
        return NextResponse.json({ 
          success: true, 
          assignment,
          message: 'Questions assigned successfully'
        });

      case 'submit':
        const { userId: submitUserId, assignmentId, answers } = data;
        const result = await rmQuestionService.submitExamAnswers(
          submitUserId, 
          assignmentId, 
          answers
        );
        return NextResponse.json({ 
          success: true, 
          result,
          message: 'Exam submitted successfully'
        });

      case 'bulk_import':
        const { questions } = data;
        const importResult = await rmQuestionService.bulkImportQuestions(questions);
        return NextResponse.json({ 
          success: true, 
          result: importResult,
          message: `Imported ${importResult.imported} questions, ${importResult.failed} failed`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Questions API error:', error);
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
      case 'list':
        const category = searchParams.get('category');
        const subject = searchParams.get('subject');
        const difficulty = searchParams.get('difficulty');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const filters = {
          ...(category && { category }),
          ...(subject && { subject }),
          ...(difficulty && { difficulty: difficulty as 'easy' | 'medium' | 'hard' })
        };

        const questions = await rmQuestionService.getQuestions(filters, limit);
        return NextResponse.json({ 
          success: true, 
          questions,
          count: questions.length
        });

      case 'stats':
        const stats = await rmQuestionService.getQuestionStats();
        return NextResponse.json({ 
          success: true, 
          stats
        });

      case 'get_assigned':
        const userId = searchParams.get('userId');
        const assignmentId = searchParams.get('assignmentId');
        
        if (!userId || !assignmentId) {
          return NextResponse.json(
            { success: false, error: 'userId and assignmentId are required' },
            { status: 400 }
          );
        }

        const assignedQuestions = await rmQuestionService.getAssignedQuestions(userId, assignmentId);
        return NextResponse.json({ 
          success: true, 
          questions: assignedQuestions,
          count: assignedQuestions.length
        });

      case 'history':
        const historyUserId = searchParams.get('userId');
        const historyLimit = parseInt(searchParams.get('limit') || '10');
        
        if (!historyUserId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }

        const history = await rmQuestionService.getUserExamHistory(historyUserId, historyLimit);
        return NextResponse.json({ 
          success: true, 
          history,
          count: history.length
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RM Questions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, ...updateData } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId is required' },
        { status: 400 }
      );
    }

    const updatedQuestion = await rmQuestionService.updateQuestion(questionId, updateData);
    
    if (!updatedQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      question: updatedQuestion,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('RM Questions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId is required' },
        { status: 400 }
      );
    }

    const deleted = await rmQuestionService.deleteQuestion(questionId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('RM Questions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
