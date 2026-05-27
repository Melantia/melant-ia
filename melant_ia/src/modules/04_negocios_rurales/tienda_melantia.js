// --- Helper visual para sello y reputación ---
import { renderizarSelloSocioConfiable } from './tienda_sello_reputacion.js';
// Tienda Virtual MELANTIA — Administración General
// Lógica central de la tienda global, pagos, validación de cobertura y atención de ventas

export const TiendaMelantia = {
  // Renderizar sello y reputación en la tienda (llamar desde UI principal de tienda)
  mostrarSelloYReputacion(usuario) {
    // usuario: {nombre, reputacion, selloConfiable}
    renderizarSelloSocioConfiable(usuario);
  },
  // Validación de cobertura para compras
  validarCoberturaParaCompra() {
    if (!navigator.onLine) {
      const msg =
        'Para realizar compras necesitas conexión a internet o cobertura de red. Puedes explorar la tienda offline, pero la compra solo es posible con cobertura.';
      if (typeof window.hablarAtencionVentas === 'function') {
        window.hablarAtencionVentas(msg);
      }
      alert(msg);
      return false;
    }
    return true;
  },

  // Atención de ventas con voz
  hablarAtencionVentas(texto, tipo = 'normal') {
    if (
      window.MelantiaAsistente &&
      typeof window.MelantiaAsistente.hablarAtencionVentas === 'function'
    ) {
      window.MelantiaAsistente.hablarAtencionVentas(texto, tipo);
    } else {
      // Fallback: voz Melantia
      this._voz(texto);
    }
  },

  // Motor de voz fallback
  _voz(texto) {
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(texto);
    utt.lang = 'es-EC';
    utt.pitch = 1.05;
    utt.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  },

  // Renderizado de bloque de pagos (PayPhone, Deuna, peiGo)
  renderizarPagos(subtotal = 100) {
    import('../config_pagos_melantia.js').then(({ PAGOS_MELANTIA }) => {
      const iva = subtotal * PAGOS_MELANTIA.IVA;
      const comisionMelantia = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;
      let comisionPayPhone = 0;
      if (PAGOS_MELANTIA.PAYPHONE.ACTIVO) {
        comisionPayPhone = subtotal * PAGOS_MELANTIA.PAYPHONE.COMISION;
        if (PAGOS_MELANTIA.PAYPHONE.IVA_COMISION) {
          comisionPayPhone += comisionPayPhone * PAGOS_MELANTIA.IVA;
        }
      }
      let comisionDeuna = 0;
      if (PAGOS_MELANTIA.DEUNA.ACTIVO) {
        comisionDeuna = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;
      }
      let comisionPeiGo = 0;
      if (PAGOS_MELANTIA.PEIGO.ACTIVO) {
        comisionPeiGo = subtotal * PAGOS_MELANTIA.COMISION_MELANTIA;
      }
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
						<li>Subtotal: $${subtotal.toFixed(2)}</li>
						<li>IVA (15%): $${iva.toFixed(2)}</li>
						<li>Comisión MELANTIA (5%): $${comisionMelantia.toFixed(2)}</li>
						<li>Comisión PayPhone (5% + IVA): $${comisionPayPhone.toFixed(2)}</li>
						<li>Comisión Deuna (solo MELANTIA): $${comisionDeuna.toFixed(2)}</li>
						<li>Comisión peiGo (solo MELANTIA): $${comisionPeiGo.toFixed(2)}</li>
					</ul>
					<b>Total con PayPhone:</b> $${(subtotal + iva + comisionMelantia + comisionPayPhone).toFixed(2)}<br>
					<b>Total con Deuna:</b> $${(subtotal + iva + comisionDeuna).toFixed(2)}<br>
					<b>Total con peiGo:</b> $${(subtotal + iva + comisionPeiGo).toFixed(2)}
				</div>
				<div style="font-size:0.95em;color:#b91c1c;margin-top:8px;">El usuario asume los cargos de la plataforma de pago elegida.</div>
			`;
      document.body.appendChild(bloquePagos);
    });
  },

  // Sincronización y estado offline
  gestionarEstadoOffline() {
    const estadoBanner = document.getElementById('status-banner');
    if (!estadoBanner) return;
    if (!navigator.onLine) {
      estadoBanner.innerHTML =
        '🟢 SISTEMA LOCAL ACTIVO | FUNCIONA SIN INTERNET';
      estadoBanner.style.backgroundColor = '#276749';
    } else {
      estadoBanner.innerHTML =
        '⚠️ CONECTADO A LA RED | Sincronización disponible';
      estadoBanner.style.backgroundColor = '#1a4d34';
    }
  },
};
