/**
 * Consumption Repository Interface
 *
 * Defines the contract for consumption history data access.
 */

import { ConsumptionHistory } from '../entities/ConsumptionHistory';

export interface DailyConsumption {
  date: string;
  totalQuantity: number;
  entries: ConsumptionHistory[];
}

export interface ConsumptionRepository {
  /**
   * Save a new consumption entry.
   */
  save(entry: ConsumptionHistory): Promise<void>;

  /**
   * Find consumption entries by product ID.
   * @param productId - The product ID
   * @param days - Number of days to look back
   */
  findByProductId(productId: string, days: number): Promise<ConsumptionHistory[]>;

  /**
   * Find consumption entries by product ID and date range.
   * @param productId - The product ID
   * @param from - Start date
   * @param to - End date
   */
  findByProductIdAndDateRange(
    productId: string,
    from: Date,
    to: Date,
  ): Promise<ConsumptionHistory[]>;

  /**
   * Find consumption entries by date range.
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<ConsumptionHistory[]>;

  /**
   * Get total consumption by product in the last N days.
   */
  getTotalConsumption(productId: string, days: number): Promise<number>;

  /**
   * Get daily consumption totals grouped by date.
   * @param productId - The product ID
   * @param days - Number of days to look back
   */
  getDailyTotals(productId: string, days: number): Promise<DailyConsumption[]>;

  /**
   * Get products with recent activity.
   * @param days - Number of days to look back
   * @param limit - Maximum number of products to return
   */
  getProductsWithRecentActivity(days: number, limit?: number): Promise<string[]>;
}
