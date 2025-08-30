import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('rm_user_access')
export class RMUserAccess {
  @PrimaryColumn() // Use Firebase UID as primary key
  id: string;

  @Column()
  userId: string; // Firebase UID (should match id)

  @Column()
  userEmail: string;

  @Column({ default: 'RM' })
  examCategory: string;

  @Column({ default: true })
  hasAccess: boolean;

  @Column()
  accessMethod: string; // 'payment', 'admin', 'code'

  @Column()
  accessGrantedAt: Date;

  @Column({ nullable: true })
  accessExpiresAt: Date;

  @Column('json', { nullable: true })
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentDate: Date;
    paymentStatus: string;
  };

  @Column('json', { default: '{}' })
  rmAttempts: Record<string, {
    attemptCount: number;
    lastAttemptAt: Date;
    bestScore?: number;
  }>;

  @Column('json', { default: '{"maxAttempts": 1}' })
  adminSettings: {
    maxAttempts: number;
    notes?: string;
  };

  // Additional fields to match Firebase
  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column('json', { nullable: true })
  accessCodeInfo: {
    code: string;
    redeemedAt: Date;
    codeType: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
