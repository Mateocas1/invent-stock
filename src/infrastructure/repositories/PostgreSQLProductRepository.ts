/**
 * PostgreSQL Product Repository
 *
 * Implementation of ProductRepository using PostgreSQL.
 * Adapts SQLite-style queries to PostgreSQL syntax.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { Product, ProductCategory } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

interface ProductRow {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  current_stock: number;
  min_threshold: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export class PostgreSQLProductRepository implements ProductRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToProduct(row: ProductRow): Product {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      unit: row.unit as Product['unit'],
      currentStock: row.current_stock,
      minThreshold: row.min_threshold,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.db.queryOne<ProductRow>('SELECT * FROM products WHERE id = $1', [id]);
    return row ? this.mapRowToProduct(row) : null;
  }

  async findByName(name: string): Promise<Product | null> {
    const row = await this.db.queryOne<ProductRow>(
      'SELECT * FROM products WHERE LOWER(name) = LOWER($1)',
      [name],
    );
    return row ? this.mapRowToProduct(row) : null;
  }

  async findByCategory(category: ProductCategory): Promise<Product[]> {
    const rows = await this.db.query<ProductRow>(
      'SELECT * FROM products WHERE category = $1 AND is_active = true ORDER BY name',
      [category],
    );
    return rows.map(this.mapRowToProduct);
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.db.query<ProductRow>(
      'SELECT * FROM products WHERE is_active = true ORDER BY name',
    );
    return rows.map(this.mapRowToProduct);
  }

  async save(product: Product): Promise<void> {
    await this.db.execute(
      `INSERT INTO products (id, name, category, unit, current_stock, min_threshold, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        product.id,
        product.name,
        product.category,
        product.unit,
        product.currentStock,
        product.minThreshold,
        product.createdAt.toISOString(),
        product.updatedAt.toISOString(),
        product.isActive,
      ],
    );
  }

  async update(id: string, updates: Partial<Product>): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.unit !== undefined) {
      fields.push(`unit = $${paramIndex++}`);
      values.push(updates.unit);
    }
    if (updates.currentStock !== undefined) {
      fields.push(`current_stock = $${paramIndex++}`);
      values.push(updates.currentStock);
    }
    if (updates.minThreshold !== undefined) {
      fields.push(`min_threshold = $${paramIndex++}`);
      values.push(updates.minThreshold);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) return;

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex++}`,
      values,
    );
  }

  async findLowStock(): Promise<Product[]> {
    const rows = await this.db.query<ProductRow>(
      'SELECT * FROM products WHERE current_stock <= min_threshold AND is_active = true ORDER BY current_stock ASC',
    );
    return rows.map(this.mapRowToProduct);
  }
}
