import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { RMQuestion } from '@/lib/entities/RMQuestion';
import { RMExam } from '@/lib/entities/RMExam';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { questions, examId, paper } = data;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({
        success: false,
        error: 'Questions array is required'
      }, { status: 400 });
    }

    const rmQuestionRepo = await getRepository(RMQuestion);
    const rmExamRepo = await getRepository(RMExam);

    // Verify exam exists
    let exam = null;
    if (examId) {
      exam = await rmExamRepo.findOne({ where: { id: examId } });
      if (!exam) {
        return NextResponse.json({
          success: false,
          error: 'Exam not found'
        }, { status: 404 });
      }
    } else if (paper) {
      // Find or create exam for the paper
      exam = await rmExamRepo.findOne({ where: { paper } });
      if (!exam) {
        exam = rmExamRepo.create({
          title: `RM ${paper.charAt(0).toUpperCase() + paper.slice(1)} Exam`,
          paper,
          description: `Registered Midwife ${paper} examination`,
          duration: 180,
          totalQuestions: 100,
          passingScore: 50,
          isActive: true,
          isPublished: false,
          instructions: {
            general: ['Read each question carefully'],
            specific: ['Select the best answer'],
            warnings: ['No external materials allowed']
          },
          settings: {
            shuffleQuestions: true,
            showResults: false,
            allowReview: true,
            maxAttempts: 3
          }
        });
        exam = await rmExamRepo.save(exam);
      }
    }

    const savedQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = questions[i];
        
        // Validate required fields
        if (!questionData.questionText || !questionData.options || !questionData.correctAnswer) {
          errors.push(`Question ${i + 1}: Missing required fields`);
          continue;
        }

        // Validate options format
        if (!questionData.options.A || !questionData.options.B || !questionData.options.C || !questionData.options.D) {
          errors.push(`Question ${i + 1}: Options A, B, C, D are required`);
          continue;
        }

        // Validate correct answer
        if (!['A', 'B', 'C', 'D', 'E'].includes(questionData.correctAnswer)) {
          errors.push(`Question ${i + 1}: Correct answer must be A, B, C, D, or E`);
          continue;
        }

        const question = rmQuestionRepo.create({
          examId: exam?.id || questionData.examId,
          questionText: questionData.questionText,
          options: {
            A: questionData.options.A,
            B: questionData.options.B,
            C: questionData.options.C,
            D: questionData.options.D,
            E: questionData.options.E || undefined
          },
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation || null,
          category: questionData.category || 'General',
          topic: questionData.topic || 'General',
          difficulty: questionData.difficulty || 'medium',
          references: questionData.references || null,
          tags: questionData.tags || [],
          isActive: questionData.isActive !== false
        });

        const savedQuestion = await rmQuestionRepo.save(question);
        savedQuestions.push(savedQuestion);
      } catch (error) {
        console.error(`Error saving question ${i + 1}:`, error);
        errors.push(`Question ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update exam question count
    if (exam) {
      const totalQuestions = await rmQuestionRepo.count({ where: { examId: exam.id } });
      exam.totalQuestions = totalQuestions;
      await rmExamRepo.save(exam);
    }

    return NextResponse.json({
      success: true,
      data: {
        questionsCreated: savedQuestions.length,
        totalQuestions: savedQuestions.length,
        examId: exam?.id,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Successfully uploaded ${savedQuestions.length} questions${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error uploading RM questions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload questions'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const paper = searchParams.get('paper');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const rmQuestionRepo = await getRepository(RMQuestion);
    
    const whereConditions: any = {};
    
    if (examId) {
      whereConditions.examId = examId;
    }
    
    if (category) {
      whereConditions.category = category;
    }
    
    if (difficulty) {
      whereConditions.difficulty = difficulty;
    }

    // If paper is specified, find questions for that paper's exam
    if (paper && !examId) {
      const rmExamRepo = await getRepository(RMExam);
      const exam = await rmExamRepo.findOne({ where: { paper } });
      if (exam) {
        whereConditions.examId = exam.id;
      }
    }

    const [questions, total] = await rmQuestionRepo.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    // Get statistics
    const totalCount = await rmQuestionRepo.count({ where: whereConditions });
    
    // Get difficulty stats separately to avoid type issues
    const easyCount = await rmQuestionRepo.count({ 
      where: { ...whereConditions, difficulty: 'easy' } 
    });
    const mediumCount = await rmQuestionRepo.count({ 
      where: { ...whereConditions, difficulty: 'medium' } 
    });
    const hardCount = await rmQuestionRepo.count({ 
      where: { ...whereConditions, difficulty: 'hard' } 
    });

    const stats = {
      total: totalCount,
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount
    };

    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats: {
          total: stats.total,
          byDifficulty: {
            easy: stats.easy,
            medium: stats.medium,
            hard: stats.hard
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching RM questions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch questions'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, paper, id } = data;

    const rmQuestionRepo = await getRepository(RMQuestion);
    const rmExamRepo = await getRepository(RMExam);

    // Handle clearing all questions from a paper
    if (action === 'clear_all' && paper) {
      // Find the exam for this paper
      const exam = await rmExamRepo.findOne({ where: { paper } });
      
      if (exam) {
        // Delete all questions for this exam
        await rmQuestionRepo.delete({ examId: exam.id });
        
        // Update exam question count
        exam.totalQuestions = 0;
        await rmExamRepo.save(exam);
        
        return NextResponse.json({
          success: true,
          message: `All questions cleared from ${paper}`
        });
      } else {
        return NextResponse.json({
          success: true,
          message: `No exam found for ${paper}, nothing to clear`
        });
      }
    }

    // Handle single question deletion (existing functionality)
    if (id) {
      const question = await rmQuestionRepo.findOne({ where: { id } });

      if (!question) {
        return NextResponse.json({
          success: false,
          error: 'Question not found'
        }, { status: 404 });
      }

      await rmQuestionRepo.remove(question);

      // Update exam question count
      const exam = await rmExamRepo.findOne({ where: { id: question.examId } });
      if (exam) {
        const totalQuestions = await rmQuestionRepo.count({ where: { examId: exam.id } });
        exam.totalQuestions = totalQuestions;
        await rmExamRepo.save(exam);
      }

      return NextResponse.json({
        success: true,
        message: 'Question deleted successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Either action=clear_all with paper or id parameter is required'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in DELETE operation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform delete operation'
    }, { status: 500 });
  }
}
