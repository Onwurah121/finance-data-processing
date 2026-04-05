import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

const TRANSACTION_INCLUDE = {
  category: { select: { id: true, name: true } },
} as const;

@Injectable()
export class TransactionService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateTransactionDto) {
    await this.ensureCategoryExists(dto.categoryId);

    return this.db.client.transactionEntry.create({
      data: {
        type: dto.type,
        amount: String(dto.amount),
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        description: dto.description,
      },
      include: TRANSACTION_INCLUDE,
    });
  }

  async findAll(filter: FilterTransactionDto) {
    const { type, categoryId, dateFrom, dateTo, page = 1, limit = 20 } = filter;

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.db.client.transactionEntry.findMany({
        where,
        include: TRANSACTION_INCLUDE,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.client.transactionEntry.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const entry = await this.db.client.transactionEntry.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!entry) throw new NotFoundException(`Transaction #${id} not found`);
    return entry;
  }

  async update(id: number, dto: UpdateTransactionDto) {
    await this.findOne(id);

    if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = String(dto.amount);
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.description !== undefined) data.description = dto.description;

    return this.db.client.transactionEntry.update({
      where: { id },
      data,
      include: TRANSACTION_INCLUDE,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.client.transactionEntry.delete({ where: { id } });
    return { message: `Transaction #${id} deleted successfully` };
  }

  private async ensureCategoryExists(id: number) {
    const cat = await this.db.client.transactionEntryCategory.findUnique({
      where: { id },
    });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);
    return cat;
  }
}
