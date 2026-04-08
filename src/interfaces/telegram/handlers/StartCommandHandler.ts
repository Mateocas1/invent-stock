/**
 * Start Command Handler
 *
 * Handles the /start command - enhanced welcome with onboarding flow.
 */

import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';

export interface StartCommandHandlerConfig {
  productRepo: ProductRepository;
  serviceRepo: ServiceRepository;
}

export class StartCommandHandler {
  constructor(private readonly config: StartCommandHandlerConfig) {}

  async handle(_chatId: number, isFirstTime = true): Promise<string> {
    if (isFirstTime) {
      return this.getOnboardingMessage();
    }
    return this.getWelcomeBackMessage();
  }

  private async getOnboardingMessage(): Promise<string> {
    // Get counts for personalized message
    let productCount = 0;
    let serviceCount = 0;

    try {
      const products = await this.config.productRepo.findAll();
      const services = await this.config.serviceRepo.findAll();
      productCount = products.length;
      serviceCount = services.length;
    } catch {
      // If repos fail, continue with generic message
    }

    let response = `💅 *¡Bienvenida al Sistema de Stock de tu Salón!*\n\n`;

    response += `Soy tu asistente para control de inventario. Te ayudo a:\n\n`;
    response += `📦 *Controlar stock* de productos\n`;
    response += `🔮 *Predecir* cuándo se agotarán\n`;
    response += `🚨 *Alertarte* antes de que falte insumos\n`;
    response += `📊 *Ver histórico* de consumo\n\n`;

    response += `¿Primera vez aquí? Te explico rápido:\n\n`;

    if (productCount > 0) {
      response += `1️⃣ *PRODUCTOS*\n`;
      response += `   Tenés *${productCount}* productos cargados\n`;
      response += `   • Tips, esmaltes, limas, gels, etc.\n\n`;
    } else {
      response += `1️⃣ *PRODUCTOS*\n`;
      response += `   Inventario de insumos\n`;
      response += `   • Tips, esmaltes, limas, gels, etc.\n\n`;
    }

    if (serviceCount > 0) {
      response += `2️⃣ *SERVICIOS*\n`;
      response += `   Tenés *${serviceCount}* servicios configurados\n`;
      response += `   • Soft Gel, Capping, Esculpidas, etc.\n\n`;
    } else {
      response += `2️⃣ *SERVICIOS*\n`;
      response += `   Servicios con recetas configuradas\n`;
      response += `   • Soft Gel, Capping, Esculpidas, etc.\n\n`;
    }

    response += `3️⃣ *COMANDOS PRINCIPALES*\n`;
    response += `   /registrar - Registra un servicio\n`;
    response += `   /stock - Consulta stock con predicción\n`;
    response += `   /alertas - Ver alertas activas\n\n`;

    response += `👉 *Para empezar:*\n`;
    response += `   Escribe \`/help\` para ver todos los comandos\n`;
    response += `   Escribe \`/stock\` para ver tu inventario actual\n\n`;

    response += `¡Estoy acá para ayudarte! 💪`;

    return response;
  }

  private getWelcomeBackMessage(): string {
    return `
🎉 *¡Bienvenida de vuelta a InventStock!*

¿Qué querés hacer hoy?

📋 *Opciones rápidas:*
/stock - Ver estado del inventario
/alertas - Revisar alertas activas
/registrar - Registrar un servicio
/historial - Ver actividad reciente
/help - Ver ayuda completa

¡Estoy listo para ayudarte! 💅
`;
  }
}
