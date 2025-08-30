import { Repository } from 'typeorm';
import { getRepository } from '../database';
import { UserPermission, Role, UserRole, User } from '../entities';

export class PermissionService {
  // Check if user has specific permission
  static async hasPermission(userId: string, permission: string, resource: string = 'global'): Promise<boolean> {
    try {
      // Check direct permissions
      const permissionRepo: Repository<UserPermission> = await getRepository(UserPermission);
      const directPermission = await permissionRepo.findOne({
        where: {
          userId,
          permission,
          resource,
          granted: true,
        }
      });

      if (directPermission) {
        // Check if permission is not expired
        if (!directPermission.expiresAt || new Date() < directPermission.expiresAt) {
          return true;
        }
      }

      // Check role-based permissions
      const userRoleRepo: Repository<UserRole> = await getRepository(UserRole);
      const userRoles = await userRoleRepo.find({
        where: { userId },
        relations: ['role'],
      });

      for (const userRole of userRoles) {
        // Check if role is not expired
        if (userRole.expiresAt && new Date() > userRole.expiresAt) {
          continue;
        }

        // Check if role has the permission
        if (userRole.role.permissions.includes(permission)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Check multiple permissions (user needs ALL)
  static async hasAllPermissions(userId: string, permissions: string[], resource: string = 'global'): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, resource))) {
        return false;
      }
    }
    return true;
  }

  // Check multiple permissions (user needs ANY)
  static async hasAnyPermission(userId: string, permissions: string[], resource: string = 'global'): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, resource)) {
        return true;
      }
    }
    return false;
  }

  // Grant permission to user
  static async grantPermission(
    userId: string,
    permission: string,
    resource: string = 'global',
    grantedByUserId: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const permissionRepo: Repository<UserPermission> = await getRepository(UserPermission);
      
      const permissionId = `${userId}_${permission}_${resource}`;
      
      const userPermission = permissionRepo.create({
        id: permissionId,
        userId,
        permission,
        resource,
        granted: true,
        grantedByUserId,
        grantedAt: new Date(),
        expiresAt,
      });

      await permissionRepo.save(userPermission);
      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  // Revoke permission from user
  static async revokePermission(userId: string, permission: string, resource: string = 'global'): Promise<boolean> {
    try {
      const permissionRepo: Repository<UserPermission> = await getRepository(UserPermission);
      
      await permissionRepo.update(
        { userId, permission, resource },
        { granted: false }
      );
      
      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  // Get user's permissions
  static async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const permissionRepo: Repository<UserPermission> = await getRepository(UserPermission);
      return await permissionRepo.find({
        where: { userId, granted: true },
        relations: ['grantedBy'],
      });
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Admin check (common permission check)
  static async isAdmin(userId: string): Promise<boolean> {
    return await this.hasPermission(userId, 'admin', 'global');
  }

  // RM access check
  static async hasRMAccess(userId: string): Promise<boolean> {
    return await this.hasPermission(userId, 'rm_access', 'global');
  }

  // Question management check
  static async canManageQuestions(userId: string): Promise<boolean> {
    return await this.hasAnyPermission(userId, ['admin', 'question_creator'], 'questions');
  }
}
