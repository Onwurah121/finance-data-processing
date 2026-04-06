import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Permissions, ResponseMessage } from '../../common';
import { DashboardFilterDto } from '../dto/dashboard-filter.dto';
import { DashboardService } from '../services/dashboard.service';

/**
 * All dashboard endpoints require DASHBOARD_READ permission.
 */
@Controller('dashboard')
@Permissions('dashboard_read')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/summary?dateFrom=2026-01-01&dateTo=2026-04-05
   * Returns: totalIncome, totalExpenses, netBalance, transactionCount
   */
  @Get('summary')
  @ResponseMessage('Dashboard summary retrieved successfully')
  getSummary(
    @Query()
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
    @Query()
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
  getRecentActivity(@Query('limit', ParseIntPipe) limit: number) {
    return this.dashboardService.getRecentActivity(limit);
  }

  /**
   * GET /dashboard/trends/monthly?dateFrom=...&dateTo=...
   * Returns income/expense/net per calendar month.
   */
  @Get('trends/monthly')
  @ResponseMessage('Monthly trends retrieved successfully')
  getMonthlyTrends(
    @Query()
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
    @Query()
    filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getWeeklyTrends(filter);
  }
}
