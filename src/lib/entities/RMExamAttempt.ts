import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('rm_exam_attempts')
@Index(['userId', 'examId'])
@Index(['attemptNumber', 'status'])
export class RMExamAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @Column()
  userId: string;

  @Column()
  userEmail: string;

  @Column({ default: 1 })
  attemptNumber: number;

  @Column({ type: 'enum', enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' })
  status: string;

  @Column('json')
  answers: {
    [questionId: string]: {
      selectedAnswer: string;
      isCorrect: boolean;
      timeSpent: number; // seconds
      flagged?: boolean;
    };
  };

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  percentage: number;

  @Column({ default: 0 })
  correctAnswers: number;

  @Column({ default: 0 })
  totalQuestions: number;

  @Column({ default: 0 })
  timeSpent: number; // total time in seconds

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isSubmitted: boolean;

  @Column({ default: false })
  isPassed: boolean;

  @Column('timestamp', { nullable: true })
  startedAt: Date;

  @Column('timestamp', { nullable: true })
  submittedAt: Date;

  @Column('json', { nullable: true })
  questionOrder: string[]; // Order questions were presented

  @Column('json', { nullable: true })
  analytics: {
    timePerQuestion: { [questionId: string]: number };
    categoryPerformance: { [category: string]: { correct: number; total: number } };
    difficultyPerformance: { [level: string]: { correct: number; total: number } };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  hasCompleted(): boolean {
    return this.status === 'completed';
  }

  hasPassed(): boolean {
    return this.isPassed;
  }

  getTimeTaken(): number {
    return this.timeSpent; // already in seconds
  }

  getFormattedTimeTaken(): string {
    const seconds = this.timeSpent;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  getPerformanceByCategory(): any {
    if (!this.analytics?.categoryPerformance) return {};
    return this.analytics.categoryPerformance;
  }
}
