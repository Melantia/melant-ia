# 🚀 Guía de Integración - Candado de Fidelidad 12/12

## Checklist de Implementación

Use esta checklist para integrar el Candado 12/12 con su sistema de pagos.

### ✅ FASE 1: VERIFICACIÓN (Hoy)

- [x] Sintaxis validada en main_controller.js
- [x] Funciones disponibles: registrarPago(), canUnlockAlcancia(), reiniciarFidelidadEnero()
- [x] UI actualizada en abrirAlforjaVirtualMelantios()
- [x] Narrativa de Don Eloy integrada
- [x] Estado de Melantios extendido con mesesPagados

### 🔴 FASE 2: INTEGRACIÓN CON PAGOS (PRÓXIMO)

- [ ] Identificar punto donde se procesa pago exitoso
- [ ] Obtener referencia a MelantiaController
- [ ] Llamar `registrarPago(descripcion)` después de pago exitoso
- [ ] Manejar respuesta de registrarPago()
- [ ] Hacer tests end-to-end

### 🟡 FASE 3: AUTOMATIZACIÓN (DESPUÉS)

- [ ] Crear scheduled task para enero 1
- [ ] Crear scheduled task para diciembre 1
- [ ] Implementar `procesarLiberacionNavideña()` en diciembre
- [ ] Implementar `bloquearAlcanciaNavideña()` en enero
- [ ] Añadir notificaciones a usuarios

### 🟢 FASE 4: MONITOREO (PRODUCCIÓN)

- [ ] Dashboard de fidelidad por socio
- [ ] Alertas de socios en riesgo (meses < 6/12)
- [ ] Reporte de cohortes de fidelidad
- [ ] Métrica: % de socios completando 12/12

---

## Puntos de Integración

### 1️⃣ MÓDULO DE PAGOS - Registrar Pago

**Dónde:** Cualquier punto donde se procesa pago exitoso  
**Cuándo:** DESPUÉS de confirmar que el pago fue procesado  
**Qué:** Llamar `registrarPago()`

```javascript
// ✅ IMPLEMENTAR AQUÍ
import { MelantiaController } from './src/main_controller.js';

async function procesarPagoSuscripcion(socioId, monto, mes, año) {
  try {
    // 1. Procesar pago (tu lógica actual)
    const resultadoPago = await stripe.processPayment(socioId, monto);

    if (resultadoPago.status === 'EXITOSO') {
      // 2. ← NUEVO: Registrar en fidelidad
      const melantia = new MelantiaController();
      const resultadoFidelidad = melantia.registrarPago(
        `Suscripción ${mes}/${año} - $${monto}`
      );

      console.log(`✅ Pago registrado:`, resultadoFidelidad.mensaje);
      // ✅ Pago registrado. Progreso de fidelidad: 5/12 meses

      // 3. Notificar al socio (opcional)
      if (resultadoFidelidad.mesesPagados === 12) {
        enviarNotificacion(
          socioId,
          '🎉 ¡FELICIDADES! Completó 12 meses de fidelidad. En diciembre su alcancía se abre.'
        );
      }

      // 4. Guardar en base de datos
      await guardarPagoEnBD({
        socioId,
        monto,
        mes,
        año,
        fidelidadProgress: resultadoFidelidad.mesesPagados,
        statusFidelidad: resultadoFidelidad.exitoso ? 'REGISTRADO' : 'ERROR',
      });
    }
  } catch (error) {
    console.error('Error al registrar pago:', error);
    // Reintentar o alertar
  }
}
```

**Validación:**

```javascript
// Después de 30 segundos, verificar que se registró
setTimeout(() => {
  const estado = melantia._estadoComunidad();
  console.log('Meses pagados:', estado.melantios.mesesPagados);
  console.assert(
    estado.melantios.mesesPagados > 0,
    'FALLO: registrarPago no funcionó'
  );
}, 30000);
```

---

### 2️⃣ SCHEDULED TASKS - Automatización de Enero y Diciembre

**Dónde:** Backend, cron job o cloud function  
**Cuándo:**

- Enero 1 a las 00:00 (reset fidelidad)
- Diciembre 1 a las 00:00 (liberar automático)

#### Task 1: Reset Fidelidad (Enero 1)

```javascript
// ✅ IMPLEMENTAR AQUÍ - Cron: "0 0 1 1 *" (Enero 1, 00:00)
async function resetearFidelidadEnero() {
  console.log('[CRON] Ejecutando reset de fidelidad - Enero 1');

  const melantia = new MelantiaController();

  // Para cada socio activo
  const socios = await obtenerSociosActivos();

  socios.forEach((socio) => {
    // Cambiar contexto al socio
    melantia.socioActual = socio.id;

    const resultado = melantia.reiniciarFidelidadEnero();

    console.log(`Socio ${socio.id}: Fidelidad reiniciada`);
    console.log(
      `  - Año anterior: ${resultado.historialAnioAnterior.mesesPagados}/12`
    );

    // Registrar en logs
    registrarLog({
      evento: 'FIDELIDAD_RESET',
      socioId: socio.id,
      mesespagadosAnteriores: resultado.historialAnioAnterior.mesesPagados,
      saldoAlcanciaTransferido:
        resultado.historialAnioAnterior.saldoAlcanciaDiciembre,
    });
  });

  console.log('[CRON] Fidelidad de todos los socios reiniciada ✅');
}
```

#### Task 2: Liberar Alcancías (Diciembre 1)

```javascript
// ✅ IMPLEMENTAR AQUÍ - Cron: "0 0 1 12 *" (Diciembre 1, 00:00)
async function liberarAlcancia Diciembre() {
  console.log('[CRON] Ejecutando liberación de alcancías - Diciembre 1');

  const melantia = new MelantiaController();

  // Para cada socio activo
  const socios = await obtenerSociosActivos();

  let resultados = { exitos: 0, bloqueos: 0 };

  socios.forEach(socio => {
    // Cambiar contexto al socio
    melantia.socioActual = socio.id;

    const resultado = melantia.liberarAlcanciaNavideña();

    if (resultado.permitido) {
      console.log(`✅ Socio ${socio.id}: Alcancía liberada (${resultado.saldoLiberado}M)`);
      resultados.exitos++;

      // Notificar al socio
      enviarNotificacion(socio.id,
        `🎄 ¡Feliz Navidad! Tu alcancía se abrió con ${resultado.saldoLiberado}M`
      );
    } else {
      console.log(`❌ Socio ${socio.id}: Alcancía BLOQUEADA (${resultado.razon})`);
      resultados.bloqueos++;

      // Notificar al socio
      enviarNotificacion(socio.id,
        `⚠️ Tu alcancía no se puede abrir. Razón: ${resultado.razon}`
      );
    }

    // Registrar en logs
    registrarLog({
      evento: 'LIBERAR_ALCANCIA_DICIEMBRE',
      socioId: socio.id,
      permitido: resultado.permitido,
      razon: resultado.razon,
      saldoLiberado: resultado.saldoLiberado || 0
    });
  });

  console.log(`[CRON] Liberación completada: ${resultados.exitos} exitosos, ${resultados.bloqueos} bloqueados ✅`);
}
```

**Configurar en tu backend:**

Si usas **node-cron:**

```javascript
import cron from 'node-cron';

// Enero 1 - Reset
cron.schedule('0 0 1 1 *', resetearFidelidadEnero);

// Diciembre 1 - Liberar
cron.schedule('0 0 1 12 *', liberarAlcanciaDiciembre);
```

Si usas **Firebase Cloud Scheduler:**

```
Cron: 0 0 1 * * (Ejecuta función diariamente a las 00:00)
Función: resetearFidelidadEnero() si es enero, liberarAlcanciaDiciembre() si es diciembre
```

---

### 3️⃣ VALIDACIÓN EN TIENDA - Antes de Canje

**Dónde:** Sistema de Tienda, antes de permitir canje de Melantios  
**Cuándo:** Usuario intenta canjear Melantios

```javascript
// ✅ IMPLEMENTAR AQUÍ
async function permitirCanjeEnTienda(socioId, montoCanje) {
  const melantia = new MelantiaController();

  // 1. Validar que pueda desbloquear (solo diciembre con 12/12)
  const validacion = melantia.canUnlockAlcancia();

  if (!validacion.puedDesbloquear) {
    return {
      permitido: false,
      razonesBloqueo: validacion.razonesBloqueo,
      mensaje: `No puede canjear. Razones: ${validacion.razonesBloqueo.join(', ')}`,
    };
  }

  // 2. Validar saldo disponible
  const estado = melantia._estadoComunidad();
  if (estado.melantios.saldoActual < montoCanje) {
    return {
      permitido: false,
      mensaje: `Saldo insuficiente. Tiene ${estado.melantios.saldoActual}M, necesita ${montoCanje}M`,
    };
  }

  // 3. Validar límite 50% (si aplica)
  const MAX_PERCENTAJE_CANJE = 0.5;
  if (montoCanje / estado.melantios.saldoActual > MAX_PERCENTAJE_CANJE) {
    return {
      permitido: false,
      mensaje: `Límite: máximo 50% de compra en Melantios (${estado.melantios.saldoActual * 0.5}M máximo)`,
    };
  }

  // 4. Si todo OK, permitir canje
  return {
    permitido: true,
    saldoFinal: estado.melantios.saldoActual - montoCanje,
  };
}
```

---

### 4️⃣ DASHBOARD DE MONITOREO

**Dónde:** Admin panel o analítica  
**Qué mostrar:**

```javascript
async function obtenerMetricasFidelidad() {
  const socios = await obtenerSociosActivos();
  const ahora = new Date().getMonth() + 1; // mes actual

  let metricas = {
    totalSocios: socios.length,
    completados12_12: 0,
    enRiesgo: [],     // < 6/12 meses
    promediomeses: 0,
    distribucionPor Mes: {}
  };

  socios.forEach(socio => {
    const estado = socio.estado.melantios;
    const meses = estado.mesesPagados;

    if (meses === 12) metricas.completados12_12++;
    if (meses < 6) metricas.enRiesgo.push(socio.id);

    metricas.promedioMeses += meses;
    metricas.distribucionPorMes[meses] = (metricas.distribucionPorMes[meses] || 0) + 1;
  });

  metricas.promedioMeses /= socios.length;

  console.log(`📊 MÉTRICAS DE FIDELIDAD`);
  console.log(`  Total Socios: ${metricas.totalSocios}`);
  console.log(`  Completados 12/12: ${metricas.completados12_12} (${((metricas.completados12_12 / metricas.totalSocios) * 100).toFixed(1)}%)`);
  console.log(`  En Riesgo (<6/12): ${metricas.enRiesgo.length}`);
  console.log(`  Promedio Meses: ${metricas.promedioMeses.toFixed(1)}/12`);
  console.log(`  Distribución:`, metricas.distribucionPorMes);

  return metricas;
}
```

---

## Checklist de Testing

### Test Local (Navegador)

```javascript
// 1. Ejecutar TEST_FIDELIDAD_12_12.js
// Copiar todo el contenido y ejecutar en consola
// Debería ver: ✅ TEST 1, ✅ TEST 2, ..., ✅ TEST 10

// 2. Verificar estado
window.MelantiaAsistente._estadoComunidad().melantios;
// Debería tener: saldoActual, mesesPagados, historialPagos

// 3. Simular pago
window.MelantiaAsistente.registrarPago('Test Pago');
// Debería retornar: { exitoso: true, mesesPagados: 1, ... }

// 4. Abrir Alforja
window.MelantiaAsistente.abrirAlforjaVirtualMelantios();
// Debería mostrar: "🔐 Candado de Fidelidad 12/12" con barra X/12
```

### Test End-to-End (Producción)

1. [ ] Usuario paga suscripción → `registrarPago()` se ejecuta
2. [ ] mesesPagados incrementa correctamente
3. [ ] Barra de progreso se actualiza en Alforja
4. [ ] Año 12: Diciembre muestra "✅ Requisito cumplido"
5. [ ] Enero: Reset automático a 0/12
6. [ ] Usuario sin 12 meses: Bloqueo "se queda viendo desde afuera"

---

## Troubleshooting de Integración

| Problema                              | Solución                                                      |
| ------------------------------------- | ------------------------------------------------------------- |
| `registrarPago is not defined`        | Importa MelantiaController correctamente                      |
| `mesesPagados no incrementa`          | Verifica que registrarPago() se llame DESPUÉS de pago exitoso |
| `TypeError: historialPagos undefined` | Verifica estado inicial en \_estadoComunidad()                |
| `Alcancía no se libera`               | Ejecuta canUnlockAlcancia() para ver razones de bloqueo       |
| `Don Eloy no habla`                   | Verifica síntesis de voz en navegador (F12 → Console)         |

---

## Archivos de Referencia

- **CANDADO_FIDELIDAD_12_12.md** - Especificación técnica
- **FIDELIDAD_API_REFERENCE.md** - Referencia de API
- **TEST_FIDELIDAD_12_12.js** - Tests automáticos
- **FIDELIDAD_12_12_FAQ.md** - Preguntas frecuentes
- **main_controller.js** - Implementación (líneas 1111+, 1190+, 6283+, 6444+)

---

## Contacto

Para problemas de integración, consulta:

1. FAQ: FIDELIDAD_12_12_FAQ.md
2. Logs de consola: F12 → Console → busca "Candado"
3. Estado actual: `window.MelantiaAsistente._estadoComunidad().melantios`

---

**Versión Guía:** 1.0  
**Estado:** Listo para integrar  
**Próximo paso:** Integrar registrarPago() en módulo de pagos
