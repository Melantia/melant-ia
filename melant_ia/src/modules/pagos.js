// modules/pagos.js
// Lógica de cálculo y renderizado del bloque de pagos MELANTIA

export function mostrarPanel() {
  // Panel principal para el enrutador dinámico
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#1565c0;text-align:center;margin-bottom:24px;'>Servicios Financieros Melantia</h2>
      <ul style="font-size:1.1em;line-height:1.7;">
        <li>Apertura de Cuenta Digital</li>
        <li>Onboarding y Validación KYC</li>
        <li>Gestión de Pagos y Beneficios</li>
        <li>Simulación de Perfil Financiero</li>
        <li>Solicitar Microcrédito</li>
        <li>Transferencias y Movimientos</li>
        <li>Integración con Bancos y Cooperativas</li>
        <li>Historial y Estado de Cuenta</li>
      </ul>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#1565c0;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
}

import { PAGOS_MELANTIA } from '../config_pagos_melantia.js';

// Calcula los cargos y comisiones para un subtotal dado
export function calcularCargos(subtotal) {
  const iva = subtotal * PAGOS_MELANTIA.IVA;
  const comisionMelantia = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;

  // PayPhone
  let comisionPayPhone = 0;
  if (PAGOS_MELANTIA.PAYPHONE.ACTIVO) {
    comisionPayPhone = subtotal * PAGOS_MELANTIA.PAYPHONE.COMISION;
    if (PAGOS_MELANTIA.PAYPHONE.IVA_COMISION) {
      comisionPayPhone += comisionPayPhone * PAGOS_MELANTIA.IVA;
    }
  }

  // Deuna
  let comisionDeuna = 0;
  if (PAGOS_MELANTIA.DEUNA.ACTIVO) {
    comisionDeuna = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;
  }

  // peiGo
  let comisionPeiGo = 0;
  if (PAGOS_MELANTIA.PEIGO.ACTIVO) {
    comisionPeiGo = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;
  }

  return {
    subtotal,
    iva,
    comisionMelantia,
    comisionPayPhone,
    comisionDeuna,
    comisionPeiGo,
    totalPayPhone: subtotal + iva + comisionMelantia + comisionPayPhone,
    totalDeuna: subtotal + iva + comisionDeuna,
    totalPeiGo: subtotal + iva + comisionPeiGo,
  };
}

// Renderiza el bloque de pagos en un contenedor dado
export function renderizarBloquePagos(contenedor, subtotal = 100) {
  const cargos = calcularCargos(subtotal);

  const bloquePagos = document.createElement('div');
  bloquePagos.className = 'bloque-pagos-melantia';
  bloquePagos.innerHTML = `
    <h3>Pago seguro MELANTIA</h3>
    <p>Selecciona tu método de pago. El total incluye IVA y comisiones:</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
      <button class="btn-melantia" onclick="window.pagarConPayPhone()">PayPhone<br><span style='font-size:0.9em;'>Banco Pichincha</span></button>
      <button class="btn-melantia" onclick="window.pagarConDeuna()">Deuna<br><span style='font-size:0.9em;'>Banco Pichincha</span></button>
      <button class="btn-melantia" onclick="window.pagarConPeiGo()">peiGo<br><span style='font-size:0.9em;'>Banco Guayaquil</span></button>
    </div>
    <div style="margin-top:18px;text-align:left;max-width:420px;margin-left:auto;margin-right:auto;">
      <b>Desglose de cargos:</b>
      <ul style="font-size:0.98em;">
        <li>Subtotal: $${cargos.subtotal.toFixed(2)}</li>
        <li>IVA (15%): $${cargos.iva.toFixed(2)}</li>
        <li>Comisión MELANTIA (5%): $${cargos.comisionMelantia.toFixed(2)}</li>
        <li>Comisión PayPhone (5% + IVA): $${cargos.comisionPayPhone.toFixed(2)}</li>
        <li>Comisión Deuna (solo MELANTIA): $${cargos.comisionDeuna.toFixed(2)}</li>
        <li>Comisión peiGo (solo MELANTIA): $${cargos.comisionPeiGo.toFixed(2)}</li>
      </ul>
      <b>Total con PayPhone:</b> $${cargos.totalPayPhone.toFixed(2)}<br>
      <b>Total con Deuna:</b> $${cargos.totalDeuna.toFixed(2)}<br>
      <b>Total con peiGo:</b> $${cargos.totalPeiGo.toFixed(2)}
    </div>
    <div style="font-size:0.95em;color:#b91c1c;margin-top:8px;">El usuario asume los cargos de la plataforma de pago elegida.</div>
  `;
  contenedor.appendChild(bloquePagos);
}
