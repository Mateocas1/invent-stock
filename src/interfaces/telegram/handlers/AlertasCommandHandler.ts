/**
 * Alertas Command Handler
 *
 * Handles the /alertas command.
 * Shows active stock alerts and allows acknowledgment.
 * Format: /alertas [ver|ack <id>]
 */

import { AlertService } from '../../../application/services/AlertService.types';

export class AlertasCommandHandler {
  constructor(private readonly alertService: AlertService) {}

  async handle(_chatId: number, args?: string): Promise<string> {
    const trimmedArgs = args?.trim();

    if (!trimmedArgs) {
      // Show all active alerts
      return this.showActiveAlerts();
    }

    // Parse command arguments
    const parts = trimmedArgs.split(/\s+/);
    const command = parts[0]?.toLowerCase();

    if (command === 'ack' || command === 'acknowledge') {
      // Acknowledge alert by ID
      const alertId = parts[1];
      if (!alertId) {
        return '❌ Debes proporcionar el ID de la alerta.\nUso: `/alertas ack <id>`';
      }
      return this.acknowledgeAlert(alertId);
    }

    if (command === 'ver' || command === 'show') {
      // Show all active alerts
      return this.showActiveAlerts();
    }

    // Unknown command
    return `❌ Comando no reconocido: "${command}"\n\nComandos disponibles:\n- \`/alertas\` - Muestra alertas activas\n- \`/alertas ver\` - Muestra alertas activas\n- \`/alertas ack <id>\` - Marca una alerta como revisada`;
  }

  private async showActiveAlerts(): Promise<string> {
    const alerts = await this.alertService.getActiveAlerts();

    if (alerts.length === 0) {
      return '✅ No hay alertas activas. Todo el stock está en orden.';
    }

    // Group alerts by severity
    const high = alerts.filter(a => a.severity === 'high');
    const medium = alerts.filter(a => a.severity === 'medium');
    const low = alerts.filter(a => a.severity === 'low');

    let response = '🚨 *Alertas de Stock*\n\n';

    // High severity first
    if (high.length > 0) {
      response += '🔴 *ALTA PRIORIDAD*\n';
      for (const alert of high) {
        response += this.formatAlert(alert);
      }
      response += '\n';
    }

    // Medium severity
    if (medium.length > 0) {
      response += '🟡 *MEDIA PRIORIDAD*\n';
      for (const alert of medium) {
        response += this.formatAlert(alert);
      }
      response += '\n';
    }

    // Low severity
    if (low.length > 0) {
      response += '🟢 *BAJA PRIORIDAD*\n';
      for (const alert of low) {
        response += this.formatAlert(alert);
      }
      response += '\n';
    }

    response += `📊 Total: ${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}\n`;
    response += `💡 Usa \`/alertas ack <id>\` para marcar como revisada`;

    return response;
  }

  private formatAlert(alert: {
    id: string;
    type: string;
    message: string;
    createdAt: Date;
  }): string {
    const typeIcon = this.getAlertTypeIcon(alert.type);
    const dateStr = alert.createdAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
    return `  ${typeIcon} ${alert.message}\n     ID: \`${alert.id.substring(0, 8)}...\` | ${dateStr}\n`;
  }

  private getAlertTypeIcon(type: string): string {
    switch (type) {
      case 'low_stock':
        return '📉';
      case 'depletion_risk':
        return '⏰';
      case 'anomaly':
        return '📈';
      default:
        return '⚠️';
    }
  }

  private async acknowledgeAlert(alertId: string): Promise<string> {
    try {
      await this.alertService.acknowledgeAlert(alertId);
      return `✅ Alerta \`${alertId.substring(0, 8)}...\` marcada como revisada.`;
    } catch (error) {
      return `❌ No se pudo marcar la alerta como revisada. Verifica el ID.`;
    }
  }
}
