/**
 * PostgreSQL Transaction Repository
 *
 * Implementation of TransactionRepository using PostgreSQL.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { InventoryTransaction, TransactionType } from '../../domain/entities/InventoryTransaction';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';

interface TransactionRow {
  id: string;
  product_id: string;
  type: TransactionType;
  previous_stock: number;
  new_stock: number;
  quantity: number;
  reference: string | null;
  created_at: string;
}

export class PostgreSQLTransactionRepository implements TransactionRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToTransaction(row: TransactionRow): InventoryTransaction {
    return {
      id: row.id,
      productId: row.product_id,
      type: row.type,
      previousStock: row.previous_stock,
      newStock: row.new_stock,
      quantity: row.quantity,
      reference: row.reference ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }

  async save(transaction: InventoryTransaction): Promise<void> {
    await this.db.execute(
      `INSERT INTO inventory_transactions (id, product_id, type, previous_stock, new_stock, quantity, reference, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        transaction.id,
        transaction.productId,
        transaction.type,
        transaction.previousStock,
        transaction.newStock,
        transaction.quantity,
        transaction.reference ?? null,
        transaction.createdAt.toISOString(),
      ],
    );
  }

  async findByProductId(productId: string, limit = 50): Promise<InventoryTransaction[]> {
    const rows = await this.db.query<TransactionRow>(
      `SELECT * FROM inventory_transactions
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [productId, limit],
    );
    return rows.map(this.mapRowToTransaction);
  }

  async findRecent(limit = 50): Promise<InventoryTransaction[]> {
    const rows = await this.db.query<TransactionRow>(
      `SELECT * FROM inventory_transactions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map(this.mapRowToTransaction);
  }

  async findByProductIdAndDateRange(
    productId: string,
    from: Date,
    to: Date,
  ): Promise<InventoryTransaction[]> {
    const rows = await this.db.query<TransactionRow>(
      `SELECT * FROM inventory_transactions
       WHERE product_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC`,
      [productId, from.toISOString(), to.toISOString()],
    );
    return rows.map(this.mapRowToTransaction);
  }
}
