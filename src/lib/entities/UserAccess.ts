import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccessCode } from './AccessCode';

@Entity('user_access')
export class UserAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Firebase UID

  @Column()
  userEmail: string;

  @Column()
  examCategory: string; // 'RM', 'RN', 'Weekly Assessment'

  @Column()
  accessType: string; // 'code', 'payment', 'admin'

  @Column({ default: 'active' })
  status: string; // 'active', 'expired', 'suspended'

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  accessCodeId: string;

  @Column({ nullable: true })
  paymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => AccessCode, { nullable: true })
  @JoinColumn({ name: 'accessCodeId' })
  accessCode: AccessCode;
}
