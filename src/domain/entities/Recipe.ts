/**
 * Recipe Entity
 *
 * Represents the relationship between services and products.
 * A recipe defines which products are consumed when performing a service.
 */

export interface Recipe {
  id: string;
  serviceId: string;
  productId: string;
  quantity: number;
}

export interface CreateRecipeInput {
  serviceId: string;
  productId: string;
  quantity: number;
}

export interface UpdateRecipeInput {
  quantity?: number;
}

/**
 * Recipe with product details.
 */
export interface RecipeWithProduct extends Recipe {
  productName: string;
  productCategory: string;
  productUnit: string;
}
