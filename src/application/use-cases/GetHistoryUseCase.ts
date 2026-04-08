/**
 * Get History Use Case Implementation
 *
 * Retrieves consumption history for a product with statistics and analysis.
 */

import {
  GetHistoryUseCase,
  GetHistoryInput,
  HistoryResult,
  HistoryTransaction,
} from './GetHistoryUseCase.types';
import { ConsumptionRepository } from '../../domain/repositories/ConsumptionRepository';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { ConsumptionHistory } from '../../domain/entities/ConsumptionHistory';
import { InventoryTransaction } from '../../domain/entities/InventoryTransaction';

export class GetHistoryUseCaseImpl implements GetHistoryUseCase {
  constructor(
    private readonly consumptionRepo: ConsumptionRepository,
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async execute(input: GetHistoryInput): Promise<HistoryResult> {
    const { productId, productName, days } = input;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch consumption history
    const consumptions = await this.consumptionRepo.findByProductIdAndDateRange(
      productId,
      startDate,
      endDate,
    );

    // Fetch inventory transactions (adjustments and restocks)
    const transactions = await this.transactionRepo.findByProductId(productId, 100);
    const filteredTransactions = transactions.filter(
      t => t.createdAt >= startDate && t.createdAt <= endDate,
    );

    // Combine and convert to HistoryTransaction
    const historyTransactions: HistoryTransaction[] = [
      ...this.mapConsumptionsToTransactions(consumptions),
      ...this.mapTransactionsToHistory(filteredTransactions),
    ];

    // Sort by date descending
    historyTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate statistics
    const totalConsumed = consumptions.reduce((sum, c) => sum + Math.abs(c.quantity), 0);
    const totalAdjusted = filteredTransactions
      .filter(t => t.type === 'adjustment')
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const totalRestocked = filteredTransactions
      .filter(t => t.type === 'restock')
      .reduce((sum, t) => sum + t.quantity, 0);

    // Calculate days with activity
    const uniqueDates = new Set(historyTransactions.map(t => t.date.toISOString().split('T')[0]));
    const daysWithActivity = uniqueDates.size;

    // Calculate average daily consumption
    const averageDailyConsumption = daysWithActivity > 0 ? totalConsumed / days : 0;

    return {
      productId,
      productName,
      transactions: historyTransactions,
      totalConsumed,
      totalAdjusted,
      totalRestocked,
      averageDailyConsumption,
      daysAnalyzed: days,
      daysWithActivity,
    };
  }

  private mapConsumptionsToTransactions(consumptions: ConsumptionHistory[]): HistoryTransaction[] {
    return consumptions.map(c => ({
      id: c.id,
      date: c.date,
      type: 'consumption' as const,
      quantity: Math.abs(c.quantity),
      description: c.serviceId ? `Servicio: ${c.serviceId}` : 'Consumo registrado',
      reference: c.serviceId ?? undefined,
    }));
  }

  private mapTransactionsToHistory(transactions: InventoryTransaction[]): HistoryTransaction[] {
    return transactions.map(t => {
      let description: string;
      switch (t.type) {
        case 'adjustment':
          description = t.quantity >= 0 ? 'Ajuste: Incremento' : 'Ajuste: Decremento';
          break;
        case 'restock':
          description = 'Reposición de stock';
          break;
        case 'consumption':
          description = 'Consumo de servicio';
          break;
        default:
          description = 'Transacción';
      }

      return {
        id: t.id,
        date: t.createdAt,
        type: t.type,
        quantity: Math.abs(t.quantity),
        description,
        reference: t.reference,
      };
    });
  }
}
