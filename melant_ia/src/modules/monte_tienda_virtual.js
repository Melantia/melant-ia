// Panel funcional de Monte su TIENDA VIRTUAL

import { TiendaUsuario } from './04_negocios_rurales/tienda.js';
import { supabase, tieneConfigValida } from './supabase_config.js';

function obtenerUsuarioActivo() {
  try {
    const raw = localStorage.getItem('usuario_melantia');
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.nombre) return parsed;
  } catch (_) {}
  return { nombre: 'productor_local' };
}

async function guardarTiendaEnSupabase(tienda) {
  if (!tieneConfigValida || !supabase) return false;
  try {
    const payload = {
      id: tienda.id,
      nombre: tienda.nombre,
      descripcion: tienda.descripcion,
      link: tienda.link,
      usuario: tienda.usuario,
      identidad: tienda.identidad?.nombre || tienda.usuario,
      created_at: tienda.fecha,
    };
    const { error } = await supabase
      .from('tiendas_virtuales')
      .upsert([payload], { onConflict: 'id' });
    return !error;
  } catch (_) {
    return false;
  }
}

async function cargarTiendasDesdeSupabase(usuario) {
  if (!tieneConfigValida || !supabase || !usuario) return [];
  try {
    const { data, error } = await supabase
      .from('tiendas_virtuales')
      .select('*')
      .eq('usuario', usuario)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !Array.isArray(data)) return [];
    return data.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      link: t.link,
      usuario: t.usuario,
      identidad: { nombre: t.identidad || t.usuario || 'productor_local' },
      fecha: t.created_at || new Date().toISOString(),
    }));
  } catch (_) {
    return [];
  }
}

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-especifico" style="max-width:760px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Monte su TIENDA VIRTUAL</h2>
      <p style="color:#334155;">Cree su tienda, gestione su enlace y publique su catalogo propio.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0;">
        <button id="btn-crear-tienda" style="background:#1d4ed8;color:#fff;padding:10px 14px;border:none;border-radius:8px;cursor:pointer;">Crear Tienda</button>
        <button id="btn-ver-tiendas" style="background:#0f766e;color:#fff;padding:10px 14px;border:none;border-radius:8px;cursor:pointer;">Ver Mis Tiendas</button>
      </div>
      <div id="panel-tienda-virtual"></div>
      <div id="panel-lista-tiendas" style="display:none;margin-top:14px;"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#276749;color:#fff;padding:10px 22px;border:none;border-radius:8px;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;

  let tiendas = JSON.parse(localStorage.getItem('tiendas_virtuales') || '[]');
  const panelTienda = document.getElementById('panel-tienda-virtual');

  const btnCrear = document.getElementById('btn-crear-tienda');
  const btnVer = document.getElementById('btn-ver-tiendas');

  if (btnCrear) {
    btnCrear.onclick = () => {
      panelTienda.innerHTML = `
        <h3>Crear nueva tienda</h3>
        <form id="form-crear-tienda" style="display:grid;gap:8px;max-width:520px;">
          <input type="text" name="nombre" placeholder="Nombre de la tienda" required>
          <input type="text" name="alias" placeholder="Alias para link (opcional)">
          <textarea name="descripcion" placeholder="Descripción" required></textarea>
          <button type="submit" style="background:#1d4ed8;color:#fff;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Crear</button>
        </form>
      `;

      const form = document.getElementById('form-crear-tienda');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(form).entries());
          const usuarioActivo = obtenerUsuarioActivo();
          const identidad = {
            nombre:
              (data.alias || data.nombre || usuarioActivo.nombre)
                .toString()
                .trim()
                .replace(/\s+/g, '_') || 'productor_local',
          };

          const creacion = TiendaUsuario.crearTienda(identidad);
          if (!creacion.ok) {
            panelTienda.innerHTML =
              '<p style="color:#b91c1c;">No se pudo crear la tienda. Revisa tus datos.</p>';
            return;
          }

          const tienda = {
            id: `tienda_${Date.now()}`,
            nombre: data.nombre,
            descripcion: data.descripcion,
            link: creacion.link,
            usuario: usuarioActivo.nombre,
            identidad,
            fecha: new Date().toISOString(),
          };

          tiendas.push(tienda);
          localStorage.setItem('tiendas_virtuales', JSON.stringify(tiendas));
          localStorage.setItem('tienda_virtual_activa', JSON.stringify(tienda));
          await guardarTiendaEnSupabase(tienda);

          panelTienda.innerHTML = `
            <b>Tienda creada:</b> ${tienda.nombre}<br>
            <b>Link:</b> <a href="${tienda.link}" target="_blank">${tienda.link}</a><br>
            ${tienda.descripcion}<br><br>
            <button id="btn-compartir-tienda" style="background:#25d366;color:#fff;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Compartir por WhatsApp</button>
          `;

          const btnCompartir = document.getElementById('btn-compartir-tienda');
          if (btnCompartir) {
            btnCompartir.onclick = () => {
              TiendaUsuario.compartirPorWhatsApp(identidad);
            };
          }
        };
      }
    };
  }

  if (btnVer) {
    btnVer.onclick = async () => {
      const panelLista = document.getElementById('panel-lista-tiendas');
      panelLista.style.display = 'block';
      const usuarioActivo = obtenerUsuarioActivo();
      const tiendasRemotas = await cargarTiendasDesdeSupabase(
        usuarioActivo.nombre
      );
      if (tiendasRemotas.length > 0) {
        tiendas = tiendasRemotas;
        localStorage.setItem('tiendas_virtuales', JSON.stringify(tiendas));
      }
      if (tiendas.length === 0) {
        panelLista.innerHTML = '<p>No tienes tiendas creadas.</p>';
        return;
      }
      panelLista.innerHTML = '<h3>Mis Tiendas Virtuales</h3>';
      tiendas.forEach((t) => {
        panelLista.innerHTML += `<div><b>${t.nombre}</b> - <a href="${t.link}" target="_blank">${t.link}</a><br><small>Usuario: ${t.usuario || '-'}</small><br>${t.descripcion}<br><i>${new Date(t.fecha).toLocaleString()}</i></div><hr>`;
      });
    };
  }
}

export default { mostrarPanel };
