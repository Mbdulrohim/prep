import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Clean RM-focused entities
import { User } from './entities/UserClean';
import { RMExam } from './entities/RMExam';
import { RMQuestion } from './entities/RMQuestion';
import { RMExamAttempt } from './entities/RMExamAttempt';
import { AccessCode } from './entities/AccessCode';
import { UserAccess } from './entities/UserAccess';
import { Payment } from './entities/Payment';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'prep_user',
  password: process.env.DATABASE_PASSWORD || 'prep_password',
  database: process.env.DATABASE_NAME || 'prep',
  synchronize: true, // AUTO-SYNC ENABLED for clean schema creation
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_HOST?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    RMExam,
    RMQuestion,
    RMExamAttempt,
    AccessCode,
    UserAccess,
    Payment
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
    console.log('✅ Clean database connected with auto-sync enabled');
    return dataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    connectionPromise = null;
    throw error;
  }
};

// Helper to get repository
export const getRepository = async <T extends object>(entity: new () => T) => {
  const dataSource = await getDatabase();
  return dataSource.getRepository<T>(entity);
};
