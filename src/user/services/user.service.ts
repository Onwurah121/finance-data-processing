import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';

const BCRYPT_ROUNDS = 12;

/** Fields returned to the caller — password is always omitted */
const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.db.client.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists`,
      );
    }

    await this.ensureRoleExists(dto.roleId);

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.db.client.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
        roleId: dto.roleId,
      },
      select: USER_SELECT,
    });
  }

  async findAll() {
    return this.db.client.user.findMany({
      where: { isDeleted: false },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.db.client.user.findFirst({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const conflict = await this.db.client.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `A user with email "${dto.email}" already exists`,
        );
      }
    }

    if (dto.roleId) {
      await this.ensureRoleExists(dto.roleId);
    }

    const data: Record<string, unknown> = {
      ...(dto.email && { email: dto.email }),
      ...(dto.fullName && { fullName: dto.fullName }),
      ...(dto.roleId && { roleId: dto.roleId }),
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    return this.db.client.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // DatabaseService soft-deletes via the Prisma extension
    await this.db.client.user.delete({ where: { id } });
    return { message: `User #${id} deleted successfully` };
  }

  async assignRole(userId: number, dto: AssignRoleDto) {
    await this.findOne(userId);
    await this.ensureRoleExists(dto.roleId);

    return this.db.client.user.update({
      where: { id: userId },
      data: { roleId: dto.roleId },
      select: USER_SELECT,
    });
  }

  async findAllRoles() {
    return this.db.client.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, createdAt: true },
    });
  }

  private async ensureRoleExists(id: number) {
    const role = await this.db.client.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }
}
