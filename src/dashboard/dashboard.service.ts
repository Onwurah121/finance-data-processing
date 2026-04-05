import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Returns: total income, total expenses, net balance.
   * Amounts are stored as integer cents by the Prisma extension (×100).
   * The extension's findMany also converts them back on read,
   * but raw aggregation bypasses the extension — we divide in JS.
   */
  async getSummary(filter: DashboardFilterDto) {
    const dateRange = this.buildDateRange(filter);

    const entries = await this.db.client.transactionEntry.findMany({
      where: { ...(dateRange && { date: dateRange }) },
      select: { type: true, amount: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const entry of entries) {
      const amount = Number(entry.amount);
      if (entry.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: entries.length,
    };
  }

  /**
   * Returns total income and expenses grouped by category.
   */
  async getCategoryTotals(filter: DashboardFilterDto) {
    const dateRange = this.buildDateRange(filter);

    const entries = await this.db.client.transactionEntry.findMany({
      where: { ...(dateRange && { date: dateRange }) },
      select: {
        type: true,
        amount: true,
        category: { select: { id: true, name: true } },
      },
    });

    const map = new Map<
      number,
      { categoryId: number; categoryName: string; income: number; expense: number; net: number }
    >();

    for (const entry of entries) {
      const catId = entry.category.id;
      if (!map.has(catId)) {
        map.set(catId, {
          categoryId: catId,
          categoryName: entry.category.name,
          income: 0,
          expense: 0,
          net: 0,
        });
      }
      const bucket = map.get(catId)!;
      // amount is already converted to units by the Prisma extension's findMany
      const amount = Number(entry.amount);
      if (entry.type === 'INCOME') {
        bucket.income += amount;
      } else {
        bucket.expense += amount;
      }
      bucket.net = bucket.income - bucket.expense;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }

  /**
   * Returns the most recent N transactions (default 10).
   */
  async getRecentActivity(limit = 10) {
    return this.db.client.transactionEntry.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  /**
   * Returns income, expenses and net per calendar month within the window.
   */
  async getMonthlyTrends(filter: DashboardFilterDto) {
    const dateRange = this.buildDateRange(filter);

    const entries = await this.db.client.transactionEntry.findMany({
      where: { ...(dateRange && { date: dateRange }) },
      select: { type: true, amount: true, date: true },
      orderBy: { date: 'asc' },
    });

    const map = new Map<
      string,
      { month: string; income: number; expense: number; net: number }
    >();

    for (const entry of entries) {
      const month = entry.date.toISOString().slice(0, 7); // "YYYY-MM"
      if (!map.has(month)) {
        map.set(month, { month, income: 0, expense: 0, net: 0 });
      }
      const bucket = map.get(month)!;
      const amount = Number(entry.amount);
      if (entry.type === 'INCOME') {
        bucket.income += amount;
      } else {
        bucket.expense += amount;
      }
      bucket.net = bucket.income - bucket.expense;
    }

    return Array.from(map.values());
  }

  /**
   * Returns income, expenses and net per ISO week within the window.
   */
  async getWeeklyTrends(filter: DashboardFilterDto) {
    const dateRange = this.buildDateRange(filter);

    const entries = await this.db.client.transactionEntry.findMany({
      where: { ...(dateRange && { date: dateRange }) },
      select: { type: true, amount: true, date: true },
      orderBy: { date: 'asc' },
    });

    const map = new Map<
      string,
      { week: string; income: number; expense: number; net: number }
    >();

    for (const entry of entries) {
      const week = this.isoWeek(entry.date);
      if (!map.has(week)) {
        map.set(week, { week, income: 0, expense: 0, net: 0 });
      }
      const bucket = map.get(week)!;
      const amount = Number(entry.amount);
      if (entry.type === 'INCOME') {
        bucket.income += amount;
      } else {
        bucket.expense += amount;
      }
      bucket.net = bucket.income - bucket.expense;
    }

    return Array.from(map.values());
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private buildDateRange(filter: DashboardFilterDto) {
    if (!filter.dateFrom && !filter.dateTo) return null;
    return {
      ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
      ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
    };
  }

  /** Returns "YYYY-Www" ISO-week string for a given date. */
  private isoWeek(date: Date): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
}
