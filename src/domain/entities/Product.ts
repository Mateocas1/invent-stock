/**
 * Product Entity
 *
 * Represents a product in the inventory system.
 */

export type ProductCategory = 'unidades' | 'ml' | 'g' | 'gotas';
export type ProductUnit = 'unidad' | 'ml' | 'g' | 'gota';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  currentStock: number;
  minThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateProductInput {
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  currentStock?: number;
  minThreshold?: number;
}

export interface UpdateProductInput {
  name?: string;
  category?: ProductCategory;
  unit?: ProductUnit;
  currentStock?: number;
  minThreshold?: number;
  isActive?: boolean;
}
