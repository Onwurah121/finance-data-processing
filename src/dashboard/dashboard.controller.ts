import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

/**
 * All dashboard endpoints require DASHBOARD_READ permission.
 */
@Controller('dashboard')
@Permissions('DASHBOARD_READ')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/summary?dateFrom=2026-01-01&dateTo=2026-04-05
   * Returns: totalIncome, totalExpenses, netBalance, transactionCount
   */
  @Get('summary')
  @ResponseMessage('Dashboard summary retrieved successfully')
  getSummary(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getSummary(filter);
  }

  /**
   * GET /dashboard/categories?dateFrom=...&dateTo=...
   * Returns income/expense/net per category.
   */
  @Get('categories')
  @ResponseMessage('Category totals retrieved successfully')
  getCategoryTotals(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getCategoryTotals(filter);
  }

  /**
   * GET /dashboard/recent?limit=10
   * Returns the N most recent transactions.
   */
  @Get('recent')
  @ResponseMessage('Recent activity retrieved successfully')
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  /**
   * GET /dashboard/trends/monthly?dateFrom=...&dateTo=...
   * Returns income/expense/net per calendar month.
   */
  @Get('trends/monthly')
  @ResponseMessage('Monthly trends retrieved successfully')
  getMonthlyTrends(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getMonthlyTrends(filter);
  }

  /**
   * GET /dashboard/trends/weekly?dateFrom=...&dateTo=...
   * Returns income/expense/net per ISO week.
   */
  @Get('trends/weekly')
  @ResponseMessage('Weekly trends retrieved successfully')
  getWeeklyTrends(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getWeeklyTrends(filter);
  }
}
