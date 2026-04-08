/**
 * Infrastructure Repositories Index
 *
 * Export all repository implementations.
 */

// SQLite repositories
export * from './SQLiteProductRepository';
export * from './SQLiteServiceRepository';
export * from './SQLiteRecipeRepository';
export * from './SQLiteTransactionRepository';
export * from './SQLiteConsumptionRepository';
export * from './SQLiteStockAlertRepository';

// PostgreSQL repositories
export * from './PostgreSQLProductRepository';
export * from './PostgreSQLServiceRepository';
export * from './PostgreSQLRecipeRepository';
export * from './PostgreSQLTransactionRepository';
export * from './PostgreSQLConsumptionRepository';
export * from './PostgreSQLStockAlertRepository';
