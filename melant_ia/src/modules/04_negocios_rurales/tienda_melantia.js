// --- Helper visual para sello y reputación ---
import { renderizarSelloSocioConfiable } from './tienda_sello_reputacion.js';
import { TiendaUsuario } from './tienda.js';
import { supabase, tieneConfigValida } from '../supabase_config.js';
// Tienda Virtual MELANTIA — Administración General
// Lógica central de la tienda global, pagos, validación de cobertura y atención de ventas

const OFERTAS_KEY = 'melantia_ofertas_publicadas';

function obtenerUsuarioPublicador() {
  try {
    const tiendaActivaRaw = localStorage.getItem('tienda_virtual_activa');
    const tiendaActiva = tiendaActivaRaw ? JSON.parse(tiendaActivaRaw) : null;
    if (tiendaActiva?.identidad?.nombre) {
      return tiendaActiva.identidad;
    }
  } catch (_) {}

  try {
    const userRaw = localStorage.getItem('usuario_melantia');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (user?.nombre) return { nombre: user.nombre };
  } catch (_) {}

  return { nombre: 'productor_local' };
}

function cargarOfertas() {
  try {
    const raw = localStorage.getItem(OFERTAS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function guardarOfertas(ofertas) {
  localStorage.setItem(OFERTAS_KEY, JSON.stringify(ofertas));
}

async function cargarOfertasDesdeSupabase() {
  if (!tieneConfigValida || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ofertas_tienda')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error || !Array.isArray(data)) return [];
    return data.map((o) => ({
      id: o.id,
      titulo: o.titulo,
      precio: Number(o.precio || 0),
      descripcion: o.descripcion,
      publicador: o.publicador,
      fecha: o.created_at || new Date().toISOString(),
    }));
  } catch (_) {
    return [];
  }
}

async function guardarOfertaEnSupabase(oferta) {
  if (!tieneConfigValida || !supabase) return false;
  try {
    const payload = {
      id: oferta.id,
      titulo: oferta.titulo,
      precio: oferta.precio,
      descripcion: oferta.descripcion,
      publicador: oferta.publicador,
      created_at: oferta.fecha,
    };
    const { error } = await supabase
      .from('ofertas_tienda')
      .upsert([payload], { onConflict: 'id' });
    return !error;
  } catch (_) {
    return false;
  }
}

function renderizarListaOfertas(panel, ofertas) {
  if (!panel) return;
  if (!ofertas.length) {
    panel.innerHTML = '<p>No hay ofertas publicadas aún.</p>';
    return;
  }
  panel.innerHTML = `
    <h3>Ofertas publicadas</h3>
    <div style="display:grid;gap:10px;">
      ${ofertas
        .slice()
        .reverse()
        .map(
          (o) => `
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
            <b>${o.titulo}</b> - $${Number(o.precio || 0).toFixed(2)}<br>
            <small>Publicado por: ${o.publicador || 'productor'}</small><br>
            <span>${o.descripcion || ''}</span>
          </div>
        `
        )
        .join('')}
    </div>
  `;
}

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
  // Panel principal de la tienda MELANTIA
  async mostrarPanel(contenedorId = 'app-menu') {
    const cont =
      document.getElementById(contenedorId) ||
      document.getElementById('vista-activa') ||
      document.getElementById('contenedor-principal') ||
      document.body;
    if (!cont) return;
    cont.innerHTML = `
      <h2>Tienda MELANTIA — Marketplace Rural</h2>
      <button id="btn-publicar-oferta" class="btn-melantia">Publicar Oferta</button>
      <button id="btn-ver-bienes-raices" class="btn-melantia">Ver Bienes Raíces</button>
      <button id="btn-ver-mercado-platano" class="btn-melantia">Ver Mercado de Plátano</button>
      <div id="panel-ofertas-tienda"></div>
      <div id="panel-bienes-raices" style="display:block;margin-top:14px;"></div>
      <div id="panel-mercado-platano" style="display:block;margin-top:14px;"></div>
    `;
    const panelOfertas = document.getElementById('panel-ofertas-tienda');
    const ofertasLocales = cargarOfertas();
    const ofertasRemotas = await cargarOfertasDesdeSupabase();
    const mapa = new Map();
    ofertasLocales.forEach((o) => mapa.set(o.id, o));
    ofertasRemotas.forEach((o) => mapa.set(o.id, o));
    const ofertas = Array.from(mapa.values());
    guardarOfertas(ofertas);
    renderizarListaOfertas(panelOfertas, ofertas);

    import('../modulo_negocios.js').catch(() => {
      // Si falla esta carga, se mantiene al menos la persistencia local.
    });

    // Botón para publicar oferta
    document.getElementById('btn-publicar-oferta').onclick = () => {
      panelOfertas.innerHTML = `
        <h3>Publicar nueva oferta</h3>
        <form id="form-publicar-oferta" style="display:grid;gap:8px;max-width:520px;">
          <input type="text" name="titulo" placeholder="Título de la oferta" required><br>
          <input type="number" name="precio" placeholder="Precio" required><br>
          <textarea name="descripcion" placeholder="Descripción" required></textarea><br>
          <button type="submit">Publicar</button>
        </form>
      `;
      document.getElementById('form-publicar-oferta').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const usuarioPublicador = obtenerUsuarioPublicador();
        const oferta = {
          id: `oferta_${Date.now()}`,
          titulo: data.titulo,
          precio: Number(data.precio || 0),
          descripcion: data.descripcion,
          publicador: usuarioPublicador.nombre,
          fecha: new Date().toISOString(),
        };

        const actuales = cargarOfertas();
        actuales.push(oferta);
        guardarOfertas(actuales);
        await guardarOfertaEnSupabase(oferta);

        TiendaUsuario.publicarProducto(usuarioPublicador, oferta);

        if (window.MelantiaTienda?.agregarProducto) {
          window.MelantiaTienda.agregarProducto(oferta);
        }

        renderizarListaOfertas(panelOfertas, actuales);
        TiendaMelantia.hablarAtencionVentas('Oferta publicada correctamente.');
      };
    };
    const cargarEspacioBienes = () => {
      const panelBienes = document.getElementById('panel-bienes-raices');
      panelBienes.style.display = 'block';
      import('../bienes_raices_rurales_real.js').then((mod) => {
        if (typeof mod.renderizarEspacioTienda === 'function') {
          mod.renderizarEspacioTienda('panel-bienes-raices');
        } else if (typeof mod.mostrarCatalogoPropiedades === 'function') {
          mod.mostrarCatalogoPropiedades('panel-bienes-raices');
        }
      });
    };

    const cargarEspacioMercadoPlatano = () => {
      const panelMercado = document.getElementById('panel-mercado-platano');
      panelMercado.style.display = 'block';
      import('../mercado_platano_controller.js').then((mod) => {
        if (typeof mod.renderizarEspacioTienda === 'function') {
          mod.renderizarEspacioTienda('panel-mercado-platano');
        }
      });
    };

    // Botón para ver bienes raíces
    document.getElementById('btn-ver-bienes-raices').onclick = () => {
      cargarEspacioBienes();
    };

    document.getElementById('btn-ver-mercado-platano').onclick = () => {
      cargarEspacioMercadoPlatano();
    };

    // Espacio permanente dentro de la tienda
    cargarEspacioBienes();
    cargarEspacioMercadoPlatano();
  },
};

export function mostrarPanel() {
  return TiendaMelantia.mostrarPanel('vista-activa');
}

export default TiendaMelantia;
