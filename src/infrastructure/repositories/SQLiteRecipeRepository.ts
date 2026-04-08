/**
 * SQLite Recipe Repository
 *
 * Implementation of RecipeRepository using SQLite.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { Recipe, RecipeWithProduct } from '../../domain/entities/Recipe';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository';

interface RecipeRow {
  id: string;
  service_id: string;
  product_id: string;
  quantity: number;
}

interface RecipeWithProductRow extends RecipeRow {
  product_name: string;
  product_category: string;
  product_unit: string;
}

export class SQLiteRecipeRepository implements RecipeRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToRecipe(row: RecipeRow): Recipe {
    return {
      id: row.id,
      serviceId: row.service_id,
      productId: row.product_id,
      quantity: row.quantity,
    };
  }

  private mapRowToRecipeWithProduct(row: RecipeWithProductRow): RecipeWithProduct {
    return {
      id: row.id,
      serviceId: row.service_id,
      productId: row.product_id,
      quantity: row.quantity,
      productName: row.product_name,
      productCategory: row.product_category,
      productUnit: row.product_unit,
    };
  }

  async findByServiceId(serviceId: string): Promise<RecipeWithProduct[]> {
    const rows = await this.db.query<RecipeWithProductRow>(
      `SELECT r.*, p.name as product_name, p.category as product_category, p.unit as product_unit
       FROM recipes r
       JOIN products p ON r.product_id = p.id
       WHERE r.service_id = ?
       ORDER BY p.name`,
      [serviceId],
    );
    return rows.map(this.mapRowToRecipeWithProduct);
  }

  async findByServiceAndProduct(serviceId: string, productId: string): Promise<Recipe | null> {
    const row = await this.db.queryOne<RecipeRow>(
      'SELECT * FROM recipes WHERE service_id = ? AND product_id = ?',
      [serviceId, productId],
    );
    return row ? this.mapRowToRecipe(row) : null;
  }

  async save(recipe: Recipe): Promise<void> {
    await this.db.execute(
      `INSERT INTO recipes (id, service_id, product_id, quantity)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(service_id, product_id) DO UPDATE SET
       quantity = excluded.quantity`,
      [recipe.id, recipe.serviceId, recipe.productId, recipe.quantity],
    );
  }

  async deleteByServiceId(serviceId: string): Promise<void> {
    await this.db.execute('DELETE FROM recipes WHERE service_id = ?', [serviceId]);
  }

  async findByProductId(productId: string): Promise<Recipe[]> {
    const rows = await this.db.query<RecipeRow>('SELECT * FROM recipes WHERE product_id = ?', [
      productId,
    ]);
    return rows.map(this.mapRowToRecipe);
  }
}
