/**
 * SQLite Consumption Repository
 *
 * Implementation of ConsumptionRepository using SQLite.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { ConsumptionHistory } from '../../domain/entities/ConsumptionHistory';
import {
  ConsumptionRepository,
  DailyConsumption,
} from '../../domain/repositories/ConsumptionRepository';

interface ConsumptionRow {
  id: string;
  product_id: string;
  service_id: string | null;
  quantity: number;
  date: string;
  created_at: string;
}

export class SQLiteConsumptionRepository implements ConsumptionRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToConsumption(row: ConsumptionRow): ConsumptionHistory {
    return {
      id: row.id,
      productId: row.product_id,
      serviceId: row.service_id,
      quantity: row.quantity,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
    };
  }

  async save(entry: ConsumptionHistory): Promise<void> {
    await this.db.execute(
      `INSERT INTO consumption_history (id, product_id, service_id, quantity, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.productId,
        entry.serviceId ?? null,
        entry.quantity,
        entry.date.toISOString().split('T')[0], // Store as YYYY-MM-DD
        entry.createdAt.toISOString(),
      ],
    );
  }

  async findByProductId(productId: string, days: number): Promise<ConsumptionHistory[]> {
    const rows = await this.db.query<ConsumptionRow>(
      `SELECT * FROM consumption_history
       WHERE product_id = ? AND date >= date('now', '-${days} days')
       ORDER BY date DESC`,
      [productId],
    );
    return rows.map(this.mapRowToConsumption);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ConsumptionHistory[]> {
    const rows = await this.db.query<ConsumptionRow>(
      `SELECT * FROM consumption_history
       WHERE date >= ? AND date <= ?
       ORDER BY date DESC`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    );
    return rows.map(this.mapRowToConsumption);
  }

  async getTotalConsumption(productId: string, days: number): Promise<number> {
    const result = await this.db.queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(quantity), 0) as total
       FROM consumption_history
       WHERE product_id = ? AND date >= date('now', '-${days} days')`,
      [productId],
    );
    return result?.total ?? 0;
  }

  async findByProductIdAndDateRange(
    productId: string,
    from: Date,
    to: Date,
  ): Promise<ConsumptionHistory[]> {
    const rows = await this.db.query<ConsumptionRow>(
      `SELECT * FROM consumption_history
       WHERE product_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC`,
      [productId, from.toISOString().split('T')[0], to.toISOString().split('T')[0]],
    );
    return rows.map(this.mapRowToConsumption);
  }

  async getDailyTotals(productId: string, days: number): Promise<DailyConsumption[]> {
    const rows = await this.db.query<ConsumptionRow>(
      `SELECT * FROM consumption_history
       WHERE product_id = ? AND date >= date('now', '-${days} days')
       ORDER BY date DESC`,
      [productId],
    );

    // Group by date
    const grouped = new Map<string, ConsumptionHistory[]>();

    for (const row of rows) {
      const date = row.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(this.mapRowToConsumption(row));
    }

    // Convert to DailyConsumption array
    const result: DailyConsumption[] = [];
    for (const [date, entries] of grouped) {
      const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);
      result.push({
        date,
        totalQuantity,
        entries,
      });
    }

    // Sort by date descending
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getProductsWithRecentActivity(days: number, limit = 20): Promise<string[]> {
    const rows = await this.db.query<{ product_id: string }>(
      `SELECT DISTINCT product_id FROM consumption_history
       WHERE date >= date('now', '-${days} days')
       ORDER BY date DESC
       LIMIT ?`,
      [limit],
    );
    return rows.map(r => r.product_id);
  }
}
