import { IsDateString, IsOptional } from 'class-validator';

export class DashboardFilterDto {
  /** Start of the reporting window (ISO date string) */
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /** End of the reporting window (ISO date string) */
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
