// Bienes Raices Rurales (real) — MELANTIA
// Version aislada para navegacion estable sin depender de cache viejo.

import { TiendaMelantia } from './04_negocios_rurales/tienda_melantia.js';

const BIENES_KEY = 'melantia_bienes_raices_publicados';

function cargarPropiedades() {
  try {
    const raw = localStorage.getItem(BIENES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function guardarPropiedades(lista) {
  localStorage.setItem(BIENES_KEY, JSON.stringify(lista));
}

export function publicarPropiedad({
  propietario,
  tipo,
  ubicacion,
  precio,
  descripcion,
  fotos,
}) {
  if (!TiendaMelantia.validarCoberturaParaCompra()) {
    return { ok: false, error: 'Sin cobertura' };
  }
  const propiedad = {
    id: `prop_${Date.now()}`,
    propietario,
    tipo,
    ubicacion,
    precio,
    descripcion,
    fotos: fotos || [],
    fecha: new Date().toISOString(),
  };
  const propiedades = cargarPropiedades();
  propiedades.push(propiedad);
  guardarPropiedades(propiedades);
  TiendaMelantia.hablarAtencionVentas('Propiedad publicada correctamente.');
  return { ok: true, propiedad };
}

export function listarPropiedades() {
  return cargarPropiedades();
}

function renderLista(propiedades) {
  if (!propiedades.length) {
    return '<p>No hay propiedades registradas.</p>';
  }
  return propiedades
    .slice()
    .reverse()
    .map(
      (p) => `
      <div class="prop-card" style="border:1px solid #e5e7eb;padding:10px;border-radius:8px;margin:8px 0;">
        <b>${p.tipo}</b> - ${p.ubicacion}<br>
        <b>Precio:</b> $${Number(p.precio || 0).toFixed(2)}<br>
        <b>Descripcion:</b> ${p.descripcion}<br>
        <b>Propietario:</b> ${p.propietario}<br>
        <b>Fecha publicacion:</b> ${new Date(p.fecha).toLocaleString()}<br>
        <button onclick="window.comprarPropiedadReal('${p.id}')">Comprar</button>
      </div>
    `
    )
    .join('');
}

export function renderizarEspacioTienda(contenedorId = 'panel-bienes-raices') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;

  const propiedades = listarPropiedades();
  cont.innerHTML = `
    <div style="margin-top:14px;padding:14px;border:1px solid #d1fae5;border-radius:10px;background:#f0fdf4;">
      <h3 style="margin-top:0;">Espacio Bienes Raices</h3>
      <button id="btn-publicar-propiedad" class="btn-melantia">Publicar Propiedad</button>
      <div id="panel-form-propiedad" style="margin-top:12px;"></div>
      <div id="panel-lista-propiedades" style="margin-top:10px;">${renderLista(propiedades)}</div>
    </div>
  `;

  const btnPublicar = document.getElementById('btn-publicar-propiedad');
  if (btnPublicar) {
    btnPublicar.onclick = () => {
      const panelForm = document.getElementById('panel-form-propiedad');
      panelForm.innerHTML = `
        <form id="form-publicar-propiedad" style="display:grid;gap:8px;max-width:560px;">
          <input type="text" name="propietario" placeholder="Nombre del propietario" required>
          <input type="text" name="tipo" placeholder="Tipo (Finca, Terreno, Hacienda...)" required>
          <input type="text" name="ubicacion" placeholder="Ubicacion" required>
          <input type="number" name="precio" placeholder="Precio" required>
          <textarea name="descripcion" placeholder="Descripcion" required></textarea>
          <button type="submit">Publicar Propiedad</button>
        </form>
      `;

      const form = document.getElementById('form-publicar-propiedad');
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(form).entries());
          const res = publicarPropiedad(data);
          if (!res.ok) return;
          panelForm.innerHTML =
            '<p style="color:#166534;">Propiedad publicada correctamente.</p>';
          const panelLista = document.getElementById('panel-lista-propiedades');
          if (panelLista)
            panelLista.innerHTML = renderLista(listarPropiedades());
        };
      }
    };
  }
}

export function mostrarCatalogoPropiedades(contenedorId = 'vista-activa') {
  const cont =
    document.getElementById(contenedorId) ||
    document.getElementById('contenedor-principal') ||
    document.body;
  if (!cont) return;

  cont.innerHTML =
    '<h2>Catalogo de Bienes Raices Rurales</h2><div id="panel-bienes-raices"></div><div id="panel-volver-bienes"></div>';
  renderizarEspacioTienda('panel-bienes-raices');
  const panelVolver = document.getElementById('panel-volver-bienes');
  if (panelVolver) {
    panelVolver.innerHTML =
      '<button onclick="window.volverAlMenuPrincipal && window.volverAlMenuPrincipal()" style="margin-top:18px;background:#276749;color:#fff;padding:9px 18px;border:none;border-radius:8px;cursor:pointer;">Volver al menu principal</button>';
  }
}

window.comprarPropiedadReal = function (id) {
  const propiedad = listarPropiedades().find((p) => p.id === id);
  if (!propiedad) {
    alert('Propiedad no encontrada.');
    return;
  }
  if (!TiendaMelantia.validarCoberturaParaCompra()) return;
  TiendaMelantia.hablarAtencionVentas(
    'Iniciando proceso de compra para la propiedad seleccionada.'
  );
  alert(
    'Proceso de compra en desarrollo. Pronto podras completar la transaccion desde la Tienda MELANTIA.'
  );
};

export function mostrarPanel() {
  mostrarCatalogoPropiedades('vista-activa');
}

export default { mostrarPanel, publicarPropiedad, listarPropiedades };
