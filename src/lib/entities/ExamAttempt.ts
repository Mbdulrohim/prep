import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryColumn() // Use Firebase document ID
  id: string;

  @Column()
  userId: string; // Firebase UID

  @Column()
  examId: string;

  @Column()
  examCategory: string; // 'RN', 'RM', 'Weekly Assessment'

  @Column({ nullable: true })
  userName: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  score: number;

  @Column({ nullable: true })
  totalQuestions: number;

  @Column({ nullable: true })
  percentage: number;

  @Column('json', { nullable: true })
  answers: Record<string, string>; // questionId -> selectedAnswer

  @Column('json', { nullable: true })
  timeSpent: Record<string, number>; // questionId -> seconds

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  submittedAt: Date;

  // Additional Firebase fields
  @Column({ nullable: true })
  university: string;

  @Column('json', { nullable: true })
  questionResults: Array<{
    questionId: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;

  @Column({ nullable: true })
  timeTaken: number; // Total time in seconds

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
