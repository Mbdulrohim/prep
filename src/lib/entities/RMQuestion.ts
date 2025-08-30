import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('rm_questions')
@Index(['examId', 'category'])
@Index(['difficulty', 'topic'])
export class RMQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @Column('text')
  questionText: string;

  @Column('json')
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  };

  @Column()
  correctAnswer: string; // 'A', 'B', 'C', 'D', or 'E'

  @Column('text', { nullable: true })
  explanation: string;

  @Column({ nullable: true })
  category: string; // e.g., 'Obstetrics', 'Gynaecology', 'Midwifery'

  @Column({ nullable: true })
  topic: string; // e.g., 'Labour Management', 'Antenatal Care'

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string; // 'easy', 'medium', 'hard'

  @Column('text', { nullable: true })
  references: string; // Reference materials

  @Column('json', { nullable: true })
  tags: string[]; // Tags for categorization

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isCorrectAnswer(selectedOption: string): boolean {
    return this.correctAnswer === selectedOption;
  }

  getOptionsArray(): { key: string; value: string }[] {
    const optionsArray = [
      { key: 'A', value: this.options.A },
      { key: 'B', value: this.options.B },
      { key: 'C', value: this.options.C },
      { key: 'D', value: this.options.D }
    ];
    
    if (this.options.E) {
      optionsArray.push({ key: 'E', value: this.options.E });
    }
    
    return optionsArray;
  }

  getShuffledOptions(): { key: string; value: string }[] {
    const optionsArray = this.getOptionsArray();
    return optionsArray.sort(() => Math.random() - 0.5);
  }
}
