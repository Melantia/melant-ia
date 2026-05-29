import { openMelantiaDB } from './indexeddb_sync.js';

// Panel para consultar reportes de carbono/NDVI guardados offline
export async function mostrarPanelReportesGuardados() {
  let panel = document.getElementById('panel-reportes-guardados-carbono');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'panel-reportes-guardados-carbono';
    panel.style =
      'max-width:600px;margin:40px auto;padding:32px 24px;border-radius:16px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.10);z-index:9999;position:relative;';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <h2 style="color:#276749;margin-bottom:18px;">Reportes de Carbono y NDVI guardados</h2>
    <div id="lista-reportes-carbono" style="margin-bottom:24px;"></div>
    <button onclick="document.body.removeChild(document.getElementById('panel-reportes-guardados-carbono'))" style="background:#b91c1c;color:#fff;padding:8px 22px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Cerrar</button>
  `;
  // Consultar reportes en IndexedDB
  const db = await openMelantiaDB();
  const tx = db.transaction('carbono', 'readonly');
  const store = tx.objectStore('carbono');
  const reportes = await store.getAll();
  db.close();
  const lista = document.getElementById('lista-reportes-carbono');
  if (!reportes || reportes.length === 0) {
    lista.innerHTML =
      '<div style="color:#b91c1c;">No hay reportes guardados.</div>';
    return;
  }
  lista.innerHTML = reportes
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .map(
      (r, idx) => `
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px 12px;margin-bottom:12px;background:#f9fafb;">
        <b>Fecha:</b> ${r.fecha} <br>
        <b>Potrero/Cultivo:</b> ${r.cultivoId || '-'}<br>
        <b>CO₂:</b> ${r.co2 || '-'} t/ha<br>
        <b>Biomasa:</b> ${r.biomasa || '-'}<br>
        <b>Método:</b> ${r.metodo || '-'}<br>
        <button style="margin-top:8px;background:#276749;color:#fff;padding:6px 16px;border:none;border-radius:7px;cursor:pointer;" onclick="window.mostrarQRReporteCarbono(${idx})">Exportar QR</button>
      </div>
    `
    )
    .join('');

  // Exponer función global para exportar QR de cada reporte
  window.mostrarQRReporteCarbono = (idx) => {
    const r = reportes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[
      idx
    ];
    let qrDiv = document.getElementById('qr-informe-guardado');
    if (!qrDiv) {
      qrDiv = document.createElement('div');
      qrDiv.id = 'qr-informe-guardado';
      qrDiv.style = 'margin:18px auto;text-align:center;';
      panel.appendChild(qrDiv);
    }
    qrDiv.innerHTML = '';
    new window.QRCode(qrDiv, {
      text: JSON.stringify(r),
      width: 256,
      height: 256,
    });
    qrDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
}
// reporte_carbono_qr.js
// Panel de reporte de carbono y exportación QR para MELANTIA
// Requiere: QRCode.js y indexeddb_sync.js

import { guardarCapturaCarbonoIndexedDB } from './indexeddb_sync.js';

export function mostrarPanelReporteCarbonoQR(datos) {
  // Crea el panel si no existe
  let panel = document.getElementById('panel-reporte-carbono-qr');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'panel-reporte-carbono-qr';
    panel.style =
      'max-width:420px;margin:30px auto;padding:24px 18px;border-radius:12px;background:#f9fafb;box-shadow:0 2px 12px #0001;';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <h2 style="color:#276749;">Reporte de Carbono y NDVI</h2>
    <div><b>Potrero:</b> <span id="nombre-potrero">${datos.potrero}</span></div>
    <div><b>NDVI:</b> <span id="valor-ndvi">${datos.ndvi}</span></div>
    <div><b>CO₂ capturado:</b> <span id="valor-co2">${datos.co2}</span> t/ha</div>
    <div><b>Fecha:</b> <span id="fecha-reporte">${datos.fecha}</span></div>
    <div style="margin:18px 0 8px 0;">
      <button id="btn-exportar-qr" style="background:#276749;color:#fff;padding:8px 18px;border:none;border-radius:7px;cursor:pointer;">Exportar QR</button>
    </div>
    <div id="qr-informe" style="margin:0 auto;text-align:center;"></div>
    <div style="margin-top:18px;">
      <button id="btn-guardar-doc" style="background:#1e88e5;color:#fff;padding:7px 16px;border:none;border-radius:7px;cursor:pointer;">Guardar en Documentos</button>
    </div>
  `;
  // Exportar QR
  document.getElementById('btn-exportar-qr').onclick = () => {
    const texto = JSON.stringify(datos);
    const qrDiv = document.getElementById('qr-informe');
    qrDiv.innerHTML = '';
    new window.QRCode(qrDiv, {
      text: texto,
      width: 256,
      height: 256,
    });
  };
  // Guardar en Documentos (IndexedDB)
  document.getElementById('btn-guardar-doc').onclick = async () => {
    await guardarCapturaCarbonoIndexedDB(
      datos.cultivoId,
      datos.biomasa,
      datos.co2,
      datos.metodo,
      datos.fecha
    );
    alert('Reporte guardado en Documentos (offline)');
  };
}
