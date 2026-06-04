// Mercado de Plátano — MELANTIA
// Publicación semanal, registro de ofertas, integración con trazabilidad y Don Eloy
import MelantiaTrazabilidadPlatano from './trazabilidad_platano.js';
import { DonEloy } from './don_eloy_wisdom.js';

const OFERTAS_KEY = 'ofertas_mercado_platano';

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

// Ofertas de productores (en memoria + persistencia local)
const ofertas = [];

function cargarOfertasLocales() {
  try {
    const raw = localStorage.getItem(OFERTAS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (_) {
    return [];
  }
}

function persistirOfertas() {
  localStorage.setItem(OFERTAS_KEY, JSON.stringify(ofertas));
}

function hidratarOfertas() {
  if (ofertas.length > 0) return;
  const locales = cargarOfertasLocales();
  locales.forEach((o) => {
    ofertas.push({
      id: o.id || `oferta-${Math.floor(Math.random() * 100000)}`,
      productor_id: o.productor_id || 'prod-local',
      nombre: o.nombre || o.productor || 'Productor',
      cajas: Number(o.cajas || o.cantidad || 0),
      fotos: o.fotos || [],
      punto_acopio_id: Number(o.punto_acopio_id || 1),
      fecha_entrega: o.fecha_entrega || o.fecha || '',
      fecha_registro: o.fecha_registro || o.fecha || new Date().toISOString(),
      trazabilidad: o.trazabilidad || null,
    });
  });
}

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
  persistirOfertas();
  // Integración con Don Eloy: narrar noticia
  DonEloy.narrarHistoria(Math.floor(Math.random() * 3));
  return { ok: true, oferta };
}

export function listarOfertas() {
  return ofertas;
}

function renderListaCompactaMercado(lista) {
  if (!lista.length) {
    return '<p>No hay ofertas de plátano registradas.</p>';
  }
  return lista
    .slice()
    .reverse()
    .map(
      (o) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;">
        <b>${o.nombre}</b> - ${o.cajas} cajas<br>
        <b>Entrega:</b> ${o.fecha_entrega || '-'}<br>
        <b>Punto:</b> ${publicacionSemanal.puntos_acopio.find((p) => p.id === o.punto_acopio_id)?.nombre || '-'}
      </div>
    `
    )
    .join('');
}

export function renderizarEspacioTienda(
  contenedorId = 'panel-mercado-platano'
) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  hidratarOfertas();

  cont.innerHTML = `
    <div style="margin-top:14px;padding:14px;border:1px solid #dbeafe;border-radius:10px;background:#eff6ff;">
      <h3 style="margin-top:0;">Espacio Mercado de Plátano</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <button id="btn-publicar-platano-tienda" class="btn-melantia">Publicar Oferta de Plátano</button>
        <button id="btn-abrir-mercado-platano" class="btn-melantia">Abrir módulo completo</button>
      </div>
      <div id="panel-form-platano-tienda" style="margin-bottom:10px;"></div>
      <div id="panel-lista-platano-tienda">${renderListaCompactaMercado(listarOfertas())}</div>
    </div>
  `;

  const btnAbrir = document.getElementById('btn-abrir-mercado-platano');
  if (btnAbrir) {
    btnAbrir.onclick = () => {
      if (typeof window.navegarA === 'function') {
        window.navegarA('Mercado de Plátano');
      }
    };
  }

  const btnPublicar = document.getElementById('btn-publicar-platano-tienda');
  if (btnPublicar) {
    btnPublicar.onclick = () => {
      const panelForm = document.getElementById('panel-form-platano-tienda');
      if (!panelForm) return;
      panelForm.innerHTML = `
        <form id="form-platano-tienda" style="display:grid;gap:8px;max-width:520px;">
          <input type="text" name="nombre" placeholder="Nombre productor" required>
          <input type="number" name="cajas" placeholder="Cantidad de cajas" min="1" required>
          <input type="date" name="fecha_entrega" required>
          <select name="punto_acopio_id">
            ${publicacionSemanal.puntos_acopio
              .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
              .join('')}
          </select>
          <button type="submit">Guardar Oferta</button>
        </form>
      `;

      const form = document.getElementById('form-platano-tienda');
      if (!form) return;
      form.onsubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const oferta = crearOfertaProductor({
          productor_id: `prod-${Math.floor(Math.random() * 100000)}`,
          nombre: data.nombre,
          cajas: Number(data.cajas || 0),
          punto_acopio_id: Number(data.punto_acopio_id || 1),
          fecha_entrega: data.fecha_entrega,
          fotos: [],
        });
        const res = registrarOferta(oferta);
        if (!res.ok) return;
        panelForm.innerHTML =
          '<p style="color:#166534;">Oferta de plátano publicada correctamente.</p>';
        const panelLista = document.getElementById(
          'panel-lista-platano-tienda'
        );
        if (panelLista) {
          panelLista.innerHTML = renderListaCompactaMercado(listarOfertas());
        }
      };
    };
  }
}

export function mostrarPanelMercado(contenedorId = 'vista-activa') {
  const cont =
    document.getElementById(contenedorId) ||
    document.getElementById('contenedor-principal') ||
    document.body;
  if (!cont) return;
  hidratarOfertas();
  DonEloy.cargarHistorias?.();
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
          <b>Fecha registro:</b> ${new Date(o.fecha_registro).toLocaleString()}<br>
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

export function mostrarPanel(contenedorId = 'vista-activa') {
  return mostrarPanelMercado(contenedorId);
}

export default {
  mostrarPanel,
  mostrarPanelMercado,
  renderizarEspacioTienda,
  listarOfertas,
  registrarOferta,
};

// Puedes llamar mostrarPanelMercado() desde el menú principal o Negocios Rurales.
