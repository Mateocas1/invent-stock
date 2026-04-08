/**
 * Prediction Service Types
 *
 * Type definitions for the PredictionService.
 */

export interface PredictionResult {
  productId: string;
  currentStock: number;
  dailyConsumption: number;
  daysUntilDepletion: number;
  estimatedDepletionDate: Date;
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  trendSlope: number;
}

export interface AnomalyResult {
  productId: string;
  date: Date;
  consumption: number;
  averageConsumption: number;
  deviation: number; // percentage
}

export interface TrendResult {
  productId: string;
  dataPoints: number;
  slope: number;
  dailyAverage: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface PredictionService {
  /**
   * Calculate depletion prediction for a product.
   * Returns prediction with days until stock runs out.
   */
  calculateDepletion(productId: string): Promise<PredictionResult | null>;

  /**
   * Detect anomalies in consumption patterns.
   * Returns list of anomalous consumption events.
   */
  detectAnomalies(productId: string): Promise<AnomalyResult[]>;

  /**
   * Get consumption trend for a product.
   */
  getTrend(productId: string, days?: number): Promise<TrendResult | null>;
}
