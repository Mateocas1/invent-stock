/**
 * Registrar Command Handler
 *
 * Handles the /registrar command.
 * Format: /registrar <servicio> <cliente> [--ajustes "producto:cantidad,..."]
 */

import { StockService } from '../../../application/services/StockService.types';
import { CommandQueue } from '../../../application/queue/CommandQueue';

export class RegistrarCommandHandler {
  constructor(
    private readonly stockService: StockService,
    private readonly commandQueue: CommandQueue,
  ) {}

  async handle(_chatId: number, args: string): Promise<string> {
    if (!args.trim()) {
      return '❌ Uso: `/registrar <servicio> <cliente> [--ajustes "producto:cantidad,..."]`\n\nEjemplo: `/registrar softgel María`\nEjemplo con ajustes: `/registrar softgel María --ajustes "gel:1.5"`';
    }

    // Parse arguments
    const { serviceName, clientName, adjustments } = this.parseArgs(args);

    if (!serviceName) {
      return '❌ Tenés que especificar el nombre del servicio.\n\nEjemplo: `/registrar softgel María`';
    }

    // Execute via command queue for sequential processing
    const result = await this.commandQueue.enqueue(() =>
      this.stockService.registerService(serviceName, clientName, adjustments),
    );

    // Build response
    let response = `✅ *Servicio registrado*\n\n`;
    response += `📋 Servicio: *${result.serviceName}*\n`;
    if (result.clientName) {
      response += `👤 Cliente: *${result.clientName}*\n`;
    }
    response += `\n📦 *Productos consumidos:*\n`;

    for (const product of result.productsConsumed) {
      response += `  • ${product.productName}: ${product.quantity} (stock: ${product.previousStock} → ${product.newStock})\n`;
    }

    // Add alerts if any
    if (result.alerts.length > 0) {
      response += `\n⚠️ *Alertas de stock:*\n`;
      for (const alert of result.alerts) {
        if (alert.type === 'depleted') {
          response += `  🚨 *${alert.productName}* - ¡STOCK AGOTADO!\n`;
        } else {
          response += `  ⚠️ *${alert.productName}* - Stock bajo (${alert.currentStock} / ${alert.minThreshold})\n`;
        }
      }
    }

    return response;
  }

  private parseArgs(args: string): {
    serviceName: string;
    clientName?: string;
    adjustments?: Map<string, number>;
  } {
    // Remove extra whitespace and split
    const parts = args.trim().split(/\s+/);

    // Check for --ajustes flag
    const ajustesIndex = parts.findIndex(p => p === '--ajustes');
    let adjustments: Map<string, number> | undefined;

    let mainParts = parts;
    if (ajustesIndex !== -1) {
      mainParts = parts.slice(0, ajustesIndex);
      const ajustesValue = parts
        .slice(ajustesIndex + 1)
        .join(' ')
        .replace(/^"|'/, '')
        .replace(/"|'$/, '');
      adjustments = this.parseAdjustments(ajustesValue);
    }

    if (mainParts.length === 0) {
      return { serviceName: '' };
    }

    const serviceName = mainParts[0];
    const clientName = mainParts.slice(1).join(' ') || undefined;

    return { serviceName, clientName, adjustments };
  }

  private parseAdjustments(ajustesStr: string): Map<string, number> {
    const adjustments = new Map<string, number>();

    if (!ajustesStr) return adjustments;

    const pairs = ajustesStr.split(',');
    for (const pair of pairs) {
      const [product, qty] = pair.trim().split(':');
      if (product && qty) {
        const quantity = parseFloat(qty);
        if (!isNaN(quantity) && quantity > 0) {
          adjustments.set(product.trim(), quantity);
        }
      }
    }

    return adjustments;
  }
}
