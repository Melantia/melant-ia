// gestion_suscripciones.js — Submódulo MELANTIA
import PLANES from './01_suscripciones/planes_beneficios.js';
import { moneda, escapeHtml } from './01_suscripciones/utils.js';
import { registrarAfiliado } from './01_suscripciones/negocio_afiliados.js';

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  // Mostrar lista de planes y opción de registrar afiliado demo
  let planesHtml = Object.values(PLANES)
    .map(
      (plan) => `
    <div style="border:1px solid #eee;padding:12px;margin-bottom:10px;border-radius:8px;">
      <strong>${escapeHtml(plan.nombre)}</strong> — ${moneda(plan.precio)}
      <div style="font-size:0.95em;color:#555;">${escapeHtml(plan.enfoque)}</div>
      <button onclick="window.registrarAfiliadoDemo('${plan.id}')">Registrar afiliado en este plan</button>
    </div>
  `
    )
    .join('');
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Gestión de Suscripciones</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes gestionar las suscripciones de usuarios, activar o cancelar planes y ver el historial.</p>
      ${planesHtml}
      <button onclick="window.cargarDatosModulo(null, 'Suscripciones')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;

  // Demo: función global para registrar afiliado (puedes mejorarla)
  window.registrarAfiliadoDemo = function (planId) {
    let estado = { lista_afiliados: [], acumulado_bruto: 0 };
    estado = registrarAfiliado(PLANES, estado, planId, {
      nombre: 'Nuevo Afiliado',
    });
    alert(
      'Afiliado registrado en plan: ' +
        planId +
        '\nTotal afiliados: ' +
        estado.lista_afiliados.length
    );
  };
}
