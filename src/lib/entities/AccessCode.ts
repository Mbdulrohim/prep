import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('access_codes')
@Index(['code'], { unique: true })
export class AccessCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ type: 'enum', enum: ['rm', 'weekly_assessment'], default: 'rm' })
  type: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'uuid', nullable: true })
  usedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ type: 'json', nullable: true })
  examAccess: {
    paper1: boolean;
    paper2: boolean;
    attempts: number;
    expiryDate?: string;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    batchId?: string;
    generatedBy?: string;
    description?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  canBeUsed(): boolean {
    return !this.isUsed;
  }
}
