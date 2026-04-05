import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

/**
 * Permission codes:
 *   TRANSACTION_CREATE  — create a transaction record
 *   TRANSACTION_READ    — view transaction records
 *   TRANSACTION_UPDATE  — update a transaction record
 *   TRANSACTION_DELETE  — delete a transaction record
 */
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Permissions('TRANSACTION_CREATE')
  @ResponseMessage('Transaction created successfully')
  create(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(dto);
  }

  /**
   * GET /transactions?type=INCOME&categoryId=1&dateFrom=2026-01-01&dateTo=2026-04-05&page=1&limit=20
   */
  @Get()
  @Permissions('TRANSACTION_READ')
  @ResponseMessage('Transactions retrieved successfully')
  findAll(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    filter: FilterTransactionDto,
  ) {
    return this.transactionService.findAll(filter);
  }

  @Get(':id')
  @Permissions('TRANSACTION_READ')
  @ResponseMessage('Transaction retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @Permissions('TRANSACTION_UPDATE')
  @ResponseMessage('Transaction updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('TRANSACTION_DELETE')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Transaction deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }
}
