/**
 * Seed Data
 *
 * Initial data for nail salon inventory management.
 * Real products and services: semipermanente, capping y softgel.
 */

import { Migration } from '../migrations/MigrationRunner';

/**
 * Seed migration for initial data.
 */
export const seedMigrations: Migration[] = [
  {
    id: 'seed_001_initial_data',
    name: 'Seed initial products and services',
    timestamp: 1712583000000,
    sql: `
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
        ('prod_charm_gelatina_05', 'charm gelatina 05', 'g', 'g', 1, 0.3);

      -- Services (only 3: semipermanente, capping, softgel)
      INSERT INTO services (id, name, category) VALUES
        ('service_semipermanente', 'semipermanente', 'manicure'),
        ('service_capping', 'capping', 'manicure'),
        ('service_softgel', 'softgel', 'manicure');
    `,
  },
  {
    id: 'seed_002_recipes',
    name: 'Seed service recipes',
    timestamp: 1712583060000,
    sql: `
      -- Semipermanente recipe
      INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
        (lower(hex(randomblob(16))), 'service_semipermanente', 'prod_base', 0.3),
        (lower(hex(randomblob(16))), 'service_semipermanente', 'prod_top', 0.2),
        (lower(hex(randomblob(16))), 'service_semipermanente', 'prod_palitos', 1),
        (lower(hex(randomblob(16))), 'service_semipermanente', 'prod_barbijos', 0.1);

      -- Capping recipe
      INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
        (lower(hex(randomblob(16))), 'service_capping', 'prod_gel_solido', 0.5),
        (lower(hex(randomblob(16))), 'service_capping', 'prod_base', 0.2),
        (lower(hex(randomblob(16))), 'service_capping', 'prod_top', 0.2),
        (lower(hex(randomblob(16))), 'service_capping', 'prod_palitos', 1),
        (lower(hex(randomblob(16))), 'service_capping', 'prod_tips_coffin_n6', 1),
        (lower(hex(randomblob(16))), 'service_capping', 'prod_barbijos', 0.1);

      -- Softgel recipe
      INSERT INTO recipes (id, service_id, product_id, quantity) VALUES
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_tips_almond_n6', 1),
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_base_navi', 0.2),
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_reinforcement', 0.2),
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_top', 0.2),
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_palitos', 1),
        (lower(hex(randomblob(16))), 'service_softgel', 'prod_barbijos', 0.1);
    `,
  },
];
