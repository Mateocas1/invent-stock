/**
 * Consumption History Entity
 *
 * Records when products are consumed for specific services.
 */

export interface ConsumptionHistory {
  id: string;
  productId: string;
  serviceId: string | null;
  quantity: number;
  date: Date;
  createdAt: Date;
}

export interface CreateConsumptionInput {
  productId: string;
  serviceId?: string;
  quantity: number;
  date?: Date;
}
