# API de Fidelidad 12/12 - Referencia Rápida

## Uso desde el Módulo de Pagos

### Cuando un pago de suscripción es exitoso:

```javascript
// En tu módulo de procesamiento de pagos
import MelantiaController from './main_controller.js';

const controller = new MelantiaController();

// PASO 1: Procesar pago normalmente
const resultadoPago = procesarPagoSuscripcion(socioId, monto);

// PASO 2: Si pago exitoso, registrar en fidelidad
if (resultadoPago.exitoso) {
  const resultadoFidelidad = controller.registrarPago(
    `Suscripción ${new Date().toLocaleString('es-EC')}`
  );

  console.log(`✅ ${resultadoFidelidad.mensaje}`);
  // ✅ Pago registrado. Progreso de fidelidad: 5/12 meses

  // Opcional: Enviar notificación al socio
  if (resultadoFidelidad.mesesPagados === 12) {
    enviarNotificacionAlSocio(
      socioId,
      '🎉 Completó 12 meses de fidelidad. Su alcancía se abrirá en diciembre!'
    );
  }
}
```

---

## Cuando usuario intenta acceder a alcancía

```javascript
// En tu interfaz de alcancía
const validacion = controller.canUnlockAlcancia();

if (!validacion.puedDesbloquear) {
  console.log(`❌ No puede desbloquear por:`, validacion.razonesBloqueo);
  // ["tiene_12_pagos", "es_diciembre"]
  return mostrarMensajeBloqueo(validacion);
}

// Proceder con liberación
const resultado = controller.liberarAlcanciaNavideña();
console.log(resultado.mensaje);
```

---

## Reset anual (enero 1)

```javascript
// En scheduled task que corra el 1 de enero
const resultado = controller.reiniciarFidelidadEnero();

if (resultado.exitoso) {
  console.log(`✅ Fidelidad reiniciada para nuevo año`);
  console.log(
    `📊 Histórico del año anterior:`,
    resultado.historialAnioAnterior
  );

  // El sistema está listo para la próxima ronda de acumulación
}
```

---

## Retornar estado completo

```javascript
// Para dashboards o reportes
const estado = controller._estadoComunidad();

const fidelidadInfo = {
  mesesPagados: estado.melantios.mesesPagados,
  mesesFaltantes: 12 - estado.melantios.mesesPagados,
  porcentajeAvance: (estado.melantios.mesesPagados / 12) * 100,
  bloqueado: estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago,
  historialPagos: estado.melantios.historialPagos,
  saldoAlcancia: estado.melantios.alcanciaNavideña.saldoAcumulado,
};

console.log(fidelidadInfo);
```

---

## Casos de Uso Específicos

### Case 1: Mostrar progreso en UI

```javascript
const progreso = controller._estadoComunidad().melantios.mesesPagados;
const barra = '█'.repeat(progreso) + '░'.repeat(12 - progreso);
console.log(`Fidelidad: [${barra}] ${progreso}/12`);
```

### Case 2: Validar antes de permitir canje

```javascript
const puede = controller.canUnlockAlcancia().puedDesbloquear;
if (!puede) {
  throw new Error('Usuario no cumple requisitos para canje');
}
permitirCanje(socioId);
```

### Case 3: Recuperar historial de pagos

```javascript
const estado = controller._estadoComunidad();
const pagos = estado.melantios.historialPagos;
pagos.forEach((p) => {
  console.log(`${p.mes}/${p.anio}: ${p.descripcion}`);
});
```

---

## Errores Comunes

| Error                         | Solución                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `historialPagos undefined`    | Asegurar que estado esté inicializado en \_estadoComunidad()      |
| `mesesPagados no incrementa`  | Verificar que registrarPago() se llame DESPUÉS de pago exitoso    |
| `Alcancía no se abre en dic`  | Validar que canUnlockAlcancia().puedDesbloquear === true          |
| `Contador no reinicia en ene` | Llamar reiniciarFidelidadEnero() explícitamente en scheduled task |

---

## Estado del Sistema

```javascript
// Estructura actual en localStorage bajo 'estadoComunidad'
{
  melantios: {
    saldoActual: 0,           // Melantios disponibles para canje
    mesesPagados: 5,          // 0-12 contador de fidelidad
    historialPagos: [
      { mes: 1, anio: 2024, descripcion: "Suscripción", fechaPago: "2024-01-15T..." },
      { mes: 2, anio: 2024, descripcion: "Suscripción", fechaPago: "2024-02-15T..." },
      // ...
    ],
    alcanciaNavideña: {
      saldoAcumulado: 5000,         // Bloqueado hasta diciembre
      estado: 'ACUMULANDO',         // o 'LIBERADO_EN_DICIEMBRE'
      requisito12_12Cumplido: true, // Si mesesPagados === 12
      bloqueoPorFaltaPago: false,   // Si mesesPagados < 12
      historialDepositos: [
        { fecha: "2024-01-20T...", tipo: "Historia", cantidad: 25 },
        // ...
      ],
    }
  }
}
```

---

**Última actualización:** 2024
