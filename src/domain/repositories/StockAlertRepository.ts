/**
 * Stock Alert Repository Interface
 *
 * Defines the contract for stock alert data access.
 */

import { StockAlert, AlertWithProduct } from '../entities/StockAlert';

export interface StockAlertRepository {
  /**
   * Save a new alert.
   */
  save(alert: StockAlert): Promise<void>;

  /**
   * Find unacknowledged alerts.
   */
  findUnacknowledged(): Promise<AlertWithProduct[]>;

  /**
   * Find alerts by product ID.
   */
  findByProductId(productId: string): Promise<StockAlert[]>;

  /**
   * Acknowledge an alert.
   */
  acknowledge(alertId: string): Promise<void>;

  /**
   * Delete old acknowledged alerts.
   * @param olderThanDays - Delete alerts acknowledged more than this many days ago
   */
  deleteOldAcknowledged(olderThanDays: number): Promise<void>;
}
