/**
 * Product Repository Interface
 *
 * Defines the contract for product data access.
 */

import { Product, ProductCategory } from '../entities/Product';

export interface ProductRepository {
  /**
   * Find a product by its ID.
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find a product by its name (case-insensitive).
   */
  findByName(name: string): Promise<Product | null>;

  /**
   * Find products by category.
   */
  findByCategory(category: ProductCategory): Promise<Product[]>;

  /**
   * Get all products.
   */
  findAll(): Promise<Product[]>;

  /**
   * Save a new product.
   */
  save(product: Product): Promise<void>;

  /**
   * Update an existing product.
   */
  update(id: string, updates: Partial<Product>): Promise<void>;

  /**
   * Find products with stock below minimum threshold.
   */
  findLowStock(): Promise<Product[]>;
}
