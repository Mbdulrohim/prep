import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_access')
@Index(['userId', 'accessType'])
export class UserAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ['rm', 'weekly_assessment'], default: 'rm' })
  accessType: string;

  @Column({ type: 'json' })
  examAccess: {
    paper1: boolean;
    paper2: boolean;
    attempts: number;
    expiryDate?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  grantedByCode: string; // Reference to access code used

  @Column({ type: 'json', nullable: true })
  metadata: {
    grantedBy?: string;
    reason?: string;
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  hasAccess(paper?: 'paper1' | 'paper2'): boolean {
    if (!this.isActive) return false;
    
    if (this.examAccess.expiryDate) {
      const expiry = new Date(this.examAccess.expiryDate);
      if (expiry < new Date()) return false;
    }

    if (paper) {
      return this.examAccess[paper];
    }

    return this.examAccess.paper1 || this.examAccess.paper2;
  }

  hasAttemptsLeft(): boolean {
    return this.examAccess.attempts > 0;
  }
}
