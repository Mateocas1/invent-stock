/**
 * Transaction Repository Interface
 *
 * Defines the contract for inventory transaction data access.
 */

import { InventoryTransaction } from '../entities/InventoryTransaction';

export interface TransactionRepository {
  /**
   * Save a new transaction.
   */
  save(transaction: InventoryTransaction): Promise<void>;

  /**
   * Find transactions by product ID.
   * @param productId - The product ID
   * @param limit - Maximum number of transactions to return
   */
  findByProductId(productId: string, limit?: number): Promise<InventoryTransaction[]>;

  /**
   * Find recent transactions across all products.
   * @param limit - Maximum number of transactions to return
   */
  findRecent(limit?: number): Promise<InventoryTransaction[]>;

  /**
   * Find transactions by product ID and date range.
   * @param productId - The product ID
   * @param from - Start date
   * @param to - End date
   */
  findByProductIdAndDateRange(
    productId: string,
    from: Date,
    to: Date,
  ): Promise<InventoryTransaction[]>;
}
