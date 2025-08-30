import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn() // Use transaction reference as primary key
  id: string;

  @Column()
  userId: string; // Firebase UID

  @Column()
  transactionId: string; // Payment provider transaction ID

  @Column()
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  paymentMethod: string; // 'flutterwave', 'paystack', 'manual'

  @Column()
  status: string; // 'pending', 'successful', 'failed'

  @Column()
  examCategory: string; // 'RN', 'RM', 'Weekly Assessment'

  @Column({ nullable: true })
  planType: string; // 'basic', 'premium', 'rm_access'

  @Column()
  paymentDate: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column('json', { nullable: true })
  paymentDetails: any; // Payment provider response

  @Column('json', { nullable: true })
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };

  // Flutterwave/Paystack specific fields
  @Column({ nullable: true })
  txRef: string; // Our reference

  @Column({ nullable: true })
  flwRef: string; // Flutterwave reference

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
