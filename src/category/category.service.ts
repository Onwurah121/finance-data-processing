import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.db.client.transactionEntryCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Category "${dto.name}" already exists`,
      );
    }
    return this.db.client.transactionEntryCategory.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.db.client.transactionEntryCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.db.client.transactionEntryCategory.findUnique({
      where: { id },
      include: { transactionEntries: false },
    });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const conflict =
        await this.db.client.transactionEntryCategory.findFirst({
          where: { name: dto.name, NOT: { id } },
        });
      if (conflict) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    return this.db.client.transactionEntryCategory.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.client.transactionEntryCategory.delete({ where: { id } });
    return { message: `Category #${id} deleted successfully` };
  }
}
