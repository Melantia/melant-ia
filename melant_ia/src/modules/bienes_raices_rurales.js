// Bienes Raíces Rurales — MELANTIA
// Publicación, búsqueda y gestión de propiedades rurales
// Integrado con Tienda MELANTIA

import { TiendaMelantia } from './04_negocios_rurales/tienda_melantia.js';

const propiedades = [];

export function publicarPropiedad({
  propietario,
  tipo,
  ubicacion,
  precio,
  descripcion,
  fotos,
}) {
  if (!TiendaMelantia.validarCoberturaParaCompra())
    return { ok: false, error: 'Sin cobertura' };
  const propiedad = {
    id: 'prop-' + Math.floor(Math.random() * 100000),
    propietario,
    tipo,
    ubicacion,
    precio,
    descripcion,
    fotos: fotos || [],
    fecha: new Date().toISOString(),
  };
  propiedades.push(propiedad);
  TiendaMelantia.hablarAtencionVentas('Propiedad publicada correctamente.');
  return { ok: true, propiedad };
}

export function listarPropiedades() {
  return propiedades;
}

export function mostrarCatalogoPropiedades(contenedorId = 'app-menu') {
  const cont =
    document.getElementById(contenedorId) ||
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;
  if (!cont) return;
  cont.innerHTML = '<h2>Catálogo de Bienes Raíces Rurales</h2>';
  if (propiedades.length === 0) {
    cont.innerHTML += '<p>No hay propiedades registradas.</p>';
    cont.innerHTML +=
      '<button onclick="window.volverAlMenuPrincipal && window.volverAlMenuPrincipal()" style="margin-top:18px;background:#276749;color:#fff;padding:9px 18px;border:none;border-radius:8px;cursor:pointer;">Volver al menú principal</button>';
    return;
  }
  propiedades.forEach((p) => {
    cont.innerHTML += `
      <div class="prop-card">
        <b>${p.tipo}</b> — ${p.ubicacion}<br>
        <b>Precio:</b> $${p.precio}<br>
        <b>Descripción:</b> ${p.descripcion}<br>
        <b>Propietario:</b> ${p.propietario}<br>
        <b>Fecha publicación:</b> ${p.fecha}<br>
        <button onclick="window.comprarPropiedad('${p.id}')">Comprar</button>
      </div>
      <hr>
    `;
  });
  cont.innerHTML +=
    '<button onclick="window.volverAlMenuPrincipal && window.volverAlMenuPrincipal()" style="margin-top:18px;background:#276749;color:#fff;padding:9px 18px;border:none;border-radius:8px;cursor:pointer;">Volver al menú principal</button>';
}

window.comprarPropiedad = function (id) {
  const propiedad = propiedades.find((p) => p.id === id);
  if (!propiedad) return alert('Propiedad no encontrada.');
  if (!TiendaMelantia.validarCoberturaParaCompra()) return;
  TiendaMelantia.hablarAtencionVentas(
    'Iniciando proceso de compra para la propiedad seleccionada.'
  );
  alert(
    'Proceso de compra en desarrollo. Pronto podrás completar la transacción desde la Tienda MELANTIA.'
  );
};

export function mostrarPanel() {
  return mostrarCatalogoPropiedades('vista-activa');
}

export default { mostrarPanel, publicarPropiedad, listarPropiedades };

// Integración con la Tienda MELANTIA: puedes llamar mostrarCatalogoPropiedades() desde el panel de tienda.
