/**
 * Stock Service Types
 *
 * Type definitions for the StockService.
 */

import { Product } from '../../domain/entities/Product';
import { PredictionResult } from './PredictionService.types';

export interface ProductStock {
  product: Product;
  status: 'ok' | 'low' | 'critical';
  daysRemaining?: number;
  prediction?: PredictionResult;
}

export interface StockUpdateResult {
  success: boolean;
  serviceName: string;
  clientName?: string;
  productsConsumed: ProductConsumption[];
  alerts: StockAlert[];
}

export interface ProductConsumption {
  productId: string;
  productName: string;
  quantity: number;
  previousStock: number;
  newStock: number;
}

export interface StockAlert {
  productId: string;
  productName: string;
  type: 'low_stock' | 'depleted';
  currentStock: number;
  minThreshold: number;
}

export interface StockAdjustmentResult {
  success: boolean;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  quantity: number;
  reason?: string;
}

export interface StockService {
  /**
   * Register a service being performed.
   * Deducts stock for all products in the service's recipe.
   * Uses atomic transactions - all products deducted or none.
   */
  registerService(
    serviceName: string,
    clientName?: string,
    adjustments?: Map<string, number>,
  ): Promise<StockUpdateResult>;

  /**
   * Adjust stock for a product directly.
   */
  adjustStock(
    productName: string,
    quantity: number,
    reason: string,
  ): Promise<StockAdjustmentResult>;

  /**
   * Get current stock for a product.
   */
  getStock(productName: string): Promise<ProductStock>;

  /**
   * Get all products with low stock.
   */
  getLowStockProducts(): Promise<Product[]>;

  /**
   * Get stock status for all products.
   */
  getAllStock(): Promise<ProductStock[]>;

  /**
   * Get stock with prediction for a product.
   */
  getStockWithPrediction(productName: string): Promise<ProductStock | null>;
}
