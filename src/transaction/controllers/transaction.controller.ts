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
} from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { ResponseMessage } from '../../common';
import { Permissions } from '../../common';
import {
  CreateTransactionDto,
  FilterTransactionDto,
  UpdateTransactionDto,
} from '../dto';

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

  @Post('create')
  @Permissions('transaction_create')
  @ResponseMessage('Transaction created successfully')
  create(
    @Body()
    dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(dto);
  }

  /**
   * GET /transactions?type=INCOME&categoryId=1&dateFrom=2026-01-01&dateTo=2026-04-05&page=1&limit=20
   */
  @Get('all')
  @Permissions('transaction_read')
  @ResponseMessage('Transactions retrieved successfully')
  findAll(
    @Query()
    filter: FilterTransactionDto,
  ) {
    return this.transactionService.findAll(filter);
  }

  @Get('view/:id')
  @Permissions('transaction_read')
  @ResponseMessage('Transaction retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Patch('update/:id')
  @Permissions('transaction_update')
  @ResponseMessage('Transaction updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, dto);
  }

  @Delete('delete/:id')
  @Permissions('transaction_delete')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Transaction deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }
}
