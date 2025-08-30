import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payments')
@Index(['userId'])
@Index(['reference'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ unique: true })
  reference: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'enum', enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' })
  status: string;

  @Column({ type: 'enum', enum: ['paystack', 'flutterwave'], default: 'paystack' })
  provider: string;

  @Column({ type: 'enum', enum: ['rm', 'weekly_assessment'], default: 'rm' })
  examType: string;

  @Column({ type: 'json', nullable: true })
  providerData: {
    transactionId?: string;
    authorizationCode?: string;
    channel?: string;
    cardType?: string;
    bank?: string;
    last4?: string;
  };

  @Column({ type: 'json', nullable: true })
  examAccess: {
    paper1: boolean;
    paper2: boolean;
    attempts: number;
    expiryDate?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    userEmail?: string;
    userName?: string;
    description?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isSuccessful(): boolean {
    return this.status === 'success';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  hasFailed(): boolean {
    return this.status === 'failed' || this.status === 'cancelled';
  }
}
