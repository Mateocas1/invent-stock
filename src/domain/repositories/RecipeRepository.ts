/**
 * Recipe Repository Interface
 *
 * Defines the contract for recipe data access.
 */

import { Recipe, RecipeWithProduct } from '../entities/Recipe';

export interface RecipeRepository {
  /**
   * Find recipes by service ID.
   * Returns all product recipes for a given service.
   */
  findByServiceId(serviceId: string): Promise<RecipeWithProduct[]>;

  /**
   * Find a specific recipe by service and product.
   */
  findByServiceAndProduct(serviceId: string, productId: string): Promise<Recipe | null>;

  /**
   * Save a new recipe.
   */
  save(recipe: Recipe): Promise<void>;

  /**
   * Delete recipes by service ID.
   */
  deleteByServiceId(serviceId: string): Promise<void>;

  /**
   * Find recipes by product ID.
   */
  findByProductId(productId: string): Promise<Recipe[]>;
}
