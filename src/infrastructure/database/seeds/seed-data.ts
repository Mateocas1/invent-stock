/**
 * Seed Data
 *
 * Initial data for nail salon inventory management.
 * Includes common products and services.
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
      -- Products
      INSERT INTO products (id, name, category, unit, current_stock, min_threshold) VALUES
        (lower(hex(randomblob(16))), 'tips (uñas)', 'unidades', 'unidad', 50, 10),
        (lower(hex(randomblob(16))), 'esmalte base', 'ml', 'ml', 100, 20),
        (lower(hex(randomblob(16))), 'top coat', 'ml', 'ml', 100, 20),
        (lower(hex(randomblob(16))), 'lima', 'unidades', 'unidad', 30, 5),
        (lower(hex(randomblob(16))), 'gel (para capping)', 'g', 'g', 200, 30),
        (lower(hex(randomblob(16))), 'primer', 'ml', 'ml', 50, 10),
        (lower(hex(randomblob(16))), 'removedor de cutícula', 'ml', 'ml', 80, 15),
        (lower(hex(randomblob(16))), 'acetona', 'ml', 'ml', 500, 100),
        (lower(hex(randomblob(16))), 'alcohol isopropílico', 'ml', 'ml', 300, 50),
        (lower(hex(randomblob(16))), 'polvo acrílico', 'g', 'g', 150, 25),
        (lower(hex(randomblob(16))), 'líquido acrílico', 'ml', 'ml', 120, 20),
        (lower(hex(randomblob(16))), 'lámpara UV/LED', 'unidades', 'unidad', 5, 1),
        (lower(hex(randomblob(16))), 'cabina de secado', 'unidades', 'unidad', 3, 1),
        (lower(hex(randomblob(16))), 'toallitas sin pelusa', 'unidades', 'unidad', 200, 40),
        (lower(hex(randomblob(16))), 'brocha acrílica #8', 'unidades', 'unidad', 8, 2),
        (lower(hex(randomblob(16))), 'brocha acrílica #10', 'unidades', 'unidad', 6, 2),
        (lower(hex(randomblob(16))), 'cortatips', 'unidades', 'unidad', 4, 1),
        (lower(hex(randomblob(16))), 'pinza', 'unidades', 'unidad', 6, 2),
        (lower(hex(randomblob(16))), 'dappen dish', 'unidades', 'unidad', 10, 3),
        (lower(hex(randomblob(16))), 'glitter varios colores', 'g', 'g', 50, 10);

      -- Services (recipes will be added separately)
      INSERT INTO services (id, name, category) VALUES
        ('service_softgel', 'Soft Gel', 'manicure'),
        ('service_capping', 'Capping Gel', 'manicure'),
        ('service_esculpidas', 'Uñas Esculpidas', 'manicure'),
        ('service_kapping', 'Kapping Gel', 'manicure'),
        ('service_tradicional', 'Esmaltado Tradicional', 'manicure'),
        ('service_semipermanente', 'Semi Permanente', 'manicure'),
        ('service_russian', 'Russian Manicure', 'manicure'),
        ('service_pedicure', 'Pedicure', 'pedicure'),
        ('service_remocion', 'Remoción', 'servicio'),
        ('service_reparacion', 'Reparación', 'servicio');
    `,
  },
  {
    id: 'seed_002_recipes',
    name: 'Seed service recipes',
    timestamp: 1712583060000,
    sql: `
      -- Get product IDs for recipes (using subqueries to find by name)
      -- Note: In a real scenario, we'd store these IDs, but for seeding we use subqueries
      
      -- Soft Gel recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_softgel',
        p.id,
        CASE p.name
          WHEN 'tips (uñas)' THEN 1
          WHEN 'esmalte base' THEN 0.5
          WHEN 'top coat' THEN 0.3
          WHEN 'lima' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('tips (uñas)', 'esmalte base', 'top coat', 'lima');

      -- Capping Gel recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_capping',
        p.id,
        CASE p.name
          WHEN 'gel (para capping)' THEN 5
          WHEN 'esmalte base' THEN 0.3
          WHEN 'top coat' THEN 0.3
          WHEN 'lima' THEN 0.1
          WHEN 'primer' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('gel (para capping)', 'esmalte base', 'top coat', 'lima', 'primer');

      -- Uñas Esculpidas recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_esculpidas',
        p.id,
        CASE p.name
          WHEN 'tips (uñas)' THEN 1
          WHEN 'polvo acrílico' THEN 3
          WHEN 'líquido acrílico' THEN 2
          WHEN 'lima' THEN 0.2
          WHEN 'primer' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('tips (uñas)', 'polvo acrílico', 'líquido acrílico', 'lima', 'primer');

      -- Kapping Gel recipe (similar to capping but different quantities)
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_kapping',
        p.id,
        CASE p.name
          WHEN 'gel (para capping)' THEN 3
          WHEN 'esmalte base' THEN 0.2
          WHEN 'top coat' THEN 0.2
          WHEN 'lima' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('gel (para capping)', 'esmalte base', 'top coat', 'lima');

      -- Semi Permanente recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_semipermanente',
        p.id,
        CASE p.name
          WHEN 'esmalte base' THEN 0.2
          WHEN 'top coat' THEN 0.2
          WHEN 'lima' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('esmalte base', 'top coat', 'lima');

      -- Russian Manicure recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_russian',
        p.id,
        CASE p.name
          WHEN 'removedor de cutícula' THEN 0.5
          WHEN 'esmalte base' THEN 0.2
          WHEN 'top coat' THEN 0.2
          WHEN 'lima' THEN 0.1
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('removedor de cutícula', 'esmalte base', 'top coat', 'lima');

      -- Remoción recipe
      INSERT INTO recipes (id, service_id, product_id, quantity)
      SELECT 
        lower(hex(randomblob(16))),
        'service_remocion',
        p.id,
        CASE p.name
          WHEN 'acetona' THEN 10
          WHEN 'toallitas sin pelusa' THEN 2
          WHEN 'lima' THEN 0.2
          ELSE 0
        END
      FROM products p
      WHERE p.name IN ('acetona', 'toallitas sin pelusa', 'lima');
    `,
  },
];
