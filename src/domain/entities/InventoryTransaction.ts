/**
 * Inventory Transaction Entity
 *
 * Records all changes to product stock.
 */

export type TransactionType = 'consumption' | 'adjustment' | 'restock';

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: TransactionType;
  previousStock: number;
  newStock: number;
  quantity: number;
  reference?: string;
  createdAt: Date;
}

export interface CreateTransactionInput {
  productId: string;
  type: TransactionType;
  previousStock: number;
  newStock: number;
  quantity: number;
  reference?: string;
}
