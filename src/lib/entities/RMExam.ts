import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('rm_exams')
@Index(['paper', 'isActive'])
export class RMExam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  paper: string; // 'Paper 1' or 'Paper 2'

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 180 }) // 3 hours in minutes
  duration: number;

  @Column({ default: 100 })
  totalQuestions: number;

  @Column({ default: 50 })
  passingScore: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column('json', { nullable: true })
  instructions: {
    general: string[];
    specific: string[];
    warnings: string[];
  };

  @Column('json', { nullable: true })
  settings: {
    shuffleQuestions: boolean;
    showResults: boolean;
    allowReview: boolean;
    maxAttempts: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isAvailable(): boolean {
    return this.isActive && this.isPublished;
  }

  getDurationFormatted(): string {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    return `${hours}h ${minutes}m`;
  }
}
