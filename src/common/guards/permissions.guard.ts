import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../../user/enums/user.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('No authenticated user found');

    const dbUser = await this.db.client.user.findFirst({
      where: { id: Number(user.id) },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!dbUser) throw new ForbiddenException('User not found');

    if (!dbUser.role) {
      throw new ForbiddenException(
        'User does not have a role assigned, access denied',
      );
    }

    // The Admin has access to everything, so we can short-circuit the permission checks......
    if (dbUser.role.name === UserRole.ADMIN) return true;

    const userPermissions = new Set(
      dbUser.role.rolePermissions.map((rp) => rp.permission.code),
    );

    const hasAll = requiredPermissions.every((p) => userPermissions.has(p));
    if (!hasAll) {
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource',
      );
    }

    return true;
  }
}
