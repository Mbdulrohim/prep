import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryColumn()
  id: string;

  @Column()
  category: string; // 'RN', 'RM', 'Weekly Assessment'

  @Column()
  subcategory: string;

  @Column({ name: 'question_text' })
  questionText: string;

  @Column('jsonb')
  options: string[]; // Array of options A, B, C, D

  @Column({ name: 'correct_answer' })
  correctAnswer: string; // A, B, C, or D

  @Column('text')
  explanation: string;

  @Column()
  difficulty: string; // 'easy', 'medium', 'hard'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
