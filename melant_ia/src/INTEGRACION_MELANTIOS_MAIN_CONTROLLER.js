/**
 * INTEGRACIÓN MELANTIOS EN MAIN_CONTROLLER.JS
 * 
 * Este archivo documenta dónde y cómo integrar los Melantios
 * en el controlador principal de la aplicación.
 * 
 * Actualizado: 9 de mayo de 2026
 */

// ===== 1. CARGAR CONFIGURACIÓN AL INICIO =====
// En la función initialize() o _init():
function initMelantios() {
  // Cargar config desde JSON
  const MELANTIOS_CONFIG = {
    ICON_PATH: '/src/assets/ui/icons/melantio_gold.svg',
    EXCHANGE_RATE: 0.01,      // 1 M = $0.01
    CONVERSION: 100,           // 100 M = $1
    MAX_PAYMENT_PCT: 0.5,      // 50% máximo
    EXPIRATION_DAYS: 90,       // Vencimiento
  };

  window.MelantiaAsistente.MELANTIOS_CONFIG = MELANTIOS_CONFIG;
}

// ===== 2. AGREGAR ESTADO DE MELANTIOS EN _estadoComunidad() =====
// En la función _estadoComunidad(), agregar esta estructura:

/*
  melantios: {
    saldoActual: 0,
    historialGanancia: [],      // [{tipo, cantidad, fecha, estado}]
    historialGasto: [],         // [{tipo, cantidad, fecha, tienda}]
    ultimaActualizacion: '',
    vencimiento: '',            // Fecha de expiración
    diasRestantes: 0,
    encaje: {
      totalEnCirculacion: 0,
      valorDolarEquivalente: 0,
      reservaReal: 0
    }
  }
*/

// ===== 3. FUNCIONES DE SISTEMA MELANTIOS =====
// Agregar estos métodos en MelantiaAsistente:

  /**
   * Ganar Melantios en cascada (Socio + Padrino + Presidente)
   */
  ganarMelantioCascada(tipoRecompensa, idSocio, idPadrino = null, idPresidente = null) {
    const config = {
      loyalty_6_months: { cascada: { socio: 100, padrino: 20, presidente: 10 }, costo_usd: 1.30 },
      folklore_story:   { cascada: { socio: 25,  padrino: 10, presidente: 5 },  costo_usd: 0.40 },
      new_word:         { cascada: { socio: 5,   padrino: 2,  presidente: 1 },  costo_usd: 0.08 },
      health_record:    { cascada: { socio: 10,  padrino: 5,  presidente: 2 },  costo_usd: 0.17 }
    };

    const recompensa = config[tipoRecompensa];
    if (!recompensa) return { error: 'Tipo desconocido' };

    const estado = this._estadoComunidad();
    
    // Registrar ganancia pendiente de validación
    const entrada = {
      id: `melantio-${Date.now()}`,
      tipo: tipoRecompensa,
      timestamp: new Date().toISOString(),
      estado: 'PENDIENTE_VALIDACION_PADRINO',
      distribucion: {
        socio: { id: idSocio, cantidad: recompensa.cascada.socio },
        padrino: { id: idPadrino, cantidad: recompensa.cascada.padrino },
        presidente: { id: idPresidente, cantidad: recompensa.cascada.presidente }
      },
      costoTotal: recompensa.costo_usd,
      vencimiento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    estado.melantios.historialGanancia.push(entrada);
    this._guardarEstadoComunidad(estado);
    
    return { exito: true, entrada, mensajePadrino: `Pendiente validar ${recompensa.cascada.socio}M de ${tipoRecompensa}` };
  }

  /**
   * Validar y liberar Melantios (hace el Padrino)
   */
  validarYLiberarMelantios(idEntrada, idPadrino) {
    const estado = this._estadoComunidad();
    const entrada = estado.melantios.historialGanancia.find(e => e.id === idEntrada);

    if (!entrada) return { error: 'Entrada no encontrada' };
    if (entrada.estado !== 'PENDIENTE_VALIDACION_PADRINO') return { error: 'Ya validada o expirada' };

    // Cambiar estado a LIBERADO
    entrada.estado = 'LIBERADO';
    entrada.fechaLiberacion = new Date().toISOString();

    // Agregar al saldo disponible
    const melantiosAlSocio = entrada.distribucion.socio.cantidad;
    estado.melantios.saldoActual += melantiosAlSocio;

    // Siempre validar vencimiento
    entrada.diasRestantes = Math.floor((new Date(entrada.vencimiento) - new Date()) / (1000 * 60 * 60 * 24));

    this._guardarEstadoComunidad(estado);

    return { 
      exito: true, 
      saldoNuevo: estado.melantios.saldoActual,
      mensaje: `✅ ${melantiosAlSocio}M liberados. Nuevo saldo: ${estado.melantios.saldoActual}M`
    };
  }

  /**
   * Validar vencimiento de Melantios
   */
  validarVencimientoMelantios() {
    const estado = this._estadoComunidad();
    const ahora = new Date();

    estado.melantios.historialGanancia.forEach(entrada => {
      if (entrada.estado !== 'LIBERADO') return;

      const diasRestantes = Math.floor((new Date(entrada.vencimiento) - ahora) / (1000 * 60 * 60 * 24));
      entrada.diasRestantes = diasRestantes;

      if (diasRestantes < 0) {
        // Expiró
        entrada.estado = 'EXPIRADO';
        entrada.estadoFinal = 'Vencido sin usar';
        estado.melantios.saldoActual -= entrada.distribucion.socio.cantidad;
      } else if (diasRestantes < 30) {
        // Alerta: próximo a vencer
        entrada.alerta = 'PROXIMO_AVENCER';
      }
    });

    estado.melantios.ultimaActualizacion = new Date().toISOString();
    this._guardarEstadoComunidad(estado);
  }

  /**
   * Validar canje al 50% (antes de procesar pago)
   */
  validarCanjemelantios(melantiosUsados, precioProducto) {
    const usdEquivalente = melantiosUsados * this.MELANTIOS_CONFIG.EXCHANGE_RATE;
    const montoMaximo = precioProducto * this.MELANTIOS_CONFIG.MAX_PAYMENT_PCT;

    if (usdEquivalente > montoMaximo) {
      return {
        permitido: false,
        mensaje: `❌ Máximo ${Math.round(montoMaximo * 100)}M (50% del precio)`,
        maxMelantiosPermitidos: Math.round(montoMaximo * this.MELANTIOS_CONFIG.CONVERSION)
      };
    }

    const efectivoRequerido = precioProducto - usdEquivalente;
    return {
      permitido: true,
      melantiosUsados,
      usdmelantios: usdEquivalente.toFixed(2),
      efectivo: efectivoRequerido.toFixed(2),
      porcentajeMelantios: ((usdEquivalente / precioProducto) * 100).toFixed(1)
    };
  }

  /**
   * Procesar canje (restar del saldo)
   */
  procesarCanjemelantios(melantiosUsados, descripcion = 'Compra en tienda') {
    const estado = this._estadoComunidad();

    if (melantiosUsados > estado.melantios.saldoActual) {
      return { error: `Saldo insuficiente. Tienes ${estado.melantios.saldoActual}M` };
    }

    estado.melantios.saldoActual -= melantiosUsados;
    estado.melantios.historialGasto.push({
      id: `gasto-${Date.now()}`,
      cantidad: melantiosUsados,
      descripcion,
      fecha: new Date().toISOString(),
      equivalenciaUSD: (melantiosUsados * 0.01).toFixed(2)
    });

    this._guardarEstadoComunidad(estado);
    return { exito: true, saldoRestante: estado.melantios.saldoActual };
  }

  /**
   * Obtener datos para mostrar Alforja Virtual
   */
  obtenerAlforjaVirtual() {
    const estado = this._estadoComunidad();
    return {
      saldo: estado.melantios.saldoActual,
      saldoUSD: (estado.melantios.saldoActual * 0.01).toFixed(2),
      historialGanancia: estado.melantios.historialGanancia,
      historialGasto: estado.melantios.historialGasto,
      ultimaActualizacion: estado.melantios.ultimaActualizacion,
      vencimiento: estado.melantios.vencimiento,
      diasRestantes: estado.melantios.diasRestantes
    };
  }

// ===== 4. INTEGRACIÓN EN FUNCIONES EXISTENTES =====

// En abrirRegistroEvidencia():
function abrirRegistroEvidencia_ConMelantios() {
  // ... código existente ...
  
  // Agregar sección de Alforja Virtual
  const alforja = this.obtenerAlforjaVirtual();
  const htmlAlforja = `
    <article style="background: #FFFBEB; border: 2px solid #FCD34D; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 8px 0; color: #78350F;">
        <img src="${this.MELANTIOS_CONFIG.ICON_PATH}" alt="M" style="width: 24px; height: 18px; margin-right: 4px;" />
        Mi Alforja Virtual
      </h3>
      <div style="font-size: 18px; font-weight: bold; color: #F59E0B;">
        ${alforja.saldo}M <span style="font-size: 12px; color: #666;">(${alforja.saldoUSD} USD)</span>
      </div>
      <div style="font-size: 11px; color: #999; margin-top: 4px;">Vencimiento en ${alforja.diasRestantes} días</div>
    </article>
  `;
  
  // Insertar en el HTML de Registro de Evidencia
  // (después de la sección de documentos, antes del cierre)
  
  // ... resto del código ...
}

// En el comando de voz (escucharOrden):
function integrarVozMelantios(orden) {
  if (orden.includes('cuántos melantios') || orden.includes('mi alforja')) {
    const alforja = this.obtenerAlforjaVirtual();
    return `Tienes ${alforja.saldo} Melantios, que equivalen a ${alforja.saldoUSD} dólares.`;
  }
  
  if (orden.includes('usar melantios') || orden.includes('pagar con melantios')) {
    this.abrirCanjemelantios();
    return 'Abriendo opciones de canje...';
  }
}

// ===== 5. LOCALSTORAGEKEY PARA MELANTIOS =====
_melantiosStorageKey = 'melantia_melantios_estado'

// ===== 6. NARRATIVA DE DON ELOY =====
// En la primera interacción con Melantios:
function primeraMencionMelantios() {
  return `
    ¡Oiga, socio! Vea qué elegancia... Ese rectangulito dorado con la "M" va a ser el símbolo 
    de nuestra fuerza en el campo. Cada vez que ese icono brille en su pantalla, siéntase orgulloso, 
    porque significa que su palabra y su trabajo están valiendo. 
    
    ¡Es la moneda de Melantia, hecha por nosotros y para nosotros!
  `;
}

// ===== 7. CHECKLIST DE IMPLEMENTACIÓN =====
// [ ] Cargar config MELANTIOS_CONFIG en initialize()
// [ ] Agregar estado melantios en _estadoComunidad()
// [ ] Implementar ganarMelantioCascada()
// [ ] Implementar validarYLiberarMelantios()
// [ ] Implementar validarVencimientoMelantios()
// [ ] Implementar validarCanjemelantios()
// [ ] Implementar procesarCanjemelantios()
// [ ] Integrar Alforja Virtual en Registro de Evidencia
// [ ] Integrar con voz (escucharOrden)
// [ ] Mostrar MelantioBadge en header
// [ ] Pruebas en móvil (responsive)
// [ ] Don Eloy explica Melantios en primer acceso

console.log('✅ Melantios listo para integración en main_controller.js');
