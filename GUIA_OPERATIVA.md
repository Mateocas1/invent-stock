# 📚 Guía Operativa - Sistema de Stock para Salón de Manicura

## ¡Bienvenida al Sistema!

Este sistema te ayuda a llevar el control de tu stock automáticamente, te avisa antes de que se te acaben los insumos, y te predice cuándo vas a necesitar reponer.

---

## 🎯 ¿Para qué sirve este sistema?

| Función                       | Beneficio                                          |
| ----------------------------- | -------------------------------------------------- |
| **Registrar servicios**       | Descuenta automáticamente los insumos usados       |
| **Consultar stock**           | Sabés cuánto tenés de cada producto en tiempo real |
| **Predicción de agotamiento** | Te dice cuándo se te va a terminar cada producto   |
| **Alertas automáticas**       | Te avisa cuando un producto está bajo              |
| **Historial de movimientos**  | Registro de todo lo que entra y sale               |
| **Detección de anomalías**    | Te alerta si estás usando más de lo normal         |

---

## 📦 PRODUCTOS PRECARGADOS

El sistema ya viene con estos productos:

| Categoría        | Productos                                             |
| ---------------- | ----------------------------------------------------- |
| **Uñas**         | Tips (uñas), lima, cortatips, pinza                   |
| **Líquidos**     | Esmalte base, top coat, primer, removedor de cutícula |
| **Geles**        | Gel para capping, glitter varios colores              |
| **Herramientas** | Lámpara UV/LED, cabina de secado, brochas             |
| **Insumos**      | Toallitas sin pelusa, alcohol isopropílico            |

---

## 💅 SERVICIOS PRECARGADOS

El sistema ya tiene las recetas de estos servicios:

| Servicio                  | Consumo aproximado                                  |
| ------------------------- | --------------------------------------------------- |
| **Soft Gel**              | 1 tip, 0.5ml esmalte base, 0.3ml top coat, 0.1 lima |
| **Capping Gel**           | 5g gel, 0.3ml esmalte base, 0.1 lima                |
| **Uñas Esculpidas**       | 2g polvo acrílico, 1ml líquido acrílico, 1 lima     |
| **Kapping Gel**           | 4g gel, 0.4ml esmalte base, 0.1 lima                |
| **Esmaltado Tradicional** | 0.3ml esmalte base, 0.5ml esmalte color             |
| **Semi Permanente**       | 0.5ml esmalte base, 0.5ml semi, 0.3ml top coat      |
| **Russian Manicure**      | 0.2ml removedor cutícula, 0.1 lima                  |
| **Pedicure**              | 0.3ml esmalte base, 0.5ml esmalte color             |
| **Remoción**              | 20ml acetona, 0.1 lima                              |
| **Reparación**            | 1 tip o 0.5g gel, según el caso                     |

---

## 📋 FLUJO DE TRABAJO DIARIO

### Al empezar el día (5 minutos)

```
1. Abrí Telegram
2. Buscá tu bot
3. Enviá: /start
4. Revisá: /stock
```

Esto te muestra el estado actual de todos los productos y te alerta si algo está bajo.

---

### Durante el día (al terminar cada servicio)

```
/restart Soft\ Gel María
```

**¿Qué hace este comando?**

- Busca la receta de "Soft Gel"
- Descuenta automáticamente los insumos
- Registra el consumo en el historial
- Verifica si quedó algún producto bajo y te alerta

**Formato del comando:**

```
/registrar <servicio> <cliente> [--ajustes "..."]
```

| Parte        | Ejemplo   | Explicación                                          |
| ------------ | --------- | ---------------------------------------------------- |
| `<servicio>` | Soft\ Gel | Nombre del servicio (con backslash si tiene espacio) |
| `<cliente>`  | María     | Nombre de la clienta (opcional)                      |
| `--ajustes`  | "tips:+2" | Si usaste más o menos de lo normal                   |

---

### Ejemplos de uso

#### Servicio simple

```
/registrar Soft\ Gel Ana
```

Descuenta automáticamente: 1 tip, 0.5ml esmalte base, 0.3ml top coat, 0.1 lima

#### Servicio con ajuste (usaste más tips)

```
/registrar Capping\ Gel Laura --ajustes "tips:+1 gel:+2g"
```

Descuenta lo de la receta MÁS 1 tip adicional y 2g de gel adicionales

#### Servicio con ajuste negativo (usaste menos)

```
/registrar Soft\ Gel Carmen --ajustes "esmalte_base:-0.2"
```

Descuenta 0.5ml - 0.2ml = 0.3ml de esmalte base

---

### Al final del día (2 minutos)

```
/alertas
```

Te muestra qué productos están bajos o cerca de agotarse.

---

## 🛒 CÓMO CARGAR STOCK

### Opción 1: Forma larga (recomendada)

```
/ajuste tips +50 "reposición mensual"
```

| Parte        | Ejemplo                         |
| ------------ | ------------------------------- |
| `<producto>` | tips                            |
| `<cantidad>` | +50 (positivo = sumar)          |
| `[razón]`    | "reposición mensual" (opcional) |

### Opción 2: Forma corta

```
/ajuste esmalte_base +100
```

### Ejemplos comunes

| Situación               | Comando                                    |
| ----------------------- | ------------------------------------------ |
| Compré una caja de tips | `/ajuste tips +50 "compra proveedor"`      |
| Se me cayó un esmalte   | `/ajuste esmalte_base -1 "derrame"`        |
| Reposición general      | `/ajuste lima +10 "reposición"`            |
| Conteo de inventario    | `/ajuste top_coat =80 "ajuste por conteo"` |

---

## 📊 CONSULTAS

### Ver todo el stock

```
/stock
```

Muestra todos los productos ordenados por urgencia (los que se acaban primero primero).

### Ver un producto específico

```
/stock tips
```

Muestra:

- Stock actual
- Predicción de cuándo se agota
- Nivel de confianza de la predicción
- Tendencia de consumo (subiendo/bajando/estable)

### Ver productos urgentes

```
/stock tips
```

Solo muestra los productos con menos de 7 días de stock.

---

## 🚨 ALERTAS

### Ver alertas activas

```
/alertas
```

Te muestra 3 tipos de alertas:

| Tipo                      | Cuándo aparece            | Ejemplo                                 |
| ------------------------- | ------------------------- | --------------------------------------- |
| **Stock bajo**            | Stock < mínimo            | "Tips: quedan5 (mínimo: 10)"            |
| **Riesgo de agotamiento** | Predicción ≤7 días        | "Esmalte: se agota en 5 días"           |
| **Anomalía**              | Consumo >20% del promedio | "Gel: consumiste 25% más que lo normal" |

### Reconocer una alerta

```
/alertas ack 1
```

Marcala como "ya la vi" para que no te siga apareciendo.

---

## 📈 HISTORIAL

### Ver movimientos de un producto

```
/historial tips
```

Muestra los últimos 7 días de movimientos con:

- Qué se consumió
- Qué se repuso
- Qué se ajustó
- Promedio diario

### Ver más días

```
/historial tips --dias 14
```

---

## ⚠️ AJUSTES Y CORRECCIONES

### Si te equivocaste al registrar un servicio

**Ejemplo**: Registraste "Soft Gel" pero era "Capping"

**Solución**:

1. Ajustá manualmente cada producto:
   ```
   /ajuste tips +1 "error: era capping, no soft gel"
   /ajuste esmalte_base +0.5 "error: era capping"
   ```
2. Y descontá lo del servicio correcto:
   ```
   /registrar Capping\ Gel [cliente]
   ```

### Si el stock real no coincide con el sistema

Hacé un **ajuste de inventario**:

```
/ajuste tips =48 "conteo de inventario"
```

El `=`setea el valor exacto (no suma/resta).

---

## 🔄 FLUJO SEMANAL RECOMENDADO

### Día 1 (Lunes) - Planning

```
/stock tips
/alertas
```

Revisá qué productos necesita esta semana.

### Día a día - Operación

```
/registrar [servicio] [cliente]
```

Después de cada clienta.

### Día 7 (Domingo) - Revisión

```
/historial tips --dias7
/historial esmalte_base --dias7
/stock
```

Revisá el consumo de la semana y planificá compras.

---

## 💡 MEJORES PRÁCTICAS

### ✅ HACER

| Práctica                              | Por qué                              |
| ------------------------------------- | ------------------------------------ |
| Registrar cada servicioinmediatamente | Evita olvidos                        |
| Usar nombres de clienta               | Te ayuda a rastrear si hay problemas |
| Ajustar si usaste más o menos         | Mejora la predicción                 |
| Revisar alertas a diario              | No te agarra desprevenida            |
| Hacer conteo de inventario semanal    | Corrige desviaciones                 |

### ❌ NO HACER

| Práctica                                           | Problema                              |
| -------------------------------------------------- | ------------------------------------- |
| Acumular varios servicios y registrar todos juntos | Se olvidan ajustes                    |
| No poner razón en ajustes                          | Después no recordás por qué ajustaste |
| Ignorar alertas por semanas                        | Te agarras sin stock                  |
| No usar la predicción                              | Perdés la ventaja del sistema         |

---

## 🔧 PERSONALIZACIÓN

### Agregar un nuevo producto

Por ahora los productos están hardcodeados. Para agregar uno nuevo, contactá al desarrollador.

### Modificar la receta de un servicio

Por ahora las recetas están hardcodeadas. Para modificar, contactá al desarrollador.

### Cambiar el umbral mínimo de alerta

Por ahora es 10 unidades para productos de "unidades" y 20ml/20g para líquidos.

---

## 📱 COMANDOS RESUMEN

| Comando             | Qué hace                               | Ejemplo                         |
| ------------------- | -------------------------------------- | ------------------------------- |
| `/start`            | Mensaje de bienvenida                  | `/start`                        |
| `/registrar`        | Registra un servicio y descuenta stock | `/registrar Soft\ Gel María`    |
| `/ajuste`           | Ajusta stock manualmente               | `/ajuste tips +50 "reposición"` |
| `/stock`            | Consulta stock con predicción          | `/stock tips`                   |
| `/alertas`          | Muestra alertas activas                | `/alertas`                      |
| `/alertas ack <id>` | Reconoce una alerta                    | `/alertas ack 1`                |
| `/historial`        | Muestra historial de movimientos       | `/historial tips --dias7`       |
| `/help`             | Muestra ayuda completa                 | `/help`                         |

---

## 🆘 PROBLEMAS COMUNES

### El bot no responde

1. Verificá que el bot esté activo en Telegram
2. Esperá1-2 minutos (Railway puede tener cold start)
3. Probá con `/start` de nuevo

### El stock no coincide con la realidad

1. Hacé un ajuste de inventario: `/ajuste [producto] = [cantidad] "conteo"`
2. Revisá el historial: `/historial [producto] --dias7`
3. Identificá dónde está la diferencia

### La predicción dice "baja confianza"

- Necesitás más días de historial (mínimo 7)
- Después de 2 semanas, la predicción será más precisa

### No me llegan alertas

- Las alertas aparecen cuando usás `/alertas`
- El sistema no manda mensajes automáticos (por ahora)
- Revisá `/alertas` al menos una vez por día

---

## 📞 SOPORTE

Si tenés problemas o sugerencias:
-Abrí un issue en GitHub: https://github.com/Mateocas1/invent-stock/issues

- O contactá al desarrollador directamente

---

## 🎉 ¡A USARLO!

El sistema está listo. Empezá con:

```
/start
/stock
/registrar Soft\ Gel Primera\ Clienta
```

¡Listo para controlar tu stock!💅
