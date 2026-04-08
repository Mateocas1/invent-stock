/**
 * Prediction Engine
 *
 * Core algorithms for stock depletion prediction.
 * Implements moving average and linear regression calculations.
 */

export interface DataPoint {
  x: number; // day index (0, 1, 2, ...)
  y: number; // consumption value
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
}

export interface MovingAverageResult {
  average: number;
  window: number;
  dataPoints: number;
}

export interface StandardDeviationResult {
  mean: number;
  stdDev: number;
  dataPoints: number;
}

export class PredictionEngine {
  /**
   * Calculate moving average over a window of data.
   * If insufficient data, uses all available data.
   */
  static calculateMovingAverage(data: number[], window: number): MovingAverageResult {
    if (data.length === 0) {
      return { average: 0, window, dataPoints: 0 };
    }

    // If less data than window, use all available data
    const effectiveWindow = Math.min(window, data.length);
    const recent = data.slice(-effectiveWindow);
    const sum = recent.reduce((a, b) => a + b, 0);
    const average = sum / recent.length;

    return {
      average,
      window: effectiveWindow,
      dataPoints: data.length,
    };
  }

  /**
   * Calculate linear regression for trend analysis.
   * Returns slope and intercept for the line y = slope * x + intercept
   */
  static calculateLinearRegression(data: DataPoint[]): LinearRegressionResult {
    const n = data.length;

    if (n < 2) {
      // Not enough data for regression, return flat line
      return { slope: 0, intercept: n === 1 ? data[0]!.y : 0 };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
    }

    const denominator = n * sumX2 - sumX * sumX;

    if (denominator === 0) {
      // All x values are the same, return flat line at mean y
      return { slope: 0, intercept: sumY / n };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate standard deviation of data.
   */
  static calculateStandardDeviation(data: number[]): StandardDeviationResult {
    if (data.length === 0) {
      return { mean: 0, stdDev: 0, dataPoints: 0 };
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    if (data.length === 1) {
      return { mean, stdDev: 0, dataPoints: 1 };
    }

    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, dataPoints: data.length };
  }

  /**
   * Determine confidence level based on data points and trend stability.
   * - high: ≥14 data points with stable trend
   * - medium: 7-13 data points
   * - low: <7 data points
   */
  static determineConfidenceLevel(dataPoints: number, slope?: number): 'high' | 'medium' | 'low' {
    if (dataPoints >= 14) {
      // Check trend stability for high confidence
      if (slope !== undefined) {
        // A slope that indicates high variance might reduce confidence
        // For now, just having 14+ points gives high confidence
        return 'high';
      }
      return 'high';
    }

    if (dataPoints >= 7) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate daily consumption adjusted by trend.
   * If trend is increasing, consumption will be higher.
   * If trend is decreasing, consumption will be lower.
   */
  static calculateAdjustedDailyConsumption(
    movingAverage: number,
    slope: number,
    daysToProject: number = 7,
  ): number {
    // Apply trend adjustment to the moving average
    // Slope is consumption change per day
    // We project the trend forward and average it
    const projectedChange = slope * daysToProject;
    const adjustedAverage = movingAverage + projectedChange / 2;

    // Ensure we don't return negative or zero consumption
    return Math.max(adjustedAverage, 0.01);
  }

  /**
   * Estimate days until stock depletion.
   */
  static estimateDaysUntilDepletion(currentStock: number, dailyConsumption: number): number {
    if (dailyConsumption <= 0) {
      return Infinity;
    }

    return Math.floor(currentStock / dailyConsumption);
  }

  /**
   * Calculate estimated depletion date.
   */
  static calculateDepletionDate(daysUntilDepletion: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysUntilDepletion);
    return date;
  }

  /**
   * Detect if a consumption value is an anomaly.
   * Returns true if consumption is >= average + 20%
   */
  static isAnomaly(
    consumption: number,
    averageConsumption: number,
    threshold: number = 0.2,
  ): boolean {
    if (averageConsumption <= 0) {
      return false;
    }

    const deviation = (consumption - averageConsumption) / averageConsumption;
    return deviation >= threshold;
  }

  /**
   * Calculate the deviation percentage from average.
   */
  static calculateDeviation(consumption: number, averageConsumption: number): number {
    if (averageConsumption <= 0) {
      return 0;
    }

    return ((consumption - averageConsumption) / averageConsumption) * 100;
  }
}
