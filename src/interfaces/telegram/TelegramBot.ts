/**
 * Telegram Bot
 *
 * Simplified bot with 4 commands: /stock, /agregar, /quitar, /alertas
 */

import TelegramBot from 'node-telegram-bot-api';
import { CommandQueue } from '../../application/queue/CommandQueue';
import { StockService } from '../../application/services/StockService.types';
import { AlertService } from '../../application/services/AlertService.types';
import { ApplicationError } from '../../application/errors/ApplicationErrors';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { PredictionService } from '../../application/services/PredictionService.types';

export interface TelegramBotConfig {
  token: string;
  commandQueue: CommandQueue;
  stockService: StockService;
  alertService: AlertService;
  predictionService: PredictionService;
  productRepo: ProductRepository;
  serviceRepo: ServiceRepository;
}

export class TelegramBotService {
  private bot: TelegramBot;
  private commandQueue: CommandQueue;
  private stockService: StockService;
  private alertService: AlertService;
  private predictionService: PredictionService;
  private productRepo: ProductRepository;
  private serviceRepo: ServiceRepository;

  constructor(config: TelegramBotConfig) {
    this.bot = new TelegramBot(config.token, { polling: true });
    this.commandQueue = config.commandQueue;
    this.stockService = config.stockService;
    this.alertService = config.alertService;
    this.predictionService = config.predictionService;
    this.productRepo = config.productRepo;
    this.serviceRepo = config.serviceRepo;

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // /start - Welcome message
    this.bot.onText(/^\/start/, async msg => {
      const chatId = msg.chat.id;
      try {
        const products = await this.productRepo.findAll();
        const services = await this.serviceRepo.findAll();
        const activeProducts = products.filter(p => p.isActive);

        const response =
          `💅 *Sistema de Stock - Salón de Manicura*\n\n` +
          `📦 *${activeProducts.length} productos* registrados\n` +
          `💅 *${services.length} servicios:* ${services.map(s => s.name).join(', ')}\n\n` +
          `*Comandos:*\n` +
          `/stock \\[producto] → Ver stock\n` +
          `/agregar producto cantidad → Reponer stock\n` +
          `/quitar producto cantidad motivo → Descontar stock\n` +
          `/alertas → Ver alertas activas\n\n` +
          `💡 Ejemplo: /stock tips almond n6`;

        await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      } catch (error) {
        await this.bot.sendMessage(chatId, '❌ Error al iniciar. Intentá de nuevo.');
      }
    });

    // /stock [producto] - View stock
    this.bot.onText(/^\/stock(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      await this.enqueueAndRun(chatId, async () => {
        const productName = match?.[1]?.trim();

        if (!productName) {
          // Show all products sorted by urgency
          return await this.handleStockAll();
        } else {
          // Show specific product
          return await this.handleStockProduct(productName);
        }
      });
    });

    // /agregar producto cantidad [razón] - Add stock
    this.bot.onText(/^\/agregar\s+(.+)$/i, async (msg, match) => {
      const chatId = msg.chat.id;
      await this.enqueueAndRun(chatId, async () => {
        const args = match![1]!.trim();
        return await this.handleAgregar(args);
      });
    });

    // /quitar producto cantidad motivo - Remove stock
    this.bot.onText(/^\/quitar\s+(.+)$/i, async (msg, match) => {
      const chatId = msg.chat.id;
      await this.enqueueAndRun(chatId, async () => {
        const args = match![1]!.trim();
        return await this.handleQuitar(args);
      });
    });

    // /alertas - View active alerts
    this.bot.onText(/^\/alertas(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      await this.enqueueAndRun(chatId, async () => {
        return await this.handleAlertas(match?.[1]?.trim());
      });
    });

    // /help - Show help
    this.bot.onText(/^\/help/, async msg => {
      const chatId = msg.chat.id;
      const response = this.getHelpMessage();
      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    // Handle polling errors
    this.bot.on('polling_error', error => {
      console.error('Telegram polling error:', error);
    });
  }

  // ==================== STOCK ====================

  private async handleStockAll(): Promise<string> {
    const products = await this.productRepo.findAll();
    const activeProducts = products.filter(p => p.isActive);

    if (activeProducts.length === 0) {
      return '📦 No hay productos registrados.';
    }

    let response = '📦 *Stock Actual*\n\n';

    // Sort: low stock first
    const sorted = [...activeProducts].sort((a, b) => {
      const aRatio = a.minThreshold > 0 ? a.currentStock / a.minThreshold : 999;
      const bRatio = b.minThreshold > 0 ? b.currentStock / b.minThreshold : 999;
      return aRatio - bRatio;
    });

    for (const product of sorted) {
      const isLow = product.currentStock <= product.minThreshold;
      const icon = isLow ? '🔴' : '🟢';
      const unit = this.formatUnit(product.currentStock, product.unit);

      let line = `${icon} *${product.name}:* ${unit}`;
      if (isLow) {
        line += ` ⚠️ BAJO`;
      }
      response += line + '\n';
    }

    const lowCount = activeProducts.filter(p => p.currentStock <= p.minThreshold).length;
    response += `\n📊 Total: ${activeProducts.length} productos`;
    if (lowCount > 0) {
      response += ` | 🔴 ${lowCount} bajo mínimo`;
    }

    return response;
  }

  private async handleStockProduct(productName: string): Promise<string> {
    const product = await this.findProductByName(productName);
    if (!product) {
      return `❌ No encontré "${productName}"\n\n💡 Probá /stock para ver todos los productos.`;
    }

    const isLow = product.currentStock <= product.minThreshold;
    const status = isLow ? '⚠️ BAJO MÍNIMO' : '✅ OK';

    let response = `📦 *${product.name}*\n\n`;
    response += `Stock: ${this.formatUnit(product.currentStock, product.unit)}\n`;
    response += `Mínimo: ${this.formatUnit(product.minThreshold, product.unit)}\n`;
    response += `Estado: ${status}`;

    // Add prediction if we have data
    try {
      const prediction = await this.predictionService.calculateDepletion(product.id);
      if (prediction && prediction.daysUntilDepletion > 0) {
        response += `\n\n🔮 *Predicción:*`;
        response += `\nConsumo diario: ${this.formatUnit(prediction.dailyConsumption, product.unit)}`;
        response += `\nDías hasta agotarse: ${prediction.daysUntilDepletion}`;
        response += `\nConfianza: ${prediction.confidence}`;
      }
    } catch {
      // No prediction data yet, that's fine
    }

    return response;
  }

  // ==================== AGREGAR ====================

  private async handleAgregar(args: string): Promise<string> {
    // Format: /agregar producto cantidad [razón]
    const parsed = this.parseAgregarArgs(args);
    if (!parsed) {
      return `❌ Formato incorrecto\n\n✅ Usá: /agregar producto cantidad "razón"\n💡 Ejemplo: /agregar tips almond n6 50 "pedido proveedor"`;
    }

    const { productName, quantity, reason } = parsed;

    const product = await this.findProductByName(productName);
    if (!product) {
      return `❌ No encontré "${productName}"\n\n💡 Probá /stock para ver los productos.`;
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + quantity;

    await this.stockService.adjustStock(product.id, quantity, reason || 'reposición');

    return (
      `✅ *Stock actualizado*\n\n` +
      `📦 ${product.name}\n` +
      `Antes: ${this.formatUnit(previousStock, product.unit)}\n` +
      `➕ Agregado: +${this.formatUnit(quantity, product.unit)}\n` +
      `Ahora: ${this.formatUnit(newStock, product.unit)}` +
      (reason ? `\n📝 ${reason}` : '')
    );
  }

  // ==================== QUITAR ====================

  private async handleQuitar(args: string): Promise<string> {
    // Format: /quitar producto cantidad motivo
    // motivo can be a service name (semipermanente, capping, softgel) or free text
    const parsed = this.parseQuitarArgs(args);
    if (!parsed) {
      return `❌ Formato incorrecto\n\n✅ Usá: /quitar producto cantidad motivo\n💡 Ejemplo: /quitar top 0.2 semipermanente\n💡 Ejemplo: /quitar removedor 5 "derrame"`;
    }

    const { productName, quantity, reason } = parsed;

    const product = await this.findProductByName(productName);
    if (!product) {
      return `❌ No encontré "${productName}"\n\n💡 Probá /stock para ver los productos.`;
    }

    if (product.currentStock < quantity) {
      return (
        `❌ Stock insuficiente\n\n` +
        `📦 ${product.name}\n` +
        `Stock actual: ${this.formatUnit(product.currentStock, product.unit)}\n` +
        `Querés quitar: ${this.formatUnit(quantity, product.unit)}`
      );
    }

    const previousStock = product.currentStock;
    const newStock = previousStock - quantity;

    // Use negative quantity for the adjustment
    await this.stockService.adjustStock(product.id, -quantity, reason);

    return (
      `✅ *Stock descontado*\n\n` +
      `📦 ${product.name}\n` +
      `Antes: ${this.formatUnit(previousStock, product.unit)}\n` +
      `➖ Quitado: -${this.formatUnit(quantity, product.unit)}\n` +
      `Ahora: ${this.formatUnit(newStock, product.unit)}\n` +
      `📝 ${reason}`
    );
  }

  // ==================== ALERTAS ====================

  private async handleAlertas(subCommand?: string): Promise<string> {
    // /alertas ack <id> - acknowledge
    if (subCommand?.startsWith('ack')) {
      const id = subCommand.replace('ack', '').trim();
      if (id) {
        try {
          await this.alertService.acknowledgeAlert(id);
          return `✅ Alerta ${id} reconocida.`;
        } catch {
          return `❌ No encontré la alerta ${id}.`;
        }
      }
    }

    const alerts = await this.alertService.getActiveAlerts();

    if (alerts.length === 0) {
      return '✅ No hay alertas activas. Todo bien!';
    }

    let response = `🚨 *Alertas Activas (${alerts.length})*\n\n`;

    const highAlerts = alerts.filter(a => a.severity === 'high');
    const mediumAlerts = alerts.filter(a => a.severity === 'medium');
    const lowAlerts = alerts.filter(a => a.severity === 'low');

    if (highAlerts.length > 0) {
      response += `🔴 *Urgente:*\n`;
      for (const alert of highAlerts) {
        response += `  • [${alert.id}] ${alert.message}\n`;
      }
      response += '\n';
    }

    if (mediumAlerts.length > 0) {
      response += `🟡 *Atención:*\n`;
      for (const alert of mediumAlerts) {
        response += `  • [${alert.id}] ${alert.message}\n`;
      }
      response += '\n';
    }

    if (lowAlerts.length > 0) {
      response += `🟢 *Info:*\n`;
      for (const alert of lowAlerts) {
        response += `  • [${alert.id}] ${alert.message}\n`;
      }
    }

    response += `\nPara reconocer: /alertas ack <id>`;

    return response;
  }

  // ==================== HELPERS ====================

  private async findProductByName(
    name: string,
  ): Promise<import('../../domain/entities/Product').Product | null> {
    // Try exact match first
    const allProducts = await this.productRepo.findAll();
    const normalizedName = name.toLowerCase().trim();

    // Exact match
    const exact = allProducts.find(p => p.name.toLowerCase() === normalizedName);
    if (exact) return exact;

    // Partial match (contains)
    const partial = allProducts.find(p => p.name.toLowerCase().includes(normalizedName));
    if (partial) return partial;

    // Reverse partial (input contains product name)
    const reverse = allProducts.find(p => normalizedName.includes(p.name.toLowerCase()));
    if (reverse) return reverse;

    return null;
  }

  private parseAgregarArgs(
    args: string,
  ): { productName: string; quantity: number; reason: string } | null {
    // Format: "tips almond n6 50" or "tips almond n6 50 pedido proveedor" or 'tips almond n6 50 "pedido proveedor"'
    const quotedReason = args.match(/"([^"]+)"/);
    const reason = quotedReason?.[1] || '';
    const argsWithoutReason = quotedReason ? args.replace(`"${quotedReason[1]}"`, '').trim() : args;

    // Find the number in the remaining args
    const parts = argsWithoutReason.split(/\s+/);
    const numberIndex = parts.findIndex(p => !isNaN(parseFloat(p)) && parseFloat(p) > 0);

    if (numberIndex === -1) return null;

    const productName = parts.slice(0, numberIndex).join(' ').trim();
    const quantity = parseFloat(parts[numberIndex]!);
    const remainingReason = parts
      .slice(numberIndex + 1)
      .join(' ')
      .trim();
    const finalReason = reason || remainingReason || 'reposición';

    if (!productName || quantity <= 0) return null;

    return { productName, quantity, reason: finalReason };
  }

  private parseQuitarArgs(
    args: string,
  ): { productName: string; quantity: number; reason: string } | null {
    // Format: "top 0.2 semipermanente" or "removedor 5 derrame" or 'removedor 5 "se cayó"'
    const quotedReason = args.match(/"([^"]+)"/);
    const quotedReasonText = quotedReason?.[1] || '';
    const argsWithoutReason = quotedReason ? args.replace(`"${quotedReason[1]}"`, '').trim() : args;

    const parts = argsWithoutReason.split(/\s+/);
    const numberIndex = parts.findIndex(p => !isNaN(parseFloat(p)) && parseFloat(p) > 0);

    if (numberIndex === -1) return null;

    const productName = parts.slice(0, numberIndex).join(' ').trim();
    const quantity = parseFloat(parts[numberIndex]!);
    const reasonParts = parts.slice(numberIndex + 1);
    const reason = quotedReasonText || reasonParts.join(' ').trim() || 'ajuste manual';

    if (!productName || quantity <= 0) return null;

    return { productName, quantity, reason };
  }

  private formatUnit(value: number, unit: string): string {
    if (unit === 'unidad') {
      return `${value} u`;
    }
    return `${value} ${unit}`;
  }

  private getHelpMessage(): string {
    return (
      `📚 *Ayuda - Sistema de Stock*\n\n` +
      `*Comandos:*\n\n` +
      `📦 /stock \\[producto]\n` +
      `Ver stock actual. Sin producto, muestra todo.\n` +
      `Ej: /stock tips almond n6\n\n` +
      `➕ /agregar producto cantidad "razón"\n` +
      `Agregar stock \\(reposición\\).\n` +
      `Ej: /agregar top 2 "pedido proveedor"\n\n` +
      `➖ /quitar producto cantidad motivo\n` +
      `Quitar stock \\(servicio o pérdida\\).\n` +
      `Ej: /quitar top 0.2 semipermanente\n` +
      `Ej: /quitar removedor 5 "derrame"\n\n` +
      `🚨 /alertas\n` +
      `Ver alertas activas.\n` +
      `Reconocer: /alertas ack <id>\n\n` +
      `*Servicios:*\n` +
      `• semipermanente\n` +
      `• capping\n` +
      `• softgel\n\n` +
      `💡 Los nombres de productos se buscan por similitud.`
    );
  }

  private async enqueueAndRun(chatId: number, handler: () => Promise<string>): Promise<void> {
    try {
      const response = await handler();
      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Command error:', error);
      let errorMessage = '❌ Ocurrió un error. Intentá de nuevo.';
      if (error instanceof ApplicationError) {
        errorMessage = `❌ ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `❌ ${error.message}`;
      }
      await this.bot.sendMessage(chatId, errorMessage);
    }
  }

  async stop(): Promise<void> {
    this.bot.stopPolling();
    this.commandQueue.clear();
  }
}
