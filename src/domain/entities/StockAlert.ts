/**
 * Stock Alert Entity
 *
 * Alerts for low stock, depletion risk, or anomalies.
 */

export type AlertType = 'low_stock' | 'depletion_risk' | 'anomaly';
export type AlertSeverity = 'high' | 'medium' | 'low';

export interface StockAlert {
  id: string;
  productId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  createdAt: Date;
}

export interface CreateAlertInput {
  productId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
}

export interface AlertWithProduct extends StockAlert {
  productName: string;
  currentStock: number;
  minThreshold: number;
}
