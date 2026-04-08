/**
 * Historial Command Handler
 *
 * Handles the /historial command for viewing consumption history.
 * Format: /historial [producto] [--dias N]
 */

import {
  GetHistoryUseCase,
  HistoryTransaction,
} from '../../../application/use-cases/GetHistoryUseCase.types';
import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { ConsumptionRepository } from '../../../domain/repositories/ConsumptionRepository';

interface ParsedArgs {
  productName?: string;
  days: number;
}

export class HistorialCommandHandler {
  constructor(
    private readonly getHistoryUseCase: GetHistoryUseCase,
    private readonly productRepo: ProductRepository,
    private readonly consumptionRepo: ConsumptionRepository,
  ) {}

  async handle(_chatId: number, args?: string): Promise<string> {
    const parsed = this.parseArgs(args);

    if (!parsed.productName) {
      // Show all products with recent activity
      return this.showRecentActivity(parsed.days);
    }

    // Show history for specific product
    return this.showProductHistory(parsed.productName, parsed.days);
  }

  private parseArgs(args?: string): ParsedArgs {
    if (!args) {
      return { days: 7 };
    }

    const trimmed = args.trim();

    // Check for --dias flag
    const diasMatch = trimmed.match(/--dias?\s+(\d+)/i);
    const days = diasMatch ? parseInt(diasMatch[1], 10) : 7;

    // Remove the --dias flag from args to get product name
    const productName = trimmed.replace(/--dias?\s+\d+/i, '').trim() || undefined;

    return { productName, days };
  }

  private async showRecentActivity(days: number): Promise<string> {
    const productIds = await this.consumptionRepo.getProductsWithRecentActivity(days, 10);

    if (productIds.length === 0) {
      return `📊 *Historial de Actividad*\n\nNo hay actividad reciente en los últimos ${days} días.`;
    }

    let response = `📊 *Productos con Actividad Reciente*\n`;
    response += `Últimos ${days} días\n\n`;

    for (const productId of productIds) {
      const product = await this.productRepo.findById(productId);
      if (!product) continue;

      const dailyTotals = await this.consumptionRepo.getDailyTotals(productId, days);
      const totalConsumed = dailyTotals.reduce((sum, d) => sum + d.totalQuantity, 0);

      response += `• *${product.name}*: ${totalConsumed} ${product.unit} en ${dailyTotals.length} días\n`;
    }

    response += `\n💡 Usa \`/historial <producto>\` para ver detalles`;
    return response;
  }

  private async showProductHistory(productName: string, days: number): Promise<string> {
    // Find product
    const product = await this.productRepo.findByName(productName);

    if (!product) {
      // Try to find similar products
      const allProducts = await this.productRepo.findAll();
      const suggestions = allProducts
        .filter(p => p.name.toLowerCase().includes(productName.toLowerCase()))
        .slice(0, 5);

      let response = `❌ Producto no encontrado: "${productName}"\n\n`;

      if (suggestions.length > 0) {
        response += `¿Quisiste decir?\n`;
        for (const p of suggestions) {
          response += `  • ${p.name}\n`;
        }
      }

      response += `\n💡 Usa \`/stock\` para ver todos los productos`;
      return response;
    }

    // Get history
    const history = await this.getHistoryUseCase.execute({
      productId: product.id,
      productName: product.name,
      days,
    });

    // Format response
    let response = `📊 *Historial de ${product.name}*\n`;
    response += `Últimos ${days} días\n\n`;

    // Show transactions
    if (history.transactions.length === 0) {
      response += `_No hay movimientos registrados_\n\n`;
    } else {
      response += `*Movimientos:*\n`;

      // Group by date for display
      const grouped = this.groupTransactionsByDate(history.transactions);

      for (const [date, transactions] of grouped.slice(0, 10)) {
        const formattedDate = this.formatDate(date);

        for (const t of transactions) {
          const sign = t.type === 'consumption' ? '-' : '+';
          const emoji = this.getTransactionEmoji(t.type);
          response += `${emoji} ${formattedDate}: ${sign}${t.quantity} (${t.description})\n`;
        }
      }

      if (history.transactions.length > 10) {
        response += `\n... y ${history.transactions.length - 10} movimientos más\n`;
      }

      response += `\n`;
    }

    // Show summary
    response += `*Resumen:*\n`;
    response += `  • Total consumido: ${history.totalConsumed} ${product.unit}\n`;
    if (history.totalAdjusted > 0) {
      response += `  • Total ajustado: ${history.totalAdjusted > 0 ? '+' : ''}${history.totalAdjusted} ${product.unit}\n`;
    }
    if (history.totalRestocked > 0) {
      response += `  • Total repuesto: +${history.totalRestocked} ${product.unit}\n`;
    }
    response += `  • Promedio diario: ${history.averageDailyConsumption.toFixed(2)} ${product.unit}/día\n`;
    response += `  • Días con actividad: ${history.daysWithActivity}/${history.daysAnalyzed}`;

    return response;
  }

  private groupTransactionsByDate(
    transactions: HistoryTransaction[],
  ): Array<[string, HistoryTransaction[]]> {
    const grouped = new Map<string, HistoryTransaction[]>();

    for (const t of transactions) {
      const dateKey = t.date.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(t);
    }

    return Array.from(grouped.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
    );
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  private getTransactionEmoji(type: string): string {
    switch (type) {
      case 'consumption':
        return '🔻';
      case 'adjustment':
        return '⚖️';
      case 'restock':
        return '🔺';
      default:
        return '•';
    }
  }
}
