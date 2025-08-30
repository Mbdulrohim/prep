import { Repository } from 'typeorm';
import { getRepository } from '../database';
import { User } from '../entities';

export class UserService {
  static async createUser(userData: Partial<User>): Promise<User> {
    const userRepo: Repository<User> = await getRepository(User);
    const user = userRepo.create(userData);
    return await userRepo.save(user);
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const userRepo: Repository<User> = await getRepository(User);
    return await userRepo.findOne({ where: { email } });
  }

  static async findUserById(id: string): Promise<User | null> {
    const userRepo: Repository<User> = await getRepository(User);
    return await userRepo.findOne({ where: { id } });
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userRepo: Repository<User> = await getRepository(User);
    await userRepo.update(id, updates);
    return await this.findUserById(id);
  }

  static async getAllUsers(): Promise<User[]> {
    const userRepo: Repository<User> = await getRepository(User);
    return await userRepo.find();
  }
}
