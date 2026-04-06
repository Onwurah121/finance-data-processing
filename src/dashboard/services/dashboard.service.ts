import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DashboardFilterDto } from '../dto/dashboard-filter.dto';

// Amounts are stored as integer cents (×100) by the Prisma extension.
// $queryRaw bypasses extensions, so every raw SUM must be divided by 100.
const fromCents = (raw: unknown): number => Math.trunc(Number(raw) / 100);

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getSummary(filter: DashboardFilterDto) {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;

    type SummaryRow = { income: unknown; expense: unknown; count: bigint };

    const [row] = await this.db.client.$queryRaw<SummaryRow[]>`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount::numeric ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount::numeric ELSE 0 END), 0) AS expense,
        COUNT(*)                                                                       AS count
      FROM transaction_entries
      WHERE (${dateFrom}::timestamptz IS NULL OR date >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz   IS NULL OR date <= ${dateTo}::timestamptz)
    `;

    const totalIncome = fromCents(row.income);
    const totalExpenses = fromCents(row.expense);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: Number(row.count),
    };
  }

  async getCategoryTotals(filter: DashboardFilterDto) {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;

    type CategoryRow = {
      categoryId: number;
      categoryName: string;
      income: unknown;
      expense: unknown;
    };

    const rows = await this.db.client.$queryRaw<CategoryRow[]>`
      SELECT
        c.id   AS "categoryId",
        c.name AS "categoryName",
        COALESCE(SUM(CASE WHEN te.type = 'INCOME'  THEN te.amount::numeric ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN te.type = 'EXPENSE' THEN te.amount::numeric ELSE 0 END), 0) AS expense
      FROM transaction_entries te
      JOIN transaction_entry_categories c ON c.id = te.category_id
      WHERE (${dateFrom}::timestamptz IS NULL OR te.date >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz   IS NULL OR te.date <= ${dateTo}::timestamptz)
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;

    return rows.map((r) => {
      const income = fromCents(r.income);
      const expense = fromCents(r.expense);
      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        income,
        expense,
        net: income - expense,
      };
    });
  }

  async getRecentActivity(limit = 10) {
    return this.db.client.transactionEntry.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async getMonthlyTrends(filter: DashboardFilterDto) {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;

    type TrendRow = { month: string; income: unknown; expense: unknown };

    const rows = await this.db.client.$queryRaw<TrendRow[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM')                                                           AS month,
        COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount::numeric ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount::numeric ELSE 0 END), 0) AS expense
      FROM transaction_entries
      WHERE (${dateFrom}::timestamptz IS NULL OR date >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz   IS NULL OR date <= ${dateTo}::timestamptz)
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;

    return rows.map((r) => {
      const income = fromCents(r.income);
      const expense = fromCents(r.expense);
      return { month: r.month, income, expense, net: income - expense };
    });
  }

  async getWeeklyTrends(filter: DashboardFilterDto) {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;

    type TrendRow = { week: string; income: unknown; expense: unknown };

    const rows = await this.db.client.$queryRaw<TrendRow[]>`
      SELECT
        TO_CHAR(date, 'IYYY-"W"IW')                                                        AS week,
        COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount::numeric ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount::numeric ELSE 0 END), 0) AS expense
      FROM transaction_entries
      WHERE (${dateFrom}::timestamptz IS NULL OR date >= ${dateFrom}::timestamptz)
        AND (${dateTo}::timestamptz   IS NULL OR date <= ${dateTo}::timestamptz)
      GROUP BY TO_CHAR(date, 'IYYY-"W"IW')
      ORDER BY week
    `;

    return rows.map((r) => {
      const income = fromCents(r.income);
      const expense = fromCents(r.expense);
      return { week: r.week, income, expense, net: income - expense };
    });
  }
}
