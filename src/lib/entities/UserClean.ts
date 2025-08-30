import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  firebaseUid: string; // Firebase Auth UID

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  university: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  graduationYear: string;

  @Column({ default: 'student' })
  role: string; // 'student', 'admin', 'instructor'

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  profile: {
    phone?: string;
    address?: string;
    bio?: string;
    preferences?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
