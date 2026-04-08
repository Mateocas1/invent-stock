/**
 * Application Errors
 *
 * Custom error classes for the application layer.
 */

export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ServiceNotFoundError extends ApplicationError {
  constructor(serviceName: string) {
    super(`Service "${serviceName}" not found`, 'SERVICE_NOT_FOUND', { serviceName });
    this.name = 'ServiceNotFoundError';
  }
}

export class ProductNotFoundError extends ApplicationError {
  constructor(productName: string) {
    super(`Product "${productName}" not found`, 'PRODUCT_NOT_FOUND', { productName });
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends ApplicationError {
  constructor(productName: string, available: number, required: number) {
    super(
      `Insufficient stock for "${productName}": ${available} available, ${required} required`,
      'INSUFFICIENT_STOCK',
      { productName, available, required },
    );
    this.name = 'InsufficientStockError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', field ? { field } : undefined);
    this.name = 'ValidationError';
  }
}
