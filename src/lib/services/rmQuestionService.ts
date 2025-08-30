import { getRepository } from '../database';
import { Question } from '../entities/Question';
import { ExamAttempt } from '../entities/ExamAttempt';
import { Repository } from 'typeorm';

export interface RMQuestionAssignment {
  userId: string;
  assignedQuestions: string[];
  assignmentId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateQuestionData {
  questionText: string;
  options: string[];
  correctAnswer: string; // A, B, C, or D
  explanation?: string;
  category: string;
  subcategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionFilters {
  category?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  includeInactive?: boolean;
  year?: number;
}

export class RMQuestionService {
  private questionRepo: Repository<Question> | null = null;
  private examAttemptRepo: Repository<ExamAttempt> | null = null;

  private async getQuestionRepo(): Promise<Repository<Question>> {
    if (!this.questionRepo) {
      this.questionRepo = await getRepository(Question);
    }
    return this.questionRepo;
  }

  private async getExamAttemptRepo(): Promise<Repository<ExamAttempt>> {
    if (!this.examAttemptRepo) {
      this.examAttemptRepo = await getRepository(ExamAttempt);
    }
    return this.examAttemptRepo;
  }

  /**
   * Create a new RM question
   */
  async createQuestion(questionData: CreateQuestionData): Promise<Question> {
    try {
      const questionRepo = await this.getQuestionRepo();
      
      // Generate a unique ID
      const questionId = `rm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const question = questionRepo.create({
        id: questionId,
        questionText: questionData.questionText,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation || '',
        category: questionData.category || 'RM',
        subcategory: questionData.subcategory || 'General',
        difficulty: questionData.difficulty || 'medium'
      });

      return await questionRepo.save(question);
    } catch (error) {
      console.error('Error creating RM question:', error);
      throw new Error('Failed to create question');
    }
  }

  /**
   * Get questions by filters
   */
  async getQuestions(filters: QuestionFilters = {}, limit: number = 50): Promise<Question[]> {
    try {
      const questionRepo = await this.getQuestionRepo();
      const query = questionRepo.createQueryBuilder('question');

      if (filters.category) {
        query.andWhere('question.category = :category', { category: filters.category });
      }

      if (filters.subject) {
        query.andWhere('question.subject = :subject', { subject: filters.subject });
      }

      if (filters.difficulty) {
        query.andWhere('question.difficulty = :difficulty', { difficulty: filters.difficulty });
      }

      if (filters.year) {
        query.andWhere('question.year = :year', { year: filters.year });
      }

      if (filters.tags && filters.tags.length > 0) {
        query.andWhere('question.tags && ARRAY[:...tags]', { tags: filters.tags });
      }

      // Skip isActive filter for now since our imported questions don't have this column
      // if (!filters.includeInactive) {
      //   query.andWhere('question.isActive = :isActive', { isActive: true });
      // }

      query.orderBy('question.createdAt', 'DESC');
      query.limit(limit);

      return await query.getMany();
    } catch (error) {
      console.error('Error fetching RM questions:', error);
      throw new Error('Failed to fetch questions');
    }
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    try {
      const questionRepo = await this.getQuestionRepo();
      return await questionRepo.findOne({
        where: { id: questionId }
      });
    } catch (error) {
      console.error('Error fetching question by ID:', error);
      throw new Error('Failed to fetch question');
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(questionId: string, updateData: Partial<CreateQuestionData>): Promise<Question | null> {
    try {
      const questionRepo = await this.getQuestionRepo();
      const question = await questionRepo.findOne({
        where: { id: questionId }
      });

      if (!question) {
        return null;
      }

      Object.assign(question, updateData);
      return await questionRepo.save(question);
    } catch (error) {
      console.error('Error updating RM question:', error);
      throw new Error('Failed to update question');
    }
  }

  /**
   * Delete a question permanently  
   */
  async deleteQuestion(questionId: string): Promise<boolean> {
    try {
      const questionRepo = await this.getQuestionRepo();
      const result = await questionRepo.delete({ id: questionId });

      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting RM question:', error);
      throw new Error('Failed to delete question');
    }
  }

  /**
   * Assign random questions to a user for RM exam
   */
  async assignQuestionsToUser(
    userId: string,
    examType: string = 'RM',
    questionCount: number = 60,
    filters: QuestionFilters = {}
  ): Promise<RMQuestionAssignment> {
    try {
      // Get available questions
      const availableQuestions = await this.getQuestions(filters, questionCount * 2);

      if (availableQuestions.length < questionCount) {
        throw new Error(`Not enough questions available. Found ${availableQuestions.length}, need ${questionCount}`);
      }

      // Randomly select questions
      const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, questionCount);

      const assignmentId = `${userId}_${examType}_${Date.now()}`;

      // Create exam attempt record
      const examAttemptRepo = await this.getExamAttemptRepo();
      const examAttempt = examAttemptRepo.create({
        id: assignmentId,
        userId,
        examId: assignmentId,
        examCategory: examType,
        completed: false,
        totalQuestions: questionCount,
        startTime: new Date(),
        answers: {},
        questionResults: selectedQuestions.map(q => ({
          questionId: q.id,
          selectedAnswer: '',
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          timeSpent: 0
        }))
      });

      await examAttemptRepo.save(examAttempt);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour expiry

      return {
        userId,
        assignedQuestions: selectedQuestions.map(q => q.id),
        assignmentId,
        createdAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Error assigning questions to user:', error);
      throw new Error('Failed to assign questions');
    }
  }

  /**
   * Get assigned questions for a user's active exam
   */
  async getAssignedQuestions(userId: string, assignmentId: string): Promise<Question[]> {
    try {
      const examAttemptRepo = await this.getExamAttemptRepo();
      const examAttempt = await examAttemptRepo.findOne({
        where: {
          userId,
          examId: assignmentId,
          completed: false
        }
      });

      if (!examAttempt) {
        throw new Error('No active exam found');
      }

      // Check if exam has been running for more than 2 hours
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      if (examAttempt.startTime < twoHoursAgo) {
        // Mark as expired
        await examAttemptRepo.update(
          { id: examAttempt.id },
          { completed: true, endTime: new Date() }
        );
        throw new Error('Exam has expired');
      }

      // Get question IDs from questionResults
      const questionIds = examAttempt.questionResults?.map(result => result.questionId) || [];
      
      // Get questions by IDs
      const questionRepo = await this.getQuestionRepo();
      const questions = await questionRepo.findByIds(questionIds);

      // Sort questions in the same order as questionResults
      const sortedQuestions = questionIds.map((id: string) => 
        questions.find((q: Question) => q.id === id)
      ).filter(Boolean) as Question[];

      return sortedQuestions;
    } catch (error) {
      console.error('Error fetching assigned questions:', error);
      throw error;
    }
  }

  /**
   * Submit answers for RM exam
   */
  async submitExamAnswers(
    userId: string,
    assignmentId: string,
    answers: Record<string, string> // Changed to string for A, B, C, D answers
  ): Promise<{ score: number; totalQuestions: number; passed: boolean }> {
    try {
      const examAttemptRepo = await this.getExamAttemptRepo();
      const examAttempt = await examAttemptRepo.findOne({
        where: {
          userId,
          examId: assignmentId,
          completed: false
        }
      });

      if (!examAttempt) {
        throw new Error('No active exam found');
      }

      // Get question IDs from questionResults
      const questionIds = examAttempt.questionResults?.map(result => result.questionId) || [];
      
      // Get the questions to calculate score
      const questionRepo = await this.getQuestionRepo();
      const questions = await questionRepo.findByIds(questionIds);
      
      let correctAnswers = 0;
      const updatedQuestionResults = examAttempt.questionResults?.map(result => {
        const question = questions.find(q => q.id === result.questionId);
        const userAnswer = answers[result.questionId];
        const isCorrect = userAnswer === question?.correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }

        return {
          ...result,
          selectedAnswer: userAnswer || '',
          isCorrect
        };
      }) || [];

      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= 70; // 70% pass mark

      // Update exam attempt
      await examAttemptRepo.update(
        { id: examAttempt.id },
        {
          completed: true,
          endTime: new Date(),
          submittedAt: new Date(),
          answers,
          score,
          percentage: score,
          questionResults: updatedQuestionResults,
          timeTaken: Math.floor((new Date().getTime() - examAttempt.startTime.getTime()) / 1000)
        }
      );

      return {
        score,
        totalQuestions: questions.length,
        passed
      };
    } catch (error) {
      console.error('Error submitting exam answers:', error);
      throw error;
    }
  }

  /**
   * Get user's exam history
   */
  async getUserExamHistory(userId: string, limit: number = 10): Promise<ExamAttempt[]> {
    try {
      const examAttemptRepo = await this.getExamAttemptRepo();
      return await examAttemptRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit
      });
    } catch (error) {
      console.error('Error fetching user exam history:', error);
      throw new Error('Failed to fetch exam history');
    }
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
  }> {
    try {
      const questionRepo = await this.getQuestionRepo();
      const total = await questionRepo.count();
      const active = total; // All imported questions are considered active

      const categoryStats = await questionRepo
        .createQueryBuilder('question')
        .select('question.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.category')
        .getRawMany();

      const difficultyStats = await questionRepo
        .createQueryBuilder('question')
        .select('question.difficulty', 'difficulty')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.difficulty')
        .getRawMany();

      const byCategory: Record<string, number> = {};
      categoryStats.forEach(stat => {
        byCategory[stat.category] = parseInt(stat.count);
      });

      const byDifficulty: Record<string, number> = {};
      difficultyStats.forEach(stat => {
        byDifficulty[stat.difficulty] = parseInt(stat.count);
      });

      return {
        total,
        active,
        byCategory,
        byDifficulty
      };
    } catch (error) {
      console.error('Error fetching question stats:', error);
      throw new Error('Failed to fetch question statistics');
    }
  }

  /**
   * Bulk import questions from JSON
   */
  async bulkImportQuestions(questions: CreateQuestionData[]): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const questionData of questions) {
      try {
        await this.createQuestion(questionData);
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import question "${questionData.questionText}": ${error}`);
      }
    }

    return { imported, failed, errors };
  }
}

// Export singleton instance
export const rmQuestionService = new RMQuestionService();
