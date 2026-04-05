import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AssignPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dto';

@Injectable()
export class PermissionService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.db.client.permissions.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Permission with code "${dto.code}" already exists`,
      );
    }
    return this.db.client.permissions.create({ data: { code: dto.code } });
  }

  async findAll() {
    return this.db.client.permissions.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const permission = await this.db.client.permissions.findUnique({
      where: { id },
      include: { rolePermissions: { include: { role: true } } },
    });
    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }
    return permission;
  }

  async update(id: number, dto: UpdatePermissionDto) {
    await this.findOne(id);

    if (dto.code) {
      const conflict = await this.db.client.permissions.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `Permission with code "${dto.code}" already exists`,
        );
      }
    }

    return this.db.client.permissions.update({
      where: { id },
      data: { code: dto.code },
    });
  }

  /**
   * Assigns a permission to a role.
   * All users belonging to that role inherit the permission immediately.
   */
  async assignToRole(dto: AssignPermissionDto) {
    await this.ensurePermissionExists(dto.permissionId);
    await this.ensureRoleExists(dto.roleId);

    const existing = await this.db.client.rolePermission.findFirst({
      where: { roleId: dto.roleId, permissionId: dto.permissionId },
    });
    if (existing) {
      throw new ConflictException(
        'This permission is already assigned to the role',
      );
    }

    return this.db.client.rolePermission.create({
      data: { roleId: dto.roleId, permissionId: dto.permissionId },
      include: { role: true, permission: true },
    });
  }

  /**
   * Revokes a permission from a role.
   * All users belonging to that role immediately lose the permission.
   */
  async revokeFromRole(dto: AssignPermissionDto) {
    await this.ensurePermissionExists(dto.permissionId);
    await this.ensureRoleExists(dto.roleId);

    const assignment = await this.db.client.rolePermission.findFirst({
      where: { roleId: dto.roleId, permissionId: dto.permissionId },
    });
    if (!assignment) {
      throw new NotFoundException(
        'This permission is not assigned to the role',
      );
    }

    await this.db.client.rolePermission.delete({
      where: { id: assignment.id },
    });

    return { message: 'Permission revoked from role successfully' };
  }

  /**
   * Returns the effective permission codes for a given user
   * by looking up their role's assigned permissions.
   */
  async getUserPermissions(userId: number) {
    const user = await this.db.client.user.findFirst({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
    };
  }

  private async ensurePermissionExists(id: number) {
    const permission = await this.db.client.permissions.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException(`Permission #${id} not found`);
    return permission;
  }

  private async ensureRoleExists(id: number) {
    const role = await this.db.client.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }
}
