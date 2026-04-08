/**
 * Alert Service Implementation
 *
 * Service for managing stock alerts.
 * Generates alerts based on thresholds, predictions, and anomalies.
 */

import { AlertService, GeneratedAlert, AlertSeverity } from './AlertService.types';
import { PredictionService } from './PredictionService.types';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { StockAlertRepository } from '../../domain/repositories/StockAlertRepository';
import { StockAlert } from '../../domain/entities/StockAlert';

// Simple UUID generator
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export class AlertServiceImpl implements AlertService {
  // Configuration
  private readonly DEPLETION_RISK_DAYS = 7; // Alert if stock runs out within 7 days

  constructor(
    private readonly productRepo: ProductRepository,
    private readonly alertRepo: StockAlertRepository,
    private readonly predictionService: PredictionService,
  ) {}

  async checkAndGenerateAlerts(productId: string): Promise<GeneratedAlert[]> {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      return [];
    }

    const generatedAlerts: GeneratedAlert[] = [];

    // Check 1: Low stock threshold
    if (product.currentStock <= product.minThreshold) {
      const severity = product.currentStock === 0 ? 'high' : 'medium';
      const message =
        product.currentStock === 0
          ? `🚨 ${product.name}: STOCK AGOTADO (0 ${product.unit})`
          : `⚠️ ${product.name}: Stock bajo (${product.currentStock}/${product.minThreshold} ${product.unit})`;

      generatedAlerts.push({
        productId,
        productName: product.name,
        type: 'low_stock',
        severity,
        message,
      });
    }

    // Check 2: Depletion risk (prediction-based)
    const prediction = await this.predictionService.calculateDepletion(productId);
    if (prediction && prediction.daysUntilDepletion <= this.DEPLETION_RISK_DAYS) {
      const severity: AlertSeverity =
        prediction.daysUntilDepletion <= 3
          ? 'high'
          : prediction.daysUntilDepletion <= 5
            ? 'medium'
            : 'low';

      const daysText =
        prediction.daysUntilDepletion === 0
          ? 'hoy'
          : prediction.daysUntilDepletion === 1
            ? 'mañana'
            : `en ${prediction.daysUntilDepletion} días`;

      const message = `⏰ ${product.name}: Se agotará ${daysText} (${prediction.confidence} confianza)`;

      generatedAlerts.push({
        productId,
        productName: product.name,
        type: 'depletion_risk',
        severity,
        message,
      });
    }

    // Check 3: Anomaly detection
    const anomalies = await this.predictionService.detectAnomalies(productId);
    if (anomalies.length > 0) {
      // Get the most recent anomaly
      const recentAnomaly = anomalies[anomalies.length - 1];
      if (recentAnomaly) {
        const deviationText = recentAnomaly.deviation.toFixed(0);
        const message = `📈 ${product.name}: Consumo anómalo detectado (+${deviationText}% sobre el promedio)`;

        generatedAlerts.push({
          productId,
          productName: product.name,
          type: 'anomaly',
          severity: 'medium',
          message,
        });
      }
    }

    // Persist alerts to database (deduplication)
    await this.persistAlerts(generatedAlerts);

    return generatedAlerts;
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    const alerts = await this.alertRepo.findUnacknowledged();
    return alerts.map(a => ({
      id: a.id,
      productId: a.productId,
      type: a.type,
      severity: a.severity,
      message: a.message,
      acknowledged: a.acknowledged,
      createdAt: a.createdAt,
    }));
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.alertRepo.acknowledge(alertId);
  }

  async checkAllProducts(): Promise<GeneratedAlert[]> {
    const products = await this.productRepo.findAll();
    const allAlerts: GeneratedAlert[] = [];

    for (const product of products) {
      const alerts = await this.checkAndGenerateAlerts(product.id);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  /**
   * Persist alerts to database with deduplication.
   * Only creates one active alert per (productId, type) pair.
   */
  private async persistAlerts(alerts: GeneratedAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Check if there's already an unacknowledged alert for this product and type
      const existingAlerts = await this.alertRepo.findByProductId(alert.productId);
      const hasActiveAlert = existingAlerts.some(a => a.type === alert.type && !a.acknowledged);

      if (!hasActiveAlert) {
        // Create new alert
        const newAlert: StockAlert = {
          id: generateId(),
          productId: alert.productId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          acknowledged: false,
          createdAt: new Date(),
        };

        await this.alertRepo.save(newAlert);
      }
    }
  }
}
