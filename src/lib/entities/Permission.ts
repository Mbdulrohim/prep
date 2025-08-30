import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryColumn() // Use composite key: userId_permission
  id: string;

  @Column()
  userId: string; // Firebase UID

  @Column()
  permission: string; // 'admin', 'moderator', 'question_creator', 'rm_access', 'premium'

  @Column()
  resource: string; // 'global', 'questions', 'users', 'rm_exams', etc.

  @Column({ default: true })
  granted: boolean;

  @Column({ nullable: true })
  grantedByUserId: string; // Who granted this permission

  @Column()
  grantedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column('json', { nullable: true })
  metadata: {
    reason?: string;
    conditions?: any;
    scope?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'grantedByUserId' })
  grantedBy: User;
}

@Entity('roles')
export class Role {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('json')
  permissions: string[]; // Array of permission strings

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;
}

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn() // Use composite key: userId_roleId
  id: string;

  @Column()
  userId: string; // Firebase UID

  @Column()
  roleId: string;

  @Column({ nullable: true })
  assignedByUserId: string;

  @Column()
  assignedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedByUserId' })
  assignedBy: User;
}
