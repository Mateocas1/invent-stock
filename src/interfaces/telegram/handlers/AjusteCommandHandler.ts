/**
 * Ajuste Command Handler
 *
 * Handles the /ajuste command.
 * Format: /ajuste <producto> <+/-cantidad> [razón]
 */

import { StockService } from '../../../application/services/StockService.types';
import { CommandQueue } from '../../../application/queue/CommandQueue';

export class AjusteCommandHandler {
  constructor(
    private readonly stockService: StockService,
    private readonly commandQueue: CommandQueue,
  ) {}

  async handle(_chatId: number, args: string): Promise<string> {
    if (!args.trim()) {
      return '❌ Uso: `/ajuste <producto> <+/-cantidad> [razón]`\n\nEjemplos:\n• `/ajuste monomero +100 reposición`\n• `/ajuste softgel -1 corrección`\n• `/ajuste "base coat" +50`;';
    }

    // Parse arguments - handle quoted product names
    const { productName, quantity, reason } = this.parseArgs(args);

    if (!productName) {
      return '❌ Tenés que especificar el nombre del producto.';
    }

    if (quantity === undefined || isNaN(quantity)) {
      return '❌ Tenés que especificar una cantidad válida (ej: +100 o -50).';
    }

    // Execute via command queue for sequential processing
    const result = await this.commandQueue.enqueue(() =>
      this.stockService.adjustStock(productName, quantity, reason || 'Ajuste manual'),
    );

    // Build response
    const emoji = quantity > 0 ? '📈' : '📉';

    let response = `${emoji} *Stock ajustado*\n\n`;
    response += `📦 Producto: *${result.productName}*\n`;
    response += `📊 Cantidad: ${quantity > 0 ? '+' : ''}${quantity}\n`;
    response += `📈 Stock: ${result.previousStock} → ${result.newStock}\n`;
    if (reason) {
      response += `📝 Razón: _${reason}_\n`;
    }

    return response;
  }

  private parseArgs(args: string): {
    productName: string;
    quantity: number;
    reason?: string;
  } {
    const trimmed = args.trim();

    // Check for quoted product name
    let productName = '';
    let remaining = trimmed;

    if (trimmed.startsWith('"')) {
      const endQuote = trimmed.indexOf('"', 1);
      if (endQuote !== -1) {
        productName = trimmed.substring(1, endQuote);
        remaining = trimmed.substring(endQuote + 1).trim();
      }
    } else if (trimmed.startsWith("'")) {
      const endQuote = trimmed.indexOf("'", 1);
      if (endQuote !== -1) {
        productName = trimmed.substring(1, endQuote);
        remaining = trimmed.substring(endQuote + 1).trim();
      }
    }

    // If no quotes, split by whitespace
    if (!productName) {
      const parts = trimmed.split(/\s+/);
      productName = parts[0];
      remaining = parts.slice(1).join(' ');
    }

    // Parse quantity and reason from remaining
    const remainingParts = remaining.split(/\s+/);
    const quantityStr = remainingParts[0];
    const quantity = parseFloat(quantityStr);
    const reason = remainingParts.slice(1).join(' ') || undefined;

    return { productName, quantity, reason };
  }
}
