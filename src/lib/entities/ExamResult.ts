import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('exam_results')
export class ExamResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  examId: string;

  @Column()
  examCategory: string; // 'RN', 'RM', 'Weekly Assessment'

  @Column()
  score: number;

  @Column()
  totalQuestions: number;

  @Column()
  percentage: number;

  @Column()
  completedAt: Date;

  @Column({ nullable: true })
  timeTaken: number; // seconds

  @Column('json', { nullable: true })
  detailedResults: any; // detailed breakdown

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
