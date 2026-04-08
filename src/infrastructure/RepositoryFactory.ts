/**
 * Repository Factory
 *
 * Creates appropriate repositories based on database type.
 */

import { DatabaseAdapter } from './database/adapters/DatabaseAdapter';
import { ProductRepository } from '../domain/repositories/ProductRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { RecipeRepository } from '../domain/repositories/RecipeRepository';
import { TransactionRepository } from '../domain/repositories/TransactionRepository';
import { ConsumptionRepository } from '../domain/repositories/ConsumptionRepository';
import { StockAlertRepository } from '../domain/repositories/StockAlertRepository';

import {
  SQLiteProductRepository,
  SQLiteServiceRepository,
  SQLiteRecipeRepository,
  SQLiteTransactionRepository,
  SQLiteConsumptionRepository,
  SQLiteStockAlertRepository,
} from './repositories';

import {
  PostgreSQLProductRepository,
  PostgreSQLServiceRepository,
  PostgreSQLRecipeRepository,
  PostgreSQLTransactionRepository,
  PostgreSQLConsumptionRepository,
  PostgreSQLStockAlertRepository,
} from './repositories';

export interface Repositories {
  product: ProductRepository;
  service: ServiceRepository;
  recipe: RecipeRepository;
  transaction: TransactionRepository;
  consumption: ConsumptionRepository;
  alert: StockAlertRepository;
}

export function createRepositories(
  db: DatabaseAdapter,
  dbType: 'sqlite' | 'postgresql',
): Repositories {
  if (dbType === 'postgresql') {
    return {
      product: new PostgreSQLProductRepository(db),
      service: new PostgreSQLServiceRepository(db),
      recipe: new PostgreSQLRecipeRepository(db),
      transaction: new PostgreSQLTransactionRepository(db),
      consumption: new PostgreSQLConsumptionRepository(db),
      alert: new PostgreSQLStockAlertRepository(db),
    };
  }

  return {
    product: new SQLiteProductRepository(db),
    service: new SQLiteServiceRepository(db),
    recipe: new SQLiteRecipeRepository(db),
    transaction: new SQLiteTransactionRepository(db),
    consumption: new SQLiteConsumptionRepository(db),
    alert: new SQLiteStockAlertRepository(db),
  };
}
