// Mercado de Plátano — MELANTIA
// Publicación semanal, registro de ofertas, integración con trazabilidad y Don Eloy
import MelantiaTrazabilidadPlatano from './trazabilidad_platano.js';
import { DonEloy } from './don_eloy_wisdom.js';

// Publicación semanal (simulada)
export const publicacionSemanal = {
  semana: '2026-05-25',
  precio_compra_caja: 8.5,
  condiciones:
    'Solo plátano barraganete, calidad exportación, mínimo 10 cajas.',
  puntos_acopio: [
    {
      id: 1,
      nombre: 'Acopio Norte',
      direccion: 'Vía Quevedo, km 12',
      fecha_recepcion: '2026-05-27',
      horario: '08:00-13:00',
    },
    {
      id: 2,
      nombre: 'Acopio Sur',
      direccion: 'Recinto La Unión',
      fecha_recepcion: '2026-05-28',
      horario: '09:00-14:00',
    },
  ],
};

// Ofertas de productores (en memoria)
const ofertas = [];

export function crearOfertaProductor({
  productor_id,
  nombre,
  cajas,
  fotos,
  punto_acopio_id,
  fecha_entrega,
}) {
  return {
    id: 'oferta-' + Math.floor(Math.random() * 100000),
    productor_id,
    nombre,
    cajas,
    fotos: fotos || [],
    punto_acopio_id,
    fecha_entrega,
    fecha_registro: new Date().toISOString(),
    trazabilidad: null, // Se puede enlazar con trazabilidad
  };
}

export function registrarOferta(oferta) {
  if (!oferta || !oferta.productor_id || !oferta.cajas) {
    return { ok: false, error: 'Datos incompletos' };
  }
  ofertas.push(oferta);
  // Integración con Don Eloy: narrar noticia
  DonEloy.narrarHistoria(Math.floor(Math.random() * 3));
  return { ok: true, oferta };
}

export function listarOfertas() {
  return ofertas;
}

export function mostrarPanelMercado(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `<h2>Mercado de Plátano</h2>`;
  // Publicación semanal
  cont.innerHTML += `
    <div class="mp-publicacion">
      <b>Semana:</b> ${publicacionSemanal.semana}<br>
      <b>Precio de compra por caja:</b> $${publicacionSemanal.precio_compra_caja.toFixed(2)}<br>
      <b>Puntos de acopio:</b>
      <ul>
        ${publicacionSemanal.puntos_acopio.map((p) => `<li><b>${p.nombre}</b> - ${p.direccion} (${p.fecha_recepcion}, ${p.horario})</li>`).join('')}
      </ul>
      <b>Condiciones:</b> ${publicacionSemanal.condiciones}
    </div>
    <hr>
    <div id="mp-oferta-form"></div>
    <div id="mp-ofertas-list"></div>
    <button class="btn-melantia" onclick="window.mostrarTrazabilidadPlatano()">Ver Trazabilidad del Plátano</button>
    <button class="btn-melantia" onclick="window.narrarNoticiaDonEloy()">Escuchar noticia de Don Eloy</button>
  `;
  // Formulario de oferta
  const formDiv = document.getElementById('mp-oferta-form');
  if (formDiv) {
    formDiv.innerHTML = `
      <h3>Registrar oferta de cajas</h3>
      <label>Nombre productor: <input id="mp-nombre" type="text"></label><br>
      <label>Cantidad de cajas: <input id="mp-cajas" type="number" min="1"></label><br>
      <label>Fecha estimada de entrega: <input id="mp-fecha" type="date"></label><br>
      <label>Punto de acopio:
        <select id="mp-punto">
          ${publicacionSemanal.puntos_acopio.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </label><br>
      <label>Fotos (opcional): <input id="mp-fotos" type="file" multiple accept="image/*"></label><br>
      <button id="mp-enviar">Enviar oferta</button>
      <div id="mp-resultado"></div>
    `;
    document.getElementById('mp-enviar').onclick = () => {
      const nombre = document.getElementById('mp-nombre').value;
      const cajas = parseInt(document.getElementById('mp-cajas').value, 10);
      const fecha_entrega = document.getElementById('mp-fecha').value;
      const punto_acopio_id = parseInt(
        document.getElementById('mp-punto').value,
        10
      );
      const fotosInput = document.getElementById('mp-fotos');
      const fotos = Array.from(fotosInput.files || []);
      const productor_id = 'prod-' + Math.floor(Math.random() * 100000);
      const oferta = crearOfertaProductor({
        productor_id,
        nombre,
        cajas,
        fotos,
        punto_acopio_id,
        fecha_entrega,
      });
      const res = registrarOferta(oferta);
      document.getElementById('mp-resultado').innerHTML = res.ok
        ? '<span style="color:green">Oferta registrada correctamente.</span>'
        : '<span style="color:red">Error al registrar oferta.</span>';
      mostrarOfertas();
    };
  }
  // Mostrar ofertas
  function mostrarOfertas() {
    const ofertasDiv = document.getElementById('mp-ofertas-list');
    if (!ofertasDiv) return;
    const lista = listarOfertas();
    if (lista.length === 0) {
      ofertasDiv.innerHTML = '<p>No hay ofertas registradas.</p>';
      return;
    }
    ofertasDiv.innerHTML =
      '<h3>Ofertas registradas</h3>' +
      lista
        .map(
          (o) => `
        <div class="oferta-card">
          <b>Productor:</b> ${o.nombre}<br>
          <b>Cajas:</b> ${o.cajas}<br>
          <b>Fecha entrega:</b> ${o.fecha_entrega}<br>
          <b>Punto de acopio:</b> ${publicacionSemanal.puntos_acopio.find((p) => p.id === o.punto_acopio_id)?.nombre || '-'}<br>
          <button onclick="window.verTrazabilidadOferta('${o.id}')">Ver trazabilidad</button>
        </div>
      `
        )
        .join('');
  }
  mostrarOfertas();
}

// Integración global para trazabilidad y Don Eloy
window.mostrarTrazabilidadPlatano = function () {
  MelantiaTrazabilidadPlatano.mostrarPanel();
};
window.narrarNoticiaDonEloy = function () {
  DonEloy.narrarHistoria(Math.floor(Math.random() * 3));
};
window.verTrazabilidadOferta = function (ofertaId) {
  // Aquí podrías enlazar la trazabilidad específica de la oferta
  MelantiaTrazabilidadPlatano.mostrarPanel();
};

// Puedes llamar mostrarPanelMercado() desde el menú principal o Negocios Rurales.
