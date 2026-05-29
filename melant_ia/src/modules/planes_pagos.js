// planes_pagos.js — Submódulo MELANTIA
// Importar datos y utilidades centrales

import PLANES from './01_suscripciones/planes_beneficios.js';
import { moneda, escapeHtml } from './01_suscripciones/utils.js';

// Utilidad para barra de progreso de días gratuitos
function barraProgresoDiasGratis(restantes, total) {
  const pct = Math.max(0, Math.min(100, Math.round((restantes / total) * 100)));
  return `<div style="background:#F3F4F6;border-radius:8px;height:18px;width:100%;margin:8px 0 0 0;overflow:hidden;">
    <div style="background:#F59E0B;height:100%;width:${pct}%;transition:width 0.5s;"></div>
  </div>`;
}

// Utilidad para mostrar avatar
function avatarUsuario(perfil) {
  if (perfil?.avatar_url) {
    return `<img src="${perfil.avatar_url}" alt="avatar" style="width:54px;height:54px;border-radius:50%;object-fit:cover;margin-right:16px;">`;
  }
  return `<div style="width:54px;height:54px;border-radius:50%;background:#E0E7EF;display:flex;align-items:center;justify-content:center;font-size:2em;color:#64748B;margin-right:16px;">👤</div>`;
}

// Simulación de pago offline (se almacena en localStorage y se sincroniza cuando haya conexión)
function procesarPagoOffline(tipo, planId, monto, modalidad) {
  let pagosPendientes = [];
  try {
    pagosPendientes =
      JSON.parse(localStorage.getItem('pagos_pendientes')) || [];
  } catch {}
  pagosPendientes.push({
    tipo,
    planId,
    monto,
    modalidad: modalidad || 'efectivo',
    fecha: new Date().toISOString(),
    procesado: false,
  });
  localStorage.setItem('pagos_pendientes', JSON.stringify(pagosPendientes));
}

// Simulación de activación de plan offline
function activarPlanOffline(planId) {
  let perfil = null;
  try {
    perfil = JSON.parse(localStorage.getItem('perfil_usuario'));
  } catch {}
  if (!perfil) perfil = {};
  perfil.plan_activo = planId;
  perfil.dias_gratis_restantes = 0;
  perfil.plan_activado_en = new Date().toISOString();
  localStorage.setItem('perfil_usuario', JSON.stringify(perfil));
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  let planesHtml = Object.values(PLANES)
    .map(
      (plan) => `
    <div style="border:1px solid #eee;padding:12px;margin-bottom:10px;border-radius:8px;">
      <strong>${escapeHtml(plan.nombre)}</strong> — ${moneda(plan.precio)}
      <div style="font-size:0.95em;color:#555;">${escapeHtml(plan.enfoque)}</div>
      <ul style="margin:8px 0 0 0;padding-left:18px;">
        ${plan.accesos
          .map(
            (acc) =>
              `<li style='font-size:0.97em;color:#276749;'>${escapeHtml(acc)}</li>`
          )
          .join('')}
      </ul>
      <div style="font-size:0.93em;color:#b45309;margin-top:6px;">${escapeHtml(plan.valorAgregado || '')}</div>
    </div>
  `
    )
    .join('');
  // Simulación de plan actual y días de gratuidad
  let perfil = null;
  let diasGratuitosRestantes = 0;
  let planActual = null;
  try {
    perfil = JSON.parse(localStorage.getItem('perfil_usuario'));
    planActual = perfil?.plan_activo || null;
    diasGratuitosRestantes = perfil?.dias_gratis_restantes ?? 0;
  } catch {}

  // Mensaje de advertencia de días de gratuidad
  let mensajeGratuito = '';
  if (diasGratuitosRestantes > 0 && diasGratuitosRestantes <= 3) {
    mensajeGratuito = `<div style="background:#FEF3C7;color:#B45309;padding:12px 18px;border-radius:8px;margin-bottom:18px;font-weight:bold;">
        ¡Atención! Tus <b>${diasGratuitosRestantes}</b> días de gratuidad están por terminar. Cuando se acaben, no podrás usar los servicios de la app hasta el día 1 del próximo mes, cuando se activan 5 días de gratuidad.
      </div>`;
  } else if (diasGratuitosRestantes === 0) {
    mensajeGratuito = `<div style="background:#FEE2E2;color:#B91C1C;padding:12px 18px;border-radius:8px;margin-bottom:18px;font-weight:bold;">
        Tus días de gratuidad han terminado. Los servicios de la app están bloqueados hasta el día 1 del próximo mes, cuando recibirás 5 días de gratuidad.
      </div>`;
  }

  // Resumen del plan actual
  let resumenPlan = '';
  if (planActual && PLANES[planActual]) {
    const p = PLANES[planActual];
    resumenPlan = `<div style="background:#E0F2FE;color:#0369A1;padding:12px 18px;border-radius:8px;margin-bottom:18px;">
        <b>Tu plan actual:</b> <span style="font-size:1.1em;">${escapeHtml(p.nombre)}</span> — <b>${moneda(p.precio)}</b><br>
        <span style="font-size:0.98em;">${escapeHtml(p.enfoque)}</span>
      </div>`;
  }

  // Tabla comparativa de planes
  // Panel superior con usuario y barra de progreso
  let perfil = null;
  let diasGratuitosRestantes = 0;
  let planActual = null;
  let nombreUsuario = 'Usuario';
  let correoUsuario = '';
  try {
    perfil = JSON.parse(localStorage.getItem('perfil_usuario'));
    planActual = perfil?.plan_activo || null;
    diasGratuitosRestantes = perfil?.dias_gratis_restantes ?? 0;
    nombreUsuario = perfil?.nombre || 'Usuario';
    correoUsuario = perfil?.correo || '';
  } catch {}

  // Notificación para activar suscripción si no tiene plan
  let notificacionActivar = '';
  if (!planActual) {
    notificacionActivar = `<div style="background:#FEE2E2;color:#B91C1C;padding:12px 18px;border-radius:8px;margin-bottom:14px;font-weight:bold;">
      ¡Activa tu suscripción para acceder a todos los beneficios! <a href="#" onclick="window.cargarDatosModulo(null, 'Notificaciones');return false;" style="color:#276749;text-decoration:underline;">Ir a Notificaciones</a>
    </div>`;
  }

  // Notificación de renovación si el plan está por finalizar (últimos 5 días del mes)
  let notificacionRenovar = '';
  if (planActual && perfil?.plan_activado_en) {
    const fechaActivacion = new Date(perfil.plan_activado_en);
    const hoy = new Date();
    const diasRestantesMes =
      new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() -
      hoy.getDate();
    if (diasRestantesMes <= 5) {
      notificacionRenovar = `<div style="background:#FEF3C7;color:#B45309;padding:12px 18px;border-radius:8px;margin-bottom:14px;font-weight:bold;">
        ¡Tu suscripción está por finalizar este mes! Renueva tu plan para mantener tu fidelidad y seguir disfrutando de todos los beneficios. <a href="#" onclick="window.cargarDatosModulo(null, 'Notificaciones');return false;" style="color:#276749;text-decoration:underline;">Renovar ahora</a>
      </div>`;
    }
  }

  let panelUsuario = `
    ${notificacionActivar}
    ${notificacionRenovar}
    <div style="display:flex;align-items:center;gap:18px;background:#F3F4F6;padding:18px 18px 10px 18px;border-radius:14px;margin-bottom:18px;">
      ${avatarUsuario(perfil)}
      <div style="flex:1;">
        <div style="font-size:1.15em;font-weight:bold;color:#276749;">${escapeHtml(nombreUsuario)}</div>
        <div style="font-size:0.98em;color:#64748B;">${escapeHtml(correoUsuario)}</div>
        <div style="font-size:0.97em;color:#0369A1;margin-top:4px;">Plan actual: <b>${planActual && PLANES[planActual] ? escapeHtml(PLANES[planActual].nombre) : 'Sin plan activo'}</b></div>
        <div style="font-size:0.97em;color:#B45309;">Días de gratuidad restantes: <b>${diasGratuitosRestantes}</b></div>
        ${barraProgresoDiasGratis(diasGratuitosRestantes, 10)}
      </div>
    </div>
  `;

  // Mensaje de advertencia de días de gratuidad
  let mensajeGratuito = '';
  if (diasGratuitosRestantes > 0 && diasGratuitosRestantes <= 3) {
    mensajeGratuito = `<div style="background:#FEF3C7;color:#B45309;padding:12px 18px;border-radius:8px;margin-bottom:18px;font-weight:bold;">
      ¡Atención! Tus <b>${diasGratuitosRestantes}</b> días de gratuidad están por terminar. Cuando se acaben, no podrás usar los servicios de la app hasta el día 1 del próximo mes, cuando se activan 5 días de gratuidad.
    </div>`;
  } else if (diasGratuitosRestantes === 0) {
    mensajeGratuito = `<div style="background:#FEE2E2;color:#B91C1C;padding:12px 18px;border-radius:8px;margin-bottom:18px;font-weight:bold;">
      Tus días de gratuidad han terminado. Los servicios de la app están bloqueados hasta el día 1 del próximo mes, cuando recibirás 5 días de gratuidad.
    </div>`;
  }

  // Tarjetas de planes y tabla comparativa
  let planesHtml = `<div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center;">`;
  Object.values(PLANES).forEach((plan) => {
    let badge = '';
    if (plan.id === 'standard') {
      badge = `<span style="background:#F59E0B;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.92em;margin-left:8px;">Recomendado</span>`;
    } else if (plan.id === 'premium') {
      badge = `<span style="background:#10B981;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.92em;margin-left:8px;">Más popular</span>`;
    }
    planesHtml += `
      <div style="background:#fff;border:2px solid #F59E0B;box-shadow:0 2px 12px #0001;border-radius:14px;padding:18px 18px 14px 18px;min-width:240px;max-width:320px;flex:1 1 260px;display:flex;flex-direction:column;align-items:center;">
        <img src="/src/assets/ui/icons/plan_${plan.id}.svg" alt="${escapeHtml(plan.nombre)}" style="width:54px;height:54px;margin-bottom:10px;" onerror="this.style.display='none'">
        <div style="font-size:1.25em;font-weight:bold;color:#B45309;">${escapeHtml(plan.nombre)}${badge}</div>
        <div style="font-size:1.1em;color:#276749;margin-bottom:6px;">${moneda(plan.precio)}</div>
        <div style="font-size:0.98em;color:#555;margin-bottom:8px;">${escapeHtml(plan.enfoque)}</div>
        <ul style="margin:0 0 8px 0;padding-left:18px;text-align:left;">
          ${plan.accesos
            .map(
              (acc) =>
                `<li style='font-size:0.97em;color:#276749;'><span style='margin-right:6px;'>✔️</span>${escapeHtml(acc)}</li>`
            )
            .join('')}
        </ul>
        <div style="font-size:0.93em;color:#b45309;margin-bottom:8px;">${escapeHtml(plan.valorAgregado || '')}</div>
        <button onclick="window.mostrarModalPagoPlan('${plan.id}')" style="margin-top:auto;padding:8px 18px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;font-weight:bold;" ${planActual === plan.id ? 'disabled style=\"opacity:0.6;cursor:not-allowed;\"' : ''}>${planActual === plan.id ? 'Plan activo' : 'Contratar este plan'}</button>
      </div>
    `;
  });
  planesHtml += `</div>`;

  // Reglas y condiciones
  let reglas = `<div style="margin:30px 0 0 0;">
      <h3 style="color:#B45309;">Reglas y condiciones de uso</h3>
      <ul style="color:#444;font-size:1.04em;">
        <li>Los primeros 10 días tras el registro son gratuitos. Al terminar, la app se bloquea hasta el día 1 del mes siguiente, cuando se activan 5 días de gratuidad.</li>
        <li>Durante los días de gratuidad, solo puedes usar: Mi Comunidad Virtual, Suscripciones, Asistente Técnico Rural, Tienda MELANTIA, Gestión de Fincas (1 sola finca), Servicios Financieros.</li>
        <li>Extraer un documento o informe durante días gratuitos tiene un costo de $3.</li>
        <li>Activar funciones premium requiere plan activo.</li>
      </ul>
    </div>`;

  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:900px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Planes y Pagos</h2>
      <p style="color:#444;font-size:1.1em;">Consulta los planes disponibles, sus beneficios y precios. Elige el que mejor se adapte a tus necesidades.</p>
      ${panelUsuario}
      ${mensajeGratuito}
      ${planesHtml}
      ${reglas}
      <button onclick="window.cargarDatosModulo(null, 'Suscripciones')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;

  // Simulación de contratación de plan offline
  // Modalidad de pago con lógica de fidelización y cálculo de IVA
  window.mostrarModalPagoPlan = function (planId) {
    const plan = PLANES[planId];
    if (!plan) return;
    let perfil = null;
    try {
      perfil = JSON.parse(localStorage.getItem('perfil_usuario'));
    } catch {}
    // Calcular meses de fidelización continua
    let mesesFidelizacion = 0;
    if (perfil?.plan_activado_en) {
      const fechaIni = new Date(perfil.plan_activado_en);
      const hoy = new Date();
      mesesFidelizacion =
        (hoy.getFullYear() - fechaIni.getFullYear()) * 12 +
        (hoy.getMonth() - fechaIni.getMonth());
    }
    // Calcular precios
    const precioBase = plan.precio || 0;
    const iva = Math.round(precioBase * 0.15 * 100) / 100;
    const totalSaldoVirtual = Math.round((precioBase + iva) * 100) / 100;
    let opciones = '';
    if (mesesFidelizacion >= 6) {
      opciones = `<button onclick=\"window.confirmarPagoPlan('${planId}','efectivo',${precioBase})\" style=\"margin:8px 0 8px 0;padding:8px 18px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;\">Efectivo — $${precioBase}</button><br><button onclick=\"window.confirmarPagoPlan('${planId}','saldo_virtual',${totalSaldoVirtual})\" style=\"margin:8px 0 8px 0;padding:8px 18px;background:#10B981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;\">Saldo virtual Melantios — $${totalSaldoVirtual} (incluye IVA)</button><div style=\"color:#64748B;font-size:0.98em;margin-top:6px;\">* El pago con saldo virtual Melantios incluye 15% IVA.</div>`;
    } else {
      opciones = `<button onclick=\"window.confirmarPagoPlan('${planId}','efectivo',${precioBase})\" style=\"margin:8px 0 8px 0;padding:8px 18px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;\">Efectivo — $${precioBase}</button><br><div style=\"color:#64748B;font-size:0.98em;margin-top:6px;\">El pago con saldo virtual Melantios estará disponible tras 6 meses de fidelización continua.</div>`;
    }
    // Modal simple
    const modal = document.createElement('div');
    modal.id = 'modal-pago-plan';
    modal.style =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0007;z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style=\"background:#fff;padding:32px 24px;border-radius:14px;max-width:340px;box-shadow:0 4px 24px #0002;text-align:center;\"><h3 style=\"color:#B45309;\">Selecciona modalidad de pago</h3><div style=\"margin:18px 0 18px 0;\"><b>${escapeHtml(plan.nombre)}</b></div>${opciones}<br><button onclick=\"document.body.removeChild(document.getElementById('modal-pago-plan'))\" style=\"margin-top:18px;padding:6px 18px;background:#E0E7EF;color:#276749;border:none;border-radius:6px;cursor:pointer;font-size:1em;\">Cancelar</button></div>`;
    document.body.appendChild(modal);
  };

  window.confirmarPagoPlan = function (planId, modalidad, total) {
    if (
      !confirm(
        '¿Confirmar pago de $' +
          total +
          ' en modalidad: ' +
          (modalidad === 'efectivo' ? 'Efectivo' : 'Saldo virtual Melantios') +
          '?'
      )
    )
      return;
    procesarPagoOffline('plan', planId, total, modalidad);
    activarPlanOffline(planId);
    alert(
      '¡Plan contratado offline! El pago se sincronizará cuando tengas conexión.'
    );
    // Cerrar modal
    const modal = document.getElementById('modal-pago-plan');
    if (modal) document.body.removeChild(modal);
    mostrarPanel();
  };

  // Simulación de pago de documento/informe offline
  window.simularPagoDocumento = function () {
    if (
      !confirm(
        '¿Deseas pagar $3 por extraer un documento/informe? El pago se procesará offline.'
      )
    )
      return;
    procesarPagoOffline('documento', null, 3);
    alert(
      '¡Pago registrado offline! El cobro se sincronizará cuando tengas conexión.'
    );
  };
}

// Exponer globalmente para el enrutador dinámico
window.mostrarPanelPlanesPagos = mostrarPanel;

// =====================
// FAQ y sincronización pagos (Don Eloy)
// =====================

// Preguntas frecuentes y respuestas básicas
const FAQ_PLANES = {
  '¿Cuáles son los beneficios de cada plan?':
    'Cada plan ofrece diferentes beneficios y accesos. Consulta la tabla comparativa para ver detalles y elige el que mejor se adapte a tus necesidades.',
  '¿Qué pasa si se acaban mis días gratuitos?':
    'Cuando se terminan los días gratuitos, la app se bloquea hasta el día 1 del próximo mes, cuando recibirás 5 días de gratuidad.',
  '¿Cómo pago un plan o documento si no tengo internet?':
    'Puedes contratar y pagar offline. El pago se almacena y se sincroniza automáticamente cuando la app detecte conexión.',
  '¿Qué módulos puedo usar durante los días gratuitos?':
    'Solo puedes usar: Mi Comunidad Virtual, Suscripciones, Asistente Técnico Rural, Tienda MELANTIA, Gestión de Fincas (1 sola finca), Servicios Financieros.',
  '¿Cuánto cuesta extraer un documento/informe durante días gratuitos?':
    'El costo es de $3 por documento/informe durante días gratuitos.',
};

// Voz de Don Eloy para responder preguntas frecuentes
function donEloyHabla(mensaje) {
  if (window.cargarVoz) window.cargarVoz('Don Eloy');
  if (window._voz) window._voz(mensaje);
  if (window.console) console.log('[Don Eloy]:', mensaje);
}

// Lógica para atender preguntas frecuentes
window.preguntarFAQPlanes = function () {
  const pregunta = prompt(
    '¿Qué deseas saber sobre los planes? (Ejemplo: ¿Cuáles son los beneficios de cada plan?)'
  );
  if (!pregunta) return;
  let respuesta = null;
  for (const key in FAQ_PLANES) {
    if (pregunta.toLowerCase().includes(key.toLowerCase().slice(0, 10))) {
      respuesta = FAQ_PLANES[key];
      break;
    }
  }
  if (respuesta) {
    donEloyHabla(respuesta);
    alert('Don Eloy responde: ' + respuesta);
  } else {
    donEloyHabla(
      'Esa pregunta será respondida por la administración general de la app.'
    );
    alert(
      'Don Eloy: Tu pregunta ha sido registrada y será respondida por la administración general de la app.'
    );
    // Guardar pregunta pendiente
    let pendientes = [];
    try {
      pendientes = JSON.parse(localStorage.getItem('faq_pendientes')) || [];
    } catch {}
    pendientes.push({ pregunta, fecha: new Date().toISOString() });
    localStorage.setItem('faq_pendientes', JSON.stringify(pendientes));
  }
};

// Lógica de sincronización real de pagos pendientes (llamar en la actualización global)
window.sincronizarPagosPendientes = async function () {
  if (!navigator.onLine) return;
  let pagosPendientes = [];
  try {
    pagosPendientes =
      JSON.parse(localStorage.getItem('pagos_pendientes')) || [];
  } catch {}
  if (!pagosPendientes.length) return;
  // Simulación de envío a backend (reemplazar por fetch real)
  for (let pago of pagosPendientes) {
    // Aquí iría la llamada real a la API, por ejemplo:
    // await fetch('/api/sync_pago', { method: 'POST', body: JSON.stringify(pago) });
    pago.procesado = true;
  }
  // Eliminar los pagos procesados
  pagosPendientes = pagosPendientes.filter((p) => !p.procesado);
  localStorage.setItem('pagos_pendientes', JSON.stringify(pagosPendientes));
  // Opcional: notificar al usuario
  donEloyHabla('Tus pagos pendientes han sido sincronizados con éxito.');
};
