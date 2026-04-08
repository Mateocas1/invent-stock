/**
 * Stock Command Handler
 *
 * Handles the /stock command.
 * Format: /stock [producto|tips]
 */

import { StockService } from '../../../application/services/StockService.types';

export class StockCommandHandler {
  constructor(private readonly stockService: StockService) {}

  async handle(_chatId: number, productName?: string): Promise<string> {
    if (!productName) {
      // Show all stock
      return this.showAllStock();
    }

    const trimmed = productName.trim().toLowerCase();

    // Check for "tips" subcommand
    if (trimmed === 'tips' || trimmed === 'consejos' || trimmed === 'predicciones') {
      return this.showTips();
    }

    // Show specific product with prediction
    return this.showProductStock(productName.trim());
  }

  private async showProductStock(productName: string): Promise<string> {
    try {
      // Use getStockWithPrediction to get enhanced stock info
      const stock = await this.stockService.getStockWithPrediction(productName);

      if (!stock) {
        return `❌ No se encontró el producto "${productName}"`;
      }

      let response = `📦 *${stock.product.name}*\n\n`;
      response += `📊 Stock actual: *${stock.product.currentStock}* ${stock.product.unit}\n`;
      response += `⚠️ Mínimo: ${stock.product.minThreshold} ${stock.product.unit}\n`;
      response += `📂 Categoría: ${stock.product.category}\n\n`;

      // Status indicator
      if (stock.status === 'critical') {
        response += `🚨 *ESTADO: CRÍTICO* - Stock agotado\n`;
      } else if (stock.status === 'low') {
        response += `⚠️ *ESTADO: BAJO* - Por debajo del mínimo\n`;
      } else {
        response += `✅ *ESTADO: OK*\n`;
      }

      // Add prediction if available
      if (stock.prediction && stock.prediction.dataPoints > 0) {
        response += '\n🔮 *Predicción:*\n';

        const pred = stock.prediction;

        // Days until depletion
        if (pred.daysUntilDepletion === Infinity) {
          response += `  📅 Duración: Más de 30 días\n`;
        } else if (pred.daysUntilDepletion <= 0) {
          response += `  📅 Duración: Agotado o agotándose\n`;
        } else {
          response += `  📅 Duración estimada: *${pred.daysUntilDepletion} días*\n`;
        }

        // Daily consumption
        response += `  📉 Consumo diario: ${pred.dailyConsumption.toFixed(2)} ${stock.product.unit}/día\n`;

        // Confidence level with emoji
        const confidenceEmoji =
          pred.confidence === 'high' ? '🟢' : pred.confidence === 'medium' ? '🟡' : '🔴';
        const confidenceText =
          pred.confidence === 'high' ? 'Alta' : pred.confidence === 'medium' ? 'Media' : 'Baja';
        response += `  🎯 Confianza: ${confidenceEmoji} ${confidenceText} (${pred.dataPoints} datos)\n`;

        // Trend indicator
        if (pred.trendSlope > 0.01) {
          response += `  📈 Tendencia: Consumo aumentando\n`;
        } else if (pred.trendSlope < -0.01) {
          response += `  📉 Tendencia: Consumo disminuyendo\n`;
        }
      } else {
        response += '\n💡 Sin datos suficientes para predicción\n';
        response += `   (se necesitan consumos previos)\n`;
      }

      return response;
    } catch (error) {
      return `❌ Error al consultar "${productName}"`;
    }
  }

  private async showTips(): Promise<string> {
    // Get all products and find those with predictions
    const allStock = await this.stockService.getAllStock();

    const productsWithPredictions: Array<{
      name: string;
      unit: string;
      daysRemaining?: number;
      confidence?: string;
    }> = [];

    for (const stock of allStock) {
      if (stock.prediction && stock.prediction.dataPoints > 0) {
        productsWithPredictions.push({
          name: stock.product.name,
          unit: stock.product.unit,
          daysRemaining: stock.prediction.daysUntilDepletion,
          confidence: stock.prediction.confidence,
        });
      }
    }

    // Sort by days remaining (ascending) - most urgent first
    const sorted = productsWithPredictions
      .filter(p => p.daysRemaining !== undefined && p.daysRemaining !== Infinity)
      .sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));

    if (sorted.length === 0) {
      return '💡 *Consejos de Reabastecimiento*\n\nNo hay suficientes datos de consumo para generar consejos.\n\nRegistra más servicios para obtener predicciones.';
    }

    let response = '💡 *Consejos de Reabastecimiento*\n\n';
    response += 'Productos ordenados por urgencia:\n\n';

    let urgentCount = 0;
    let warningCount = 0;
    let normalCount = 0;

    for (const product of sorted.slice(0, 10)) {
      // Skip products with no days remaining
      if (product.daysRemaining === undefined || product.daysRemaining === Infinity) continue;

      const days = product.daysRemaining;
      const confidenceEmoji =
        product.confidence === 'high' ? '🟢' : product.confidence === 'medium' ? '🟡' : '🔴';

      if (days <= 3) {
        response += `🔴 *${product.name}*: ${days} días ${confidenceEmoji}\n`;
        urgentCount++;
      } else if (days <= 7) {
        response += `🟡 ${product.name}: ${days} días ${confidenceEmoji}\n`;
        warningCount++;
      } else if (days <= 14) {
        response += `🟢 ${product.name}: ${days} días ${confidenceEmoji}\n`;
        normalCount++;
      }
    }

    response += '\n';
    response += '📊 *Resumen:*\n';
    if (urgentCount > 0)
      response += `  🔴 ${urgentCount} urgente${urgentCount !== 1 ? 's' : ''} (< 4 días)\n`;
    if (warningCount > 0)
      response += `  🟡 ${warningCount} advertencia${warningCount !== 1 ? 's' : ''} (4-7 días)\n`;
    if (normalCount > 0) response += `  🟢 ${normalCount} planificar (8-14 días)\n`;

    response += '\n💡 Usa `/stock <producto>` para ver detalles de predicción';

    return response;
  }

  private async showAllStock(): Promise<string> {
    const allStock = await this.stockService.getAllStock();

    if (allStock.length === 0) {
      return '📭 No hay productos en el inventario.';
    }

    // Group by status
    const critical = allStock.filter(s => s.status === 'critical');
    const low = allStock.filter(s => s.status === 'low');
    const ok = allStock.filter(s => s.status === 'ok');

    let response = '📊 *Estado del Inventario*\n\n';

    // Critical first
    if (critical.length > 0) {
      response += '🚨 *CRÍTICO - Stock agotado:*\n';
      for (const stock of critical) {
        response += `  • ${stock.product.name}: 0 ${stock.product.unit}\n`;
      }
      response += '\n';
    }

    // Low stock
    if (low.length > 0) {
      response += '⚠️ *STOCK BAJO:*\n';
      for (const stock of low) {
        response += `  • ${stock.product.name}: ${stock.product.currentStock}/${stock.product.minThreshold} ${stock.product.unit}\n`;
      }
      response += '\n';
    }

    // OK products (show summary only if many)
    if (ok.length > 0) {
      if (ok.length <= 10) {
        response += '✅ *Stock OK:*\n';
        for (const stock of ok) {
          response += `  • ${stock.product.name}: ${stock.product.currentStock} ${stock.product.unit}\n`;
        }
      } else {
        response += `✅ *${ok.length} productos con stock OK*\n`;
      }
    }

    // Summary
    response += `\n📈 *Resumen:* ${critical.length} críticos, ${low.length} bajos, ${ok.length} OK`;

    return response;
  }
}
