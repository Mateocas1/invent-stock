/**
 * Schema Migration
 *
 * Initial database schema for invent-stock.
 * Creates all 6 tables with indexes and constraints.
 */

import { Migration } from './MigrationRunner';

export const schemaMigrations: Migration[] = [
  {
    id: '001_create_products_table',
    name: 'Create products table',
    timestamp: 1712582400000,
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('unidades', 'ml', 'g', 'gotas')),
        unit TEXT NOT NULL CHECK(unit IN ('unidad', 'ml', 'g', 'gota')),
        current_stock REAL NOT NULL DEFAULT 0,
        min_threshold REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock);
    `,
  },
  {
    id: '002_create_services_table',
    name: 'Create services table',
    timestamp: 1712582460000,
    sql: `
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
      CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
    `,
  },
  {
    id: '003_create_recipes_table',
    name: 'Create recipes table',
    timestamp: 1712582520000,
    sql: `
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        service_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(service_id, product_id)
      );

      CREATE INDEX IF NOT EXISTS idx_recipes_service_id ON recipes(service_id);
      CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id);
    `,
  },
  {
    id: '004_create_inventory_transactions_table',
    name: 'Create inventory transactions table',
    timestamp: 1712582580000,
    sql: `
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('consumption', 'adjustment', 'restock')),
        previous_stock REAL NOT NULL,
        new_stock REAL NOT NULL,
        quantity REAL NOT NULL,
        reference TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON inventory_transactions(product_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON inventory_transactions(created_at);
    `,
  },
  {
    id: '005_create_consumption_history_table',
    name: 'Create consumption history table',
    timestamp: 1712582640000,
    sql: `
      CREATE TABLE IF NOT EXISTS consumption_history (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        service_id TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        date TEXT NOT NULL DEFAULT (date('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      );

      CREATE INDEX IF NOT EXISTS idx_consumption_product_id ON consumption_history(product_id);
      CREATE INDEX IF NOT EXISTS idx_consumption_service_id ON consumption_history(service_id);
      CREATE INDEX IF NOT EXISTS idx_consumption_date ON consumption_history(date);
    `,
  },
  {
    id: '006_create_stock_alerts_table',
    name: 'Create stock alerts table',
    timestamp: 1712582700000,
    sql: `
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('low_stock', 'depletion_risk', 'anomaly')),
        severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
        message TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON stock_alerts(product_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_type ON stock_alerts(type);
      CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON stock_alerts(acknowledged);
      CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON stock_alerts(created_at);
    `,
  },
];
