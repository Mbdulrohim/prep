import 'reflect-metadata';
import { DataSource, ObjectLiteral } from 'typeorm';
import {
  User,
  Question,
  ExamResult,
  ExamAttempt,
  RMUserAccess,
  UserAccess,
  Payment,
  Transaction,
  University,
  AccessCode,
  Group,
  UserPermission,
  Role,
  UserRole,
} from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'prep_user',
  password: process.env.DATABASE_PASSWORD || 'prep_password',
  database: process.env.DATABASE_NAME || 'prep',
  synchronize: false, // Disabled temporarily - tables already created manually
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_HOST?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false, // Enable SSL for AWS RDS
  entities: [
    User,
    Question,
    ExamAttempt,
    ExamResult,
    RMUserAccess,
    UserAccess,
    Payment,
    Transaction,
    University,
    AccessCode,
    Group,
    UserPermission,
    Role,
    UserRole
  ],
});

// Initialize the database connection
let connectionPromise: Promise<DataSource> | null = null;

export const getDatabase = async (): Promise<DataSource> => {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = AppDataSource.initialize();
  
  try {
    const dataSource = await connectionPromise;
    console.log('✅ Database connected successfully');
    return dataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    connectionPromise = null;
    throw error;
  }
};

// Helper to get repository
export const getRepository = async <T extends ObjectLiteral>(entity: new () => T) => {
  const dataSource = await getDatabase();
  return dataSource.getRepository<T>(entity);
};
