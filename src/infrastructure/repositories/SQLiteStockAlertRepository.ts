/**
 * SQLite Stock Alert Repository
 *
 * Implementation of StockAlertRepository using SQLite.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { StockAlert, AlertWithProduct } from '../../domain/entities/StockAlert';
import { StockAlertRepository } from '../../domain/repositories/StockAlertRepository';

interface AlertRow {
  id: string;
  product_id: string;
  type: string;
  severity: string;
  message: string;
  acknowledged: number;
  created_at: string;
}

interface AlertWithProductRow extends AlertRow {
  product_name: string;
  current_stock: number;
  min_threshold: number;
}

export class SQLiteStockAlertRepository implements StockAlertRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToAlert(row: AlertRow): StockAlert {
    return {
      id: row.id,
      productId: row.product_id,
      type: row.type as StockAlert['type'],
      severity: row.severity as StockAlert['severity'],
      message: row.message,
      acknowledged: Boolean(row.acknowledged),
      createdAt: new Date(row.created_at),
    };
  }

  private mapRowToAlertWithProduct(row: AlertWithProductRow): AlertWithProduct {
    return {
      id: row.id,
      productId: row.product_id,
      type: row.type as StockAlert['type'],
      severity: row.severity as StockAlert['severity'],
      message: row.message,
      acknowledged: Boolean(row.acknowledged),
      createdAt: new Date(row.created_at),
      productName: row.product_name,
      currentStock: row.current_stock,
      minThreshold: row.min_threshold,
    };
  }

  async save(alert: StockAlert): Promise<void> {
    await this.db.execute(
      `INSERT INTO stock_alerts (id, product_id, type, severity, message, acknowledged, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        alert.id,
        alert.productId,
        alert.type,
        alert.severity,
        alert.message,
        alert.acknowledged ? 1 : 0,
        alert.createdAt.toISOString(),
      ],
    );
  }

  async findUnacknowledged(): Promise<AlertWithProduct[]> {
    const rows = await this.db.query<AlertWithProductRow>(
      `SELECT a.*, p.name as product_name, p.current_stock, p.min_threshold
       FROM stock_alerts a
       JOIN products p ON a.product_id = p.id
       WHERE a.acknowledged = 0
       ORDER BY 
         CASE a.severity
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END,
         a.created_at DESC`,
    );
    return rows.map(this.mapRowToAlertWithProduct);
  }

  async findByProductId(productId: string): Promise<StockAlert[]> {
    const rows = await this.db.query<AlertRow>(
      'SELECT * FROM stock_alerts WHERE product_id = ? ORDER BY created_at DESC',
      [productId],
    );
    return rows.map(this.mapRowToAlert);
  }

  async acknowledge(alertId: string): Promise<void> {
    await this.db.execute('UPDATE stock_alerts SET acknowledged = 1 WHERE id = ?', [alertId]);
  }

  async deleteOldAcknowledged(olderThanDays: number): Promise<void> {
    await this.db.execute(
      `DELETE FROM stock_alerts
       WHERE acknowledged = 1 AND created_at < datetime('now', '-${olderThanDays} days')`,
    );
  }
}
