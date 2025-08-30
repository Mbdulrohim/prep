import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('groups')
export class Group {
  @PrimaryColumn() // Use Firebase document ID
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string; // 'whatsapp', 'telegram', 'discord'

  @Column()
  category: string; // 'RN', 'RM', 'Weekly Assessment', 'General'

  @Column({ nullable: true })
  inviteLink: string;

  @Column({ nullable: true })
  groupCode: string; // For joining

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  requiresPayment: boolean; // True for RM groups

  @Column({ nullable: true })
  maxMembers: number;

  @Column({ default: 0 })
  currentMembers: number;

  @Column({ nullable: true })
  createdByUserId: string; // Firebase UID

  @Column('json', { nullable: true })
  rules: string[]; // Group rules

  @Column('json', { nullable: true })
  moderators: string[]; // Array of user IDs

  @Column({ nullable: true })
  expiresAt: Date; // For temporary groups

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;
}
