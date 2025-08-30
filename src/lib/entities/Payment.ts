import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  transactionId: string;

  @Column()
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  paymentMethod: string; // 'flutterwave', 'paystack', 'manual'

  @Column()
  status: string; // 'pending', 'completed', 'failed'

  @Column()
  examCategory: string; // 'RN', 'RM', 'Weekly Assessment'

  @Column({ nullable: true })
  planType: string;

  @Column()
  paymentDate: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column('json', { nullable: true })
  paymentDetails: any; // Additional payment provider details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
