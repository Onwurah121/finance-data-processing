import { TransactionType } from '../../../generated/prisma/enums';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsDateString()
  date: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
