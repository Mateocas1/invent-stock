/**
 * Alert Service Types
 *
 * Type definitions for the AlertService.
 */

import {
  StockAlert as StockAlertEntity,
  AlertType,
  AlertSeverity,
} from '../../domain/entities/StockAlert';

export { AlertType, AlertSeverity };
export type { StockAlertEntity };

export interface GeneratedAlert {
  productId: string;
  productName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
}

export interface AlertCheckResult {
  alerts: GeneratedAlert[];
  checkedAt: Date;
}

export interface AlertService {
  /**
   * Check for and generate alerts for a product.
   * Called after stock changes.
   */
  checkAndGenerateAlerts(productId: string): Promise<GeneratedAlert[]>;

  /**
   * Get all active (unacknowledged) alerts.
   */
  getActiveAlerts(): Promise<StockAlertEntity[]>;

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(alertId: string): Promise<void>;

  /**
   * Check all products for alerts.
   */
  checkAllProducts(): Promise<GeneratedAlert[]>;
}
