/**
 * Get History Use Case
 *
 * Retrieves consumption history for a product with statistics and analysis.
 */

// Types for GetHistoryUseCase

export interface HistoryTransaction {
  id: string;
  date: Date;
  type: 'consumption' | 'adjustment' | 'restock';
  quantity: number;
  description: string;
  reference?: string;
}

export interface HistoryResult {
  productId: string;
  productName: string;
  transactions: HistoryTransaction[];
  totalConsumed: number;
  totalAdjusted: number;
  totalRestocked: number;
  averageDailyConsumption: number;
  daysAnalyzed: number;
  daysWithActivity: number;
}

export interface GetHistoryInput {
  productId: string;
  productName: string;
  days: number;
}

export interface GetHistoryUseCase {
  execute(input: GetHistoryInput): Promise<HistoryResult>;
}
