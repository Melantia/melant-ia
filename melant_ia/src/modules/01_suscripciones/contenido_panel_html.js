// Generación de HTML para el panel principal del sistema de afiliados MELANTIA
export function contenidoPanelHtml({
  estado,
  resumen,
  plan,
  progreso,
  ranking,
  preventivo,
  liderazgo,
  desglose,
  ultimoRecibo,
  resumenPlanes,
  mensajeAngel,
  mensajeProgreso,
  mensajeMantenimiento,
  planes,
}) {
  // Aquí va el return del string HTML, igual que en _contenidoPanel pero usando los parámetros y helpers importados
  // ...
  // Por brevedad, solo se muestra la estructura de la función
  return `
    <div class="afiliados-shell">
      <!-- ...estructura HTML igual a _contenidoPanel, usando los parámetros y helpers... -->
    </div>
  `;
}
// contenido_panel_html.js
// Generación de HTML para el panel y recibos del sistema de afiliados MELANTIA
import { moneda, escapeHtml, fechaLarga } from './utils.js';

export function reciboHtml(recibo) {
  if (!recibo) return '<p>No hay recibo disponible.</p>';
  return `
    <div class="afiliados-recibo">
      <div class="afiliados-recibo-header">
        <div>
          <p class="afiliados-eyebrow">MELANTIA - Comprobante de Liquidacion de Comisiones</p>
          <h3>Numero de Operacion: #${escapeHtml(recibo.numeroOperacion)}</h3>
        </div>
        <span class="afiliados-recibo-sello">Aprobado</span>
      </div>
      <div class="afiliados-recibo-grid">
        <div>
          <strong>1. Datos del Beneficiario</strong>
          <p>Nombre: ${escapeHtml(recibo.beneficiario.nombre)}</p>
          <p>PIN de Referido: ${escapeHtml(recibo.beneficiario.pin)}</p>
          <p>Fecha de Solicitud: ${escapeHtml(fechaLarga(recibo.fecha))}</p>
          <p>Correo: ${escapeHtml(recibo.beneficiario.correo)}</p>
        </div>
        <div>
          <strong>4. Estado de la Transferencia</strong>
          <p>Estado: ${escapeHtml(recibo.estadoTransferencia.estado)}</p>
          <p>Tiempo estimado: ${escapeHtml(recibo.estadoTransferencia.tiempoEstimado)}</p>
          <p>Cuenta de Destino: ${escapeHtml(recibo.estadoTransferencia.cuentaDestino)}</p>
        </div>
      </div>
      <div class="afiliados-recibo-bloque">
        <strong>2. Detalle de la Liquidacion</strong>
        <p>Bono por Liderazgo (Plan Gratis): ${recibo.liquidacion.ahorroPlan > 0 ? `Aplicado. Ahorro de ${moneda(recibo.liquidacion.ahorroPlan)}` : 'Aun no aplicado en este periodo.'}</p>
        <p>Comisiones por Socios Excedentes: ${moneda(recibo.liquidacion.comisionesExcedente)} (${recibo.liquidacion.sociosExcedente} socios extra)</p>
        <p>Comisiones por Afiliados Generales: ${moneda(recibo.liquidacion.comisionesGenerales)} (${recibo.liquidacion.amigosGenerales} amigos)</p>
        <p><strong>Monto Total Bruto Acumulado: ${moneda(recibo.liquidacion.bruto)}</strong></p>
      </div>
      <div class="afiliados-recibo-bloque">
        <strong>3. Desglose Fiscal y Neto</strong>
        <p>Retencion de Impuestos (15%): -${moneda(recibo.liquidacion.impuestos).replace('$', '')}</p>
        <p><strong>Total Neto a Transferir: ${moneda(recibo.liquidacion.neto)}</strong></p>
      </div>
    </div>`;
}

// Aquí se puede exportar también la función para el panel completo si se desea modularizar más.
