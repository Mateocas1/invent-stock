/**
 * Help Command Handler
 *
 * Handles the /help command with comprehensive documentation.
 */

export class HelpCommandHandler {
  async handle(_chatId: number, topic?: string): Promise<string> {
    const trimmedTopic = topic?.trim().toLowerCase();

    switch (trimmedTopic) {
      case 'registrar':
      case 'register':
        return this.getRegistrarHelp();
      case 'ajuste':
      case 'adjust':
        return this.getAjusteHelp();
      case 'stock':
        return this.getStockHelp();
      case 'alertas':
      case 'alerts':
        return this.getAlertasHelp();
      case 'historial':
      case 'history':
        return this.getHistorialHelp();
      case 'errores':
      case 'errors':
        return this.getErrorsHelp();
      default:
        return this.getMainHelp();
    }
  }

  private getMainHelp(): string {
    return `
📚 *Ayuda del Sistema de Stock*

Soy tu asistente para control de inventario. Te ayudo a gestionar stock de productos, predecir cuándo se agotarán y alertarte antes de que falten insumos.

📌 *Comandos Principales:*

/start
   Inicializa el bot y muestra bienvenida

/registrar <servicio> [cliente] [ajustes]
   Registra un servicio y descuenta stock automáticamente
   Ejemplo: \`/registrar Soft\\ Gel María\`

/ajuste <producto> <cantidad> [razón]
   Ajusta stock manualmente
   Ejemplo: \`/ajuste tips -3 "uñas rotas"\`

/stock [producto|tips]
   Consulta stock con predicción
   Ejemplo: \`/stock tips\`

/alertas [ver|ack <id>]
   Muestra alertas activas
   Ejemplo: \`/alertas ack abc123\`

/historial [producto] [--dias N]
   Muestra historial de movimientos
   Ejemplo: \`/historial tips --dias 7\`

/help [tema]
   Muestra esta ayuda o ayuda específica
   Temas: registrar, ajuste, stock, alertas, historial, errores

💡 *Tips Rápidos:*
  • Los nombres con espacios usan \\: Soft\\ Gel
  • Ajustes positivos: +10 para reposición
  • Usa /alertas regularmente para evitar quiebres

👉 Escribe \`/help <tema>\` para más detalles
`;
  }

  private getRegistrarHelp(): string {
    return `
📋 *Ayuda: /registrar*

Registra un servicio realizado y descuenta automáticamente el stock según la receta configurada.

*Formato:*
\`/registrar <servicio> [cliente] [--ajustes "producto:cantidad,..."]\`

*Parámetros:*
  • \`<servicio>\` - Nombre del servicio (obligatorio)
  • \`[cliente]\` - Nombre del cliente (opcional)
  • \`[--ajustes]\` - Modificaciones a la receta (opcional)

*Ejemplos:*

1️⃣ Servicio simple:
   \`/registrar Soft Gel\`

2️⃣ Con nombre de cliente:
   \`/registrar Capping Gel Ana\`

3️⃣ Con ajustes a la receta:
   \`/registrar Esculpidas María --ajustes "tips:2,monomero:5"\`

4️⃣ Servicio con espacios en el nombre:
   \`/registrar Soft\\ Gel María\`

💡 *Tip:* Los ajustes se suman a la receta base. Usa números negativos para consumir menos.
`;
  }

  private getAjusteHelp(): string {
    return `
⚖️ *Ayuda: /ajuste*

Ajusta manualmente el stock de un producto. Útil para correcciones, reposiciones o ajustes por pérdida.

*Formato:*
\`/ajuste <producto> <cantidad> [razón]\`

*Parámetros:*
  • \`<producto>\` - Nombre del producto (obligatorio)
  • \`<cantidad>\` - Cantidad a ajustar (obligatorio)
  • \`[razón]\` - Motivo del ajuste (opcional)

*Signos:*
  • \`+10\` - Incrementa 10 unidades (reposición)
  • \`-5\` - Decrementa 5 unidades (pérdida)

*Ejemplos:*

1️⃣ Reposición de stock:
   \`/ajuste tips +50 "reposición proveedor"\`

2️⃣ Ajuste por pérdida:
   \`/ajuste monomero -10 "derrame"\`

3️⃣ Corrección simple:
   \`/ajuste esmalte rojo +5\`

⚠️ *Nota:* Los ajustes quedan registrados en el historial.
`;
  }

  private getStockHelp(): string {
    return `
📊 *Ayuda: /stock*

Consulta el estado del inventario. Muestra stock actual, predicciones de duración y alertas.

*Formato:*
\`/stock [producto|tips]\`

*Opciones:*
  • Sin parámetros - Muestra resumen de todo el inventario
  • \`<producto>\` - Detalle de un producto específico
  • \`tips\` - Muestra consejos de reabastecimiento

*Ejemplos:*

1️⃣ Ver todo el inventario:
   \`/stock\`

2️⃣ Ver un producto específico:
   \`/stock tips\`
   \`/stock Soft Gel\`

3️⃣ Ver consejos de reabastecimiento:
   \`/stock tips\`

*Información mostrada:*
  • Stock actual y mínimo
  • Estado: OK / Bajo / Crítico
  • Predicción de duración
  • Consumo diario estimado
  • Tendencia de consumo

🔮 *La predicción* mejora con más datos de consumo.
`;
  }

  private getAlertasHelp(): string {
    return `
🚨 *Ayuda: /alertas*

Gestiona alertas de stock bajo o agotado.

*Formato:*
\`/alertas [ver|ack <id>]\`

*Opciones:*
  • Sin parámetros - Muestra todas las alertas activas
  • \`ver\` - Muestra solo alertas no leídas
  • \`ack <id>\` - Marca una alerta como reconocida

*Ejemplos:*

1️⃣ Ver todas las alertas:
   \`/alertas\`

2️⃣ Ver solo alertas no leídas:
   \`/alertas ver\`

3️⃣ Marcar alerta como reconocida:
   \`/alertas ack abc123\`

*Tipos de alertas:*
  🔴 *Crítico* - Stock agotado (0 unidades)
  🟡 *Bajo* - Stock por debajo del mínimo

💡 *Tip:* Reconocer alertas no elimina el problema, solo marca que lo viste.
`;
  }

  private getHistorialHelp(): string {
    return `
📜 *Ayuda: /historial*

Muestra el historial de movimientos de un producto o actividad general.

*Formato:*
\`/historial [producto] [--dias N]\`

*Parámetros:*
  • \`[producto]\` - Nombre del producto (opcional)
  • \`[--dias N]\` - Días a analizar (default: 7)

*Ejemplos:*

1️⃣ Actividad reciente (todos los productos):
   \`/historial\`

2️⃣ Historial de un producto:
   \`/historial tips\`

3️⃣ Últimos 14 días:
   \`/historial tips --dias 14\`

4️⃣ Producto con espacios:
   \`/historial Soft\\ Gel --dias 7\`

*Información mostrada:*
  • Movimientos detallados por fecha
  • Total consumido
  • Total ajustado
  • Total repuesto
  • Promedio diario
  • Días con actividad

🔍 *Tip:* Útil para identificar patrones de consumo.
`;
  }

  private getErrorsHelp(): string {
    return `
❓ *Ayuda: Códigos de Error*

Lista de errores comunes y cómo solucionarlos.

*Códigos de Error:*

❌ *SERVICE_NOT_FOUND*
   El servicio especificado no existe.
   *Solución:* Usa el nombre exacto. Ver con \`/help registrar\`

❌ *PRODUCT_NOT_FOUND*
   El producto especificado no existe.
   *Solución:* Verifica el nombre con \`/stock\`

❌ *INSUFFICIENT_STOCK*
   No hay suficiente stock para el servicio.
   *Solución:* 
     1. Reponer stock: \`/ajuste <producto> +<cantidad>\`
     2. Ajustar receta si es incorrecta

❌ *VALIDATION_ERROR*
   Datos ingresados incorrectos.
   *Solución:* Revisa el formato del comando.

💡 *Consejos:*
  • Los nombres con espacios usan \\: Soft\\ Gel
  • Verifica el stock antes de registrar servicios
  • Usa \`/stock <producto>\` para ver disponibilidad

🆘 ¿Problemas persistentes? Contacta soporte.
`;
  }
}
