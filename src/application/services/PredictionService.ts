/**
 * Prediction Service Implementation
 *
 * Service for calculating stock depletion predictions.
 * Uses PredictionEngine for mathematical calculations.
 */

import {
  PredictionService,
  PredictionResult,
  AnomalyResult,
  TrendResult,
} from './PredictionService.types';
import { PredictionEngine, DataPoint } from './PredictionEngine';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ConsumptionRepository } from '../../domain/repositories/ConsumptionRepository';
import { ConsumptionHistory } from '../../domain/entities/ConsumptionHistory';

export class PredictionServiceImpl implements PredictionService {
  // Configuration
  private readonly PREDICTION_DAYS = 30; // Look back 30 days
  private readonly MOVING_AVERAGE_WINDOW = 7; // 7-day moving average
  private readonly ANOMALY_THRESHOLD = 0.2; // 20% deviation

  constructor(
    private readonly productRepo: ProductRepository,
    private readonly consumptionRepo: ConsumptionRepository,
  ) {}

  async calculateDepletion(productId: string): Promise<PredictionResult | null> {
    // Get product
    const product = await this.productRepo.findById(productId);
    if (!product) {
      return null;
    }

    // Get consumption history
    const consumptionHistory = await this.consumptionRepo.findByProductId(
      productId,
      this.PREDICTION_DAYS,
    );

    // Aggregate consumption by day
    const dailyConsumption = this.aggregateConsumptionByDay(consumptionHistory);

    if (dailyConsumption.length === 0) {
      // No consumption data, can't predict
      return {
        productId,
        currentStock: product.currentStock,
        dailyConsumption: 0,
        daysUntilDepletion: Infinity,
        estimatedDepletionDate: new Date('2099-12-31'), // Far future
        confidence: 'low',
        dataPoints: 0,
        trendSlope: 0,
      };
    }

    // Calculate moving average
    const consumptionValues = dailyConsumption.map(d => d.consumption);
    const movingAvgResult = PredictionEngine.calculateMovingAverage(
      consumptionValues,
      this.MOVING_AVERAGE_WINDOW,
    );

    // Prepare data for linear regression
    const regressionData: DataPoint[] = dailyConsumption.map((d, index) => ({
      x: index,
      y: d.consumption,
    }));

    // Calculate linear regression
    const regressionResult = PredictionEngine.calculateLinearRegression(regressionData);

    // Calculate adjusted daily consumption
    const adjustedDailyConsumption = PredictionEngine.calculateAdjustedDailyConsumption(
      movingAvgResult.average,
      regressionResult.slope,
      this.MOVING_AVERAGE_WINDOW,
    );

    // Calculate days until depletion
    const daysUntilDepletion = PredictionEngine.estimateDaysUntilDepletion(
      product.currentStock,
      adjustedDailyConsumption,
    );

    // Calculate depletion date
    const estimatedDepletionDate =
      daysUntilDepletion === Infinity
        ? new Date('2099-12-31')
        : PredictionEngine.calculateDepletionDate(daysUntilDepletion);

    // Determine confidence level
    const confidence = PredictionEngine.determineConfidenceLevel(
      dailyConsumption.length,
      regressionResult.slope,
    );

    return {
      productId,
      currentStock: product.currentStock,
      dailyConsumption: adjustedDailyConsumption,
      daysUntilDepletion,
      estimatedDepletionDate,
      confidence,
      dataPoints: dailyConsumption.length,
      trendSlope: regressionResult.slope,
    };
  }

  async detectAnomalies(productId: string): Promise<AnomalyResult[]> {
    // Get consumption history
    const consumptionHistory = await this.consumptionRepo.findByProductId(
      productId,
      this.PREDICTION_DAYS,
    );

    if (consumptionHistory.length === 0) {
      return [];
    }

    // Aggregate consumption by day
    const dailyConsumption = this.aggregateConsumptionByDay(consumptionHistory);

    if (dailyConsumption.length < 2) {
      return []; // Need at least 2 days to detect anomalies
    }

    // Calculate moving average
    const consumptionValues = dailyConsumption.map(d => d.consumption);
    const movingAvgResult = PredictionEngine.calculateMovingAverage(
      consumptionValues,
      this.MOVING_AVERAGE_WINDOW,
    );

    // Detect anomalies
    const anomalies: AnomalyResult[] = [];

    for (const day of dailyConsumption) {
      if (
        PredictionEngine.isAnomaly(day.consumption, movingAvgResult.average, this.ANOMALY_THRESHOLD)
      ) {
        const deviation = PredictionEngine.calculateDeviation(
          day.consumption,
          movingAvgResult.average,
        );

        anomalies.push({
          productId,
          date: day.date,
          consumption: day.consumption,
          averageConsumption: movingAvgResult.average,
          deviation,
        });
      }
    }

    return anomalies;
  }

  async getTrend(productId: string, days?: number): Promise<TrendResult | null> {
    const lookbackDays = days ?? this.PREDICTION_DAYS;

    // Get consumption history
    const consumptionHistory = await this.consumptionRepo.findByProductId(productId, lookbackDays);

    if (consumptionHistory.length === 0) {
      return null;
    }

    // Aggregate consumption by day
    const dailyConsumption = this.aggregateConsumptionByDay(consumptionHistory);

    if (dailyConsumption.length < 2) {
      return {
        productId,
        dataPoints: dailyConsumption.length,
        slope: 0,
        dailyAverage: dailyConsumption[0]?.consumption ?? 0,
        trendDirection: 'stable',
      };
    }

    // Prepare data for linear regression
    const regressionData: DataPoint[] = dailyConsumption.map((d, index) => ({
      x: index,
      y: d.consumption,
    }));

    // Calculate linear regression
    const regressionResult = PredictionEngine.calculateLinearRegression(regressionData);

    // Calculate daily average
    const consumptionValues = dailyConsumption.map(d => d.consumption);
    const movingAvgResult = PredictionEngine.calculateMovingAverage(
      consumptionValues,
      this.MOVING_AVERAGE_WINDOW,
    );

    // Determine trend direction
    let trendDirection: 'increasing' | 'decreasing' | 'stable';
    const slopeThreshold = 0.01; // Threshold for considering trend significant

    if (Math.abs(regressionResult.slope) < slopeThreshold) {
      trendDirection = 'stable';
    } else if (regressionResult.slope > 0) {
      trendDirection = 'increasing';
    } else {
      trendDirection = 'decreasing';
    }

    return {
      productId,
      dataPoints: dailyConsumption.length,
      slope: regressionResult.slope,
      dailyAverage: movingAvgResult.average,
      trendDirection,
    };
  }

  /**
   * Aggregate consumption history by day.
   * Returns array of { date, consumption } for each day with consumption.
   */
  private aggregateConsumptionByDay(
    history: ConsumptionHistory[],
  ): Array<{ date: Date; consumption: number }> {
    // Group by date string (YYYY-MM-DD)
    const byDay = new Map<string, number>();

    for (const entry of history) {
      const dateStr = entry.date.toISOString().split('T')[0];
      const current = byDay.get(dateStr) ?? 0;
      byDay.set(dateStr, current + entry.quantity);
    }

    // Convert to array and sort by date
    const result: Array<{ date: Date; consumption: number }> = [];

    for (const [dateStr, consumption] of byDay) {
      result.push({
        date: new Date(dateStr),
        consumption,
      });
    }

    // Sort by date ascending
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  }
}
