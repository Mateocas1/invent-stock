/**
 * Stock Service Implementation
 *
 * Core service for managing inventory stock operations.
 * Handles service registration, stock adjustments, and queries.
 */

import {
  StockService,
  StockUpdateResult,
  StockAdjustmentResult,
  ProductStock,
  ProductConsumption,
  StockAlert,
} from './StockService.types';
import { PredictionService } from './PredictionService.types';
import { AlertService, GeneratedAlert } from './AlertService.types';
import { DatabaseAdapter } from '../../infrastructure/database/adapters/DatabaseAdapter';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { ConsumptionRepository } from '../../domain/repositories/ConsumptionRepository';
import { Product } from '../../domain/entities/Product';
import { InventoryTransaction } from '../../domain/entities/InventoryTransaction';
import { ConsumptionHistory } from '../../domain/entities/ConsumptionHistory';
import {
  ServiceNotFoundError,
  ProductNotFoundError,
  InsufficientStockError,
  ValidationError,
} from '../errors/ApplicationErrors';

// Simple UUID generator since we don't have uuid installed
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export class StockServiceImpl implements StockService {
  constructor(
    private readonly db: DatabaseAdapter,
    private readonly productRepo: ProductRepository,
    private readonly serviceRepo: ServiceRepository,
    private readonly recipeRepo: RecipeRepository,
    _transactionRepo: TransactionRepository,
    _consumptionRepo: ConsumptionRepository,
    private readonly predictionService: PredictionService,
    private readonly alertService: AlertService,
  ) {}

  async registerService(
    serviceName: string,
    clientName?: string,
    adjustments?: Map<string, number>,
  ): Promise<StockUpdateResult> {
    // Validate service
    const service = await this.serviceRepo.findByName(serviceName);
    if (!service) {
      throw new ServiceNotFoundError(serviceName);
    }

    // Get recipe for the service
    const recipes = await this.recipeRepo.findByServiceId(service.id);
    if (recipes.length === 0) {
      throw new ValidationError(`No recipe found for service "${serviceName}"`);
    }

    // Build list of products to consume with quantities
    const productsToConsume: Array<{
      recipe: (typeof recipes)[0];
      quantity: number;
      product: Product;
    }> = [];

    for (const recipe of recipes) {
      // Check for adjustments
      let quantity = recipe.quantity;
      if (adjustments?.has(recipe.productName)) {
        const adjustment = adjustments.get(recipe.productName);
        if (adjustment !== undefined && adjustment >= 0) {
          quantity = adjustment;
        }
      }

      if (quantity <= 0) continue;

      const product = await this.productRepo.findById(recipe.productId);
      if (!product) {
        throw new ProductNotFoundError(recipe.productName);
      }

      productsToConsume.push({ recipe, quantity, product });
    }

    if (productsToConsume.length === 0) {
      throw new ValidationError('No products to consume');
    }

    // Verify sufficient stock for ALL products before starting transaction
    for (const { product, quantity, recipe } of productsToConsume) {
      if (product.currentStock < quantity) {
        throw new InsufficientStockError(recipe.productName, product.currentStock, quantity);
      }
    }

    // Execute atomic transaction
    return this.db.transaction(async tx => {
      // Create transaction-scoped repositories
      const txProductRepo = this.createProductRepoWithTx(tx);
      const txTransactionRepo = this.createTransactionRepoWithTx(tx);
      const txConsumptionRepo = this.createConsumptionRepoWithTx(tx);

      const consumed: ProductConsumption[] = [];
      const now = new Date();

      for (const { product, quantity, recipe } of productsToConsume) {
        const previousStock = product.currentStock;
        const newStock = previousStock - quantity;

        // Update product stock
        await txProductRepo.update(product.id, { currentStock: newStock });

        // Log transaction
        const transaction: InventoryTransaction = {
          id: generateId(),
          productId: product.id,
          type: 'consumption',
          previousStock,
          newStock,
          quantity: -quantity,
          reference: clientName ? `${serviceName} - ${clientName}` : serviceName,
          createdAt: now,
        };
        await txTransactionRepo.save(transaction);

        // Log consumption history
        const consumption: ConsumptionHistory = {
          id: generateId(),
          productId: product.id,
          serviceId: service.id,
          quantity,
          date: now,
          createdAt: now,
        };
        await txConsumptionRepo.save(consumption);

        consumed.push({
          productId: product.id,
          productName: recipe.productName,
          quantity,
          previousStock,
          newStock,
        });
      }

      // Check for low stock alerts
      const alerts = await this.checkForAlerts(tx, consumed);

      // Trigger alert service checks for each consumed product
      const generatedAlerts: GeneratedAlert[] = [];
      for (const item of consumed) {
        const productAlerts = await this.alertService.checkAndGenerateAlerts(item.productId);
        generatedAlerts.push(...productAlerts);
      }

      // Merge legacy alerts with new alert service alerts
      const allAlerts = [...alerts];
      for (const genAlert of generatedAlerts) {
        if (genAlert.type === 'low_stock' || genAlert.type === 'depletion_risk') {
          const exists = allAlerts.some(a => a.productId === genAlert.productId);
          if (!exists) {
            allAlerts.push({
              productId: genAlert.productId,
              productName: genAlert.productName,
              type: genAlert.type === 'low_stock' ? 'low_stock' : 'depleted',
              currentStock: 0,
              minThreshold: 0,
            });
          }
        }
      }

      return {
        success: true,
        serviceName: service.name,
        clientName,
        productsConsumed: consumed,
        alerts: allAlerts,
      };
    });
  }

  async adjustStock(
    productName: string,
    quantity: number,
    reason: string,
  ): Promise<StockAdjustmentResult> {
    if (quantity === 0) {
      throw new ValidationError('Quantity cannot be zero');
    }

    const product = await this.productRepo.findByName(productName);
    if (!product) {
      throw new ProductNotFoundError(productName);
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      throw new InsufficientStockError(productName, previousStock, Math.abs(quantity));
    }

    return this.db.transaction(async tx => {
      const txProductRepo = this.createProductRepoWithTx(tx);
      const txTransactionRepo = this.createTransactionRepoWithTx(tx);

      // Update product stock
      await txProductRepo.update(product.id, { currentStock: newStock });

      // Log transaction
      const transaction: InventoryTransaction = {
        id: generateId(),
        productId: product.id,
        type: quantity > 0 ? 'restock' : 'adjustment',
        previousStock,
        newStock,
        quantity,
        reference: reason,
        createdAt: new Date(),
      };
      await txTransactionRepo.save(transaction);

      // Trigger alert check for the product
      await this.alertService.checkAndGenerateAlerts(product.id);

      return {
        success: true,
        productId: product.id,
        productName: product.name,
        previousStock,
        newStock,
        quantity,
        reason,
      };
    });
  }

  async getStock(productName: string): Promise<ProductStock> {
    const product = await this.productRepo.findByName(productName);
    if (!product) {
      throw new ProductNotFoundError(productName);
    }

    return this.buildProductStock(product);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.productRepo.findLowStock();
  }

  async getAllStock(): Promise<ProductStock[]> {
    const products = await this.productRepo.findAll();
    return Promise.all(products.map(p => this.buildProductStock(p)));
  }

  async getStockWithPrediction(productName: string): Promise<ProductStock | null> {
    const product = await this.productRepo.findByName(productName);
    if (!product) {
      return null;
    }

    // Get prediction
    const prediction = await this.predictionService.calculateDepletion(product.id);

    let status: 'ok' | 'low' | 'critical' = 'ok';

    if (product.currentStock <= 0) {
      status = 'critical';
    } else if (product.currentStock <= product.minThreshold) {
      status = 'low';
    }

    return {
      product,
      status,
      daysRemaining: prediction?.daysUntilDepletion,
      prediction: prediction ?? undefined,
    };
  }

  private async buildProductStock(product: Product): Promise<ProductStock> {
    let status: 'ok' | 'low' | 'critical' = 'ok';

    if (product.currentStock <= 0) {
      status = 'critical';
    } else if (product.currentStock <= product.minThreshold) {
      status = 'low';
    }

    return {
      product,
      status,
    };
  }

  private async checkForAlerts(
    tx: DatabaseAdapter,
    consumed: ProductConsumption[],
  ): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];
    const txProductRepo = this.createProductRepoWithTx(tx);

    for (const item of consumed) {
      const product = await txProductRepo.findById(item.productId);
      if (!product) continue;

      if (product.currentStock <= 0) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          type: 'depleted',
          currentStock: 0,
          minThreshold: product.minThreshold,
        });
      } else if (product.currentStock <= product.minThreshold) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          type: 'low_stock',
          currentStock: product.currentStock,
          minThreshold: product.minThreshold,
        });
      }
    }

    return alerts;
  }

  // Helper methods to create transaction-scoped repositories
  private createProductRepoWithTx(tx: DatabaseAdapter): ProductRepository {
    // Import dynamically to avoid circular dependency
    const {
      SQLiteProductRepository,
    } = require('../../infrastructure/repositories/SQLiteProductRepository');
    return new SQLiteProductRepository(tx);
  }

  private createTransactionRepoWithTx(tx: DatabaseAdapter): TransactionRepository {
    const {
      SQLiteTransactionRepository,
    } = require('../../infrastructure/repositories/SQLiteTransactionRepository');
    return new SQLiteTransactionRepository(tx);
  }

  private createConsumptionRepoWithTx(tx: DatabaseAdapter): ConsumptionRepository {
    const {
      SQLiteConsumptionRepository,
    } = require('../../infrastructure/repositories/SQLiteConsumptionRepository');
    return new SQLiteConsumptionRepository(tx);
  }
}
