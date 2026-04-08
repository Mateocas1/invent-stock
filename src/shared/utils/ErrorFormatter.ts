/**
 * Error Message Formatter
 *
 * Formats application errors into user-friendly messages with context and suggestions.
 */

import {
  ApplicationError,
  ServiceNotFoundError,
  ProductNotFoundError,
  InsufficientStockError,
  ValidationError,
} from '../../application/errors/ApplicationErrors';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

export interface ErrorFormatterConfig {
  productRepo?: ProductRepository;
  serviceRepo?: ServiceRepository;
}

export class ErrorMessageFormatter {
  constructor(private readonly config: ErrorFormatterConfig = {}) {}

  async format(error: Error): Promise<string> {
    // Handle specific error types
    if (error instanceof ServiceNotFoundError) {
      return this.formatServiceNotFound(error);
    }

    if (error instanceof ProductNotFoundError) {
      return this.formatProductNotFound(error);
    }

    if (error instanceof InsufficientStockError) {
      return this.formatInsufficientStock(error);
    }

    if (error instanceof ValidationError) {
      return this.formatValidationError(error);
    }

    if (error instanceof ApplicationError) {
      return this.formatGenericApplicationError(error);
    }

    // Fallback for unknown errors
    return this.formatUnknownError(error);
  }

  private async formatServiceNotFound(error: ServiceNotFoundError): Promise<string> {
    const serviceName = (error.details?.serviceName as string) || 'desconocido';

    let response = `❌ *Servicio no encontrado: "${serviceName}"*\n\n`;

    // Try to get available services
    if (this.config.serviceRepo) {
      try {
        const services = await this.config.serviceRepo.findAll();
        if (services.length > 0) {
          response += `*Servicios disponibles:*\n`;
          for (const service of services.slice(0, 10)) {
            response += `  • ${service.name}\n`;
          }
          if (services.length > 10) {
            response += `  ... y ${services.length - 10} más\n`;
          }
          response += `\n`;
        }
      } catch {
        // Ignore repo errors
      }
    }

    response += `💡 *Tip:* Usá el nombre exacto del servicio. `;
    response += `Si tiene espacios, escribilo así: \`Soft\\ Gel\``;

    return response;
  }

  private async formatProductNotFound(error: ProductNotFoundError): Promise<string> {
    const productName = (error.details?.productName as string) || 'desconocido';

    let response = `❌ *Producto no encontrado: "${productName}"*\n\n`;

    // Try to get available products
    if (this.config.productRepo) {
      try {
        const products = await this.config.productRepo.findAll();

        // Find similar products
        const similar = products
          .filter(
            p =>
              p.name.toLowerCase().includes(productName.toLowerCase()) ||
              productName.toLowerCase().includes(p.name.toLowerCase()),
          )
          .slice(0, 5);

        if (similar.length > 0) {
          response += `¿Quisiste decir?\n`;
          for (const product of similar) {
            response += `  • ${product.name}\n`;
          }
          response += `\n`;
        }

        response += `Usá \`/stock\` para ver todos los productos disponibles.`;
      } catch {
        response += `Usá \`/stock\` para ver todos los productos disponibles.`;
      }
    } else {
      response += `Usá \`/stock\` para ver todos los productos disponibles.`;
    }

    return response;
  }

  private formatInsufficientStock(error: InsufficientStockError): string {
    const productName = (error.details?.productName as string) || 'desconocido';
    const available = (error.details?.available as number) || 0;
    const required = (error.details?.required as number) || 0;
    const missing = Math.max(0, required - available);

    let response = `❌ *Stock insuficiente para completar el servicio*\n\n`;

    response += `*Producto:* ${productName}\n`;
    response += `  • Stock actual: ${available} unidades\n`;
    response += `  • Necesario: ${required} unidades\n`;
    response += `  • Faltan: ${missing} unidades\n\n`;

    response += `💡 *Solución:*\n`;
    response += `  1. Ajustá la receta si es un error\n`;
    response += `  2. Reponé stock: \`/ajuste ${productName} +${missing} "reposición"\``;

    return response;
  }

  private formatValidationError(error: ValidationError): string {
    const field = error.details?.field as string;

    let response = `❌ *Error de validación*\n\n`;
    response += error.message;

    if (field) {
      response += `\n\n*Campo:* ${field}`;
    }

    response += `\n\n💡 Usá \`/help\` para ver el formato correcto.`;

    return response;
  }

  private formatGenericApplicationError(error: ApplicationError): string {
    let response = `❌ *Error*\n\n`;
    response += error.message;

    if (error.code) {
      response += `\n\n*Código:* \`${error.code}\``;
    }

    return response;
  }

  private formatUnknownError(error: Error): string {
    let response = `❌ *Error inesperado*\n\n`;
    response += `Ocurrió un error no esperado.\n\n`;

    if (process.env.NODE_ENV === 'development') {
      response += `*Detalles:* ${error.message}`;
    } else {
      response += `Por favor, intentá nuevamente. Si el problema persiste, contactá soporte.`;
    }

    return response;
  }
}

/**
 * Quick format function for simple error messages
 */
export function formatSimpleError(code: string, message: string): string {
  return `❌ *Error*\n\n${message}\n\n*Código:* \`${code}\``;
}
