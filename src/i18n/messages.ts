/**
 * Internationalization Messages
 *
 * All user-facing messages for the bot.
 * Spanish (es) is primary, English (en) is fallback for future internationalization.
 */

export type Language = 'es' | 'en';

export interface Messages {
  // Common
  welcome: string;
  welcomeBack: string;
  goodbye: string;
  error: string;
  success: string;
  loading: string;
  cancel: string;
  confirm: string;
  yes: string;
  no: string;

  // Commands
  commands: {
    start: string;
    help: string;
    stock: string;
    registrar: string;
    ajuste: string;
    alertas: string;
    historial: string;
  };

  // Errors
  errors: {
    serviceNotFound: string;
    productNotFound: string;
    insufficientStock: string;
    validationError: string;
    unknownError: string;
    commandNotFound: string;
    invalidArguments: string;
  };

  // Stock
  stock: {
    currentStock: string;
    minThreshold: string;
    status: string;
    statusOk: string;
    statusLow: string;
    statusCritical: string;
    prediction: string;
    daysRemaining: string;
    dailyConsumption: string;
    confidence: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    trendIncreasing: string;
    trendDecreasing: string;
    noPredictionData: string;
  };

  // History
  history: {
    title: string;
    recentActivity: string;
    noActivity: string;
    transactions: string;
    totalConsumed: string;
    totalAdjusted: string;
    totalRestocked: string;
    averageDaily: string;
    daysAnalyzed: string;
    daysWithActivity: string;
  };

  // Alerts
  alerts: {
    title: string;
    noAlerts: string;
    critical: string;
    low: string;
    acknowledged: string;
  };

  // Services
  services: {
    registered: string;
    consumed: string;
    adjusted: string;
  };
}

// Spanish messages (primary)
export const esMessages: Messages = {
  welcome: '¡Bienvenida al Sistema de Stock!',
  welcomeBack: '¡Bienvenida de vuelta!',
  goodbye: '¡Hasta luego!',
  error: 'Ocurrió un error',
  success: '¡Listo!',
  loading: 'Procesando...',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  yes: 'Sí',
  no: 'No',

  commands: {
    start: 'Inicializar el bot',
    help: 'Mostrar ayuda',
    stock: 'Consultar stock',
    registrar: 'Registrar servicio',
    ajuste: 'Ajustar stock',
    alertas: 'Ver alertas',
    historial: 'Ver historial',
  },

  errors: {
    serviceNotFound: 'Servicio no encontrado',
    productNotFound: 'Producto no encontrado',
    insufficientStock: 'Stock insuficiente',
    validationError: 'Error de validación',
    unknownError: 'Error desconocido',
    commandNotFound: 'Comando no encontrado',
    invalidArguments: 'Argumentos inválidos',
  },

  stock: {
    currentStock: 'Stock actual',
    minThreshold: 'Mínimo',
    status: 'Estado',
    statusOk: 'OK',
    statusLow: 'BAJO',
    statusCritical: 'CRÍTICO',
    prediction: 'Predicción',
    daysRemaining: 'Días restantes',
    dailyConsumption: 'Consumo diario',
    confidence: 'Confianza',
    confidenceHigh: 'Alta',
    confidenceMedium: 'Media',
    confidenceLow: 'Baja',
    trendIncreasing: 'Consumo aumentando',
    trendDecreasing: 'Consumo disminuyendo',
    noPredictionData: 'Sin datos suficientes para predicción',
  },

  history: {
    title: 'Historial',
    recentActivity: 'Actividad reciente',
    noActivity: 'No hay actividad reciente',
    transactions: 'Movimientos',
    totalConsumed: 'Total consumido',
    totalAdjusted: 'Total ajustado',
    totalRestocked: 'Total repuesto',
    averageDaily: 'Promedio diario',
    daysAnalyzed: 'Días analizados',
    daysWithActivity: 'Días con actividad',
  },

  alerts: {
    title: 'Alertas',
    noAlerts: 'No hay alertas activas',
    critical: 'Crítico',
    low: 'Bajo',
    acknowledged: 'Alerta reconocida',
  },

  services: {
    registered: 'Servicio registrado',
    consumed: 'Consumido',
    adjusted: 'Ajustado',
  },
};

// English messages (fallback)
export const enMessages: Messages = {
  welcome: 'Welcome to the Stock System!',
  welcomeBack: 'Welcome back!',
  goodbye: 'Goodbye!',
  error: 'An error occurred',
  success: 'Done!',
  loading: 'Processing...',
  cancel: 'Cancel',
  confirm: 'Confirm',
  yes: 'Yes',
  no: 'No',

  commands: {
    start: 'Initialize bot',
    help: 'Show help',
    stock: 'Check stock',
    registrar: 'Register service',
    ajuste: 'Adjust stock',
    alertas: 'View alerts',
    historial: 'View history',
  },

  errors: {
    serviceNotFound: 'Service not found',
    productNotFound: 'Product not found',
    insufficientStock: 'Insufficient stock',
    validationError: 'Validation error',
    unknownError: 'Unknown error',
    commandNotFound: 'Command not found',
    invalidArguments: 'Invalid arguments',
  },

  stock: {
    currentStock: 'Current stock',
    minThreshold: 'Minimum',
    status: 'Status',
    statusOk: 'OK',
    statusLow: 'LOW',
    statusCritical: 'CRITICAL',
    prediction: 'Prediction',
    daysRemaining: 'Days remaining',
    dailyConsumption: 'Daily consumption',
    confidence: 'Confidence',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceLow: 'Low',
    trendIncreasing: 'Consumption increasing',
    trendDecreasing: 'Consumption decreasing',
    noPredictionData: 'Insufficient data for prediction',
  },

  history: {
    title: 'History',
    recentActivity: 'Recent activity',
    noActivity: 'No recent activity',
    transactions: 'Transactions',
    totalConsumed: 'Total consumed',
    totalAdjusted: 'Total adjusted',
    totalRestocked: 'Total restocked',
    averageDaily: 'Daily average',
    daysAnalyzed: 'Days analyzed',
    daysWithActivity: 'Days with activity',
  },

  alerts: {
    title: 'Alerts',
    noAlerts: 'No active alerts',
    critical: 'Critical',
    low: 'Low',
    acknowledged: 'Alert acknowledged',
  },

  services: {
    registered: 'Service registered',
    consumed: 'Consumed',
    adjusted: 'Adjusted',
  },
};

// Message catalog
export const messages: Record<Language, Messages> = {
  es: esMessages,
  en: enMessages,
};

// Default language
export const DEFAULT_LANGUAGE: Language = 'es';
