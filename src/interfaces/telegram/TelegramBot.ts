/**
 * Telegram Bot
 *
 * Main bot initialization and message handling.
 */

import TelegramBot from 'node-telegram-bot-api';
import { CommandQueue } from '../../application/queue/CommandQueue';
import { StockService } from '../../application/services/StockService.types';
import { AlertService } from '../../application/services/AlertService.types';
import { StartCommandHandler } from './handlers/StartCommandHandler';
import { RegistrarCommandHandler } from './handlers/RegistrarCommandHandler';
import { AjusteCommandHandler } from './handlers/AjusteCommandHandler';
import { StockCommandHandler } from './handlers/StockCommandHandler';
import { AlertasCommandHandler } from './handlers/AlertasCommandHandler';
import { HelpCommandHandler } from './handlers/HelpCommandHandler';
import { HistorialCommandHandler } from './handlers/HistorialCommandHandler';
import { ApplicationError } from '../../application/errors/ApplicationErrors';
import { ErrorMessageFormatter } from '../../shared/utils/ErrorFormatter';
import { GetHistoryUseCaseImpl } from '../../application/use-cases/GetHistoryUseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { ConsumptionRepository } from '../../domain/repositories/ConsumptionRepository';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';

export interface TelegramBotConfig {
  token: string;
  commandQueue: CommandQueue;
  stockService: StockService;
  alertService: AlertService;
  productRepo: ProductRepository;
  serviceRepo: ServiceRepository;
  consumptionRepo: ConsumptionRepository;
  transactionRepo: TransactionRepository;
}

export class TelegramBotService {
  private bot: TelegramBot;
  private commandQueue: CommandQueue;

  // Command handlers
  private startHandler: StartCommandHandler;
  private registrarHandler: RegistrarCommandHandler;
  private ajusteHandler: AjusteCommandHandler;
  private stockHandler: StockCommandHandler;
  private alertasHandler: AlertasCommandHandler;
  private helpHandler: HelpCommandHandler;
  private historialHandler: HistorialCommandHandler;
  private errorFormatter: ErrorMessageFormatter;

  constructor(config: TelegramBotConfig) {
    this.bot = new TelegramBot(config.token, { polling: true });
    this.commandQueue = config.commandQueue;

    // Initialize error formatter with repos
    this.errorFormatter = new ErrorMessageFormatter({
      productRepo: config.productRepo,
      serviceRepo: config.serviceRepo,
    });

    // Initialize use cases
    const getHistoryUseCase = new GetHistoryUseCaseImpl(
      config.consumptionRepo,
      config.transactionRepo,
    );

    // Initialize handlers
    this.startHandler = new StartCommandHandler({
      productRepo: config.productRepo,
      serviceRepo: config.serviceRepo,
    });
    this.registrarHandler = new RegistrarCommandHandler(config.stockService, config.commandQueue);
    this.ajusteHandler = new AjusteCommandHandler(config.stockService, config.commandQueue);
    this.stockHandler = new StockCommandHandler(config.stockService);
    this.alertasHandler = new AlertasCommandHandler(config.alertService);
    this.helpHandler = new HelpCommandHandler();
    this.historialHandler = new HistorialCommandHandler(
      getHistoryUseCase,
      config.productRepo,
      config.consumptionRepo,
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle /start
    this.bot.onText(/^\/start/, async msg => {
      await this.handleCommand(msg, chatId => this.startHandler.handle(chatId, true));
    });

    // Handle /registrar
    this.bot.onText(/^\/registrar(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId =>
        this.registrarHandler.handle(chatId, match?.[1] ?? ''),
      );
    });

    // Handle /ajuste
    this.bot.onText(/^\/ajuste(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId => this.ajusteHandler.handle(chatId, match?.[1] ?? ''));
    });

    // Handle /stock
    this.bot.onText(/^\/stock(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId => this.stockHandler.handle(chatId, match?.[1]));
    });

    // Handle /alertas
    this.bot.onText(/^\/alertas(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId => this.alertasHandler.handle(chatId, match?.[1]));
    });

    // Handle /historial
    this.bot.onText(/^\/historial(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId => this.historialHandler.handle(chatId, match?.[1]));
    });

    // Handle /help with optional topic
    this.bot.onText(/^\/help(?:\s+(.+))?/, async (msg, match) => {
      await this.handleCommand(msg, chatId => this.helpHandler.handle(chatId, match?.[1]));
    });

    // Handle errors
    this.bot.on('polling_error', error => {
      console.error('Telegram polling error:', error);
    });
  }

  private async handleCommand(
    msg: TelegramBot.Message,
    handler: (chatId: number) => Promise<string>,
  ): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const response = await handler(chatId);
      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Command error:', error);
      const errorMessage = await this.formatError(error);
      await this.bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
    }
  }

  private async formatError(error: unknown): Promise<string> {
    if (error instanceof ApplicationError) {
      return this.errorFormatter.format(error);
    }
    if (error instanceof Error) {
      return `❌ *Error*\n\n${error.message}`;
    }
    return '❌ *Error*\n\nOcurrió un error inesperado. Por favor, intentá nuevamente.';
  }

  async stop(): Promise<void> {
    this.bot.stopPolling();
    this.commandQueue.clear();
  }
}
