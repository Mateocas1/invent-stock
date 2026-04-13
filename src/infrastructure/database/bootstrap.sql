-- =============================================================================
-- InventStock Bootstrap SQL for Railway PostgreSQL
-- =============================================================================
-- This file is used by FailsafeMigrator when Railway PG is completely empty.
-- It creates all tables and seeds initial data in ONE transaction.
-- =============================================================================

-- Migration tracking table for failsafe
CREATE TABLE IF NOT EXISTS _migrations_failsafe (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert failsafe migration record
INSERT INTO _migrations_failsafe (id, name) VALUES
  ('failsafe_bootstrap', 'Initial bootstrap from bootstrap.sql')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SCHEMA TABLES
-- =============================================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('unidades', 'ml', 'g', 'gotas')),
  unit TEXT NOT NULL CHECK(unit IN ('unidad', 'ml', 'g', 'gota')),
  current_stock REAL NOT NULL DEFAULT 0,
  min_threshold REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Recipes table
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

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('consumption', 'adjustment', 'restock')),
  previous_stock REAL NOT NULL,
  new_stock REAL NOT NULL,
  quantity REAL NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON inventory_transactions(created_at);

-- Consumption history table
CREATE TABLE IF NOT EXISTS consumption_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  service_id TEXT,
  quantity REAL NOT NULL CHECK(quantity > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_consumption_product_id ON consumption_history(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_service_id ON consumption_history(service_id);
CREATE INDEX IF NOT EXISTS idx_consumption_date ON consumption_history(date);

-- Stock alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('low_stock', 'depletion_risk', 'anomaly')),
  severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON stock_alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON stock_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON stock_alerts(created_at);

-- Standard migrations table (for future migrations)
CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert standard migrations as applied
INSERT INTO _migrations (id, name, timestamp) VALUES
  ('001_create_products_table', 'Create products table', 1712582400000),
  ('002_create_services_table', 'Create services table', 1712582460000),
  ('003_create_recipes_table', 'Create recipes table', 1712582520000),
  ('004_create_inventory_transactions_table', 'Create inventory transactions table', 1712582580000),
  ('005_create_consumption_history_table', 'Create consumption history table', 1712582640000),
  ('006_create_stock_alerts_table', 'Create stock alerts table', 1712582700000)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Products (real inventory from the salon)
INSERT INTO products (id, name, category, unit, current_stock, min_threshold) VALUES
  ('prod_reinforcement', 'reinforcement', 'ml', 'ml', 1, 0.3),
  ('prod_base', 'base', 'ml', 'ml', 1, 0.3),
  ('prod_top', 'top', 'ml', 'ml', 2, 0.5),
  ('prod_base_navi', 'base navi', 'ml', 'ml', 1, 0.3),
  ('prod_jewelry', 'jewelry', 'ml', 'ml', 1, 0.3),
  ('prod_gel_solido', 'gel solido', 'g', 'g', 1, 0.3),
  ('prod_ultrabond', 'ultrabond', 'ml', 'ml', 1, 0.3),
  ('prod_polygel', 'polygel', 'g', 'g', 1, 0.3),
  ('prod_city_70', 'city tono 70', 'ml', 'ml', 1, 0.3),
  ('prod_city_22', 'city tono 22', 'ml', 'ml', 1, 0.3),
  ('prod_palitos', 'palitos', 'unidades', 'unidad', 80, 20),
  ('prod_tips_almond_n6', 'tips almond n6', 'unidades', 'unidad', 1, 5),
  ('prod_papel_plata_oro', 'papel plata y oro', 'unidades', 'unidad', 0.25, 0.05),
  ('prod_removedor_cuvage', 'removedor cuvage', 'ml', 'ml', 5, 2),
  ('prod_barbijos', 'barbijos', 'unidades', 'unidad', 5, 2),
  ('prod_tips_coffin_n5', 'tips coffin n5', 'unidades', 'unidad', 1, 5),
  ('prod_tips_cuadrados_n5', 'tips cuadrados n5', 'unidades', 'unidad', 1, 5),
  ('prod_tips_coffin_n6', 'tips coffin n6', 'unidades', 'unidad', 1, 5),
  ('prod_brillito_nude_118', 'esmalte brillito nude 118', 'ml', 'ml', 1, 0.3),
  ('prod_brillito_nude_120', 'esmalte brillito nude 120', 'ml', 'ml', 1, 0.3),
  ('prod_cat_eye_halo', 'cat eye halo', 'ml', 'ml', 1, 0.3),
  ('prod_charm_gelatina_05', 'charm gelatina 05', 'g', 'g', 1, 0.3)
ON CONFLICT (id) DO NOTHING;

-- Services (only 3: semipermanente, capping, softgel)
INSERT INTO services (id, name, category) VALUES
  ('service_semipermanente', 'semipermanente', 'manicure'),
  ('service_capping', 'capping', 'manicure'),
  ('service_softgel', 'softgel', 'manicure')
ON CONFLICT (id) DO NOTHING;

-- Semipermanente recipe
INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
  (replace(gen_random_uuid()::text, '-', ''), 'service_semipermanente', 'prod_base', 0.3),
  (replace(gen_random_uuid()::text, '-', ''), 'service_semipermanente', 'prod_top', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_semipermanente', 'prod_palitos', 1),
  (replace(gen_random_uuid()::text, '-', ''), 'service_semipermanente', 'prod_barbijos', 0.1)
ON CONFLICT (service_id, product_id) DO NOTHING;

-- Capping recipe
INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_gel_solido', 0.5),
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_base', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_top', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_palitos', 1),
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_tips_coffin_n6', 1),
  (replace(gen_random_uuid()::text, '-', ''), 'service_capping', 'prod_barbijos', 0.1)
ON CONFLICT (service_id, product_id) DO NOTHING;

-- Softgel recipe
INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_tips_almond_n6', 1),
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_base_navi', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_reinforcement', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_top', 0.2),
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_palitos', 1),
  (replace(gen_random_uuid()::text, '-', ''), 'service_softgel', 'prod_barbijos', 0.1)
ON CONFLICT (service_id, product_id) DO NOTHING;

-- Seed migrations as applied
INSERT INTO _migrations (id, name, timestamp) VALUES
  ('seed_001_initial_data', 'Seed initial products and services', 1712583000000),
  ('seed_002_recipes', 'Seed service recipes', 1712583060000)
ON CONFLICT (id) DO NOTHING;
