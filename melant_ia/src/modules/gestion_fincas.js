// Submódulo: Gestión de Fincas y Lotes MELANTIA
// Migrado y adaptado desde main_controller.js antiguo

const GestionFincasMelantia = {
  _cacheTablero: null,

  async cargarTablero(query = '') {
    // Usa la búsqueda combinada real
    const { buscarFincas } = await import('./persistencia_fincas.js');
    const fincas = await buscarFincas(query || '');
    // Adaptar a la estructura esperada por la UI
    this._cacheTablero = {
      lotes: fincas.map((f) => ({
        id_lote: f.id,
        nombre_lote: f.nombre,
        tipo_lote: f.tipo_lote || 'agricola',
        cultivo: f.cultivo || '',
        alerta_tecnica: f.alerta_tecnica || 'OK',
        ultima_foto_iso: f.ultima_foto_iso || new Date().toISOString(),
      })),
    };
    return this._cacheTablero;
  },

  mostrarPanelFincas() {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `<div class="panel-fincas" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <h2 style='color:#276749;margin:0;'>Gestión de Fincas y Lotes</h2>
        <button id="btn-walkie-fincas" title="Walkie Talkie" style="background:none;border:none;cursor:pointer;font-size:1.7em;line-height:1;outline:none;">
          <span role="img" aria-label="Walkie Talkie">📻</span>
        </button>
      </div>
      <form id="form-alta-finca" style="margin-bottom:18px;">
        <input type="text" id="alta-nombre" placeholder="Nombre de la finca" required style="width:48%;margin-right:2%;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <input type="text" id="alta-cultivo" placeholder="Cultivo principal" style="width:48%;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <button type="submit" style="margin-top:8px;background:#276749;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;float:right;">Agregar finca</button>
      </form>
      <div id="fincas-lista"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>`;
    // Evento alta y botón walkie
    setTimeout(() => {
      const btnWalkie = document.getElementById('btn-walkie-fincas');
      if (btnWalkie) {
        btnWalkie.onclick = () => {
          window.abrirWalkieTalkie('fincas');
        };
      }
      // Agregar botón de voz
      if (!document.getElementById('btn-voz-fincas')) {
        const form = document.getElementById('form-alta-finca');
        const btn = document.createElement('button');
        btn.id = 'btn-voz-fincas';
        btn.type = 'button';
        btn.textContent = '🎤 Control por voz';
        btn.style = 'background:#1e88e5;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;margin-bottom:12px;float:right;';
        form.parentNode.insertBefore(btn, form);
      }
      const form = document.getElementById('form-alta-finca');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const nombre = document.getElementById('alta-nombre').value.trim();
          const cultivo = document.getElementById('alta-cultivo').value.trim();
          if (!nombre) return;
          const { guardarFincaLocal } = await import('./persistencia_fincas.js');
          const id = 'finca_' + Date.now();
          await guardarFincaLocal({
            id,
            nombre,
            cultivo,
            alerta_tecnica: 'OK',
            ultima_foto_iso: new Date().toISOString(),
            sincronizada: false,
          });
          form.reset();
          GestionFincasMelantia.renderizarLotes();
        };
      }
      // Integración control por voz
      const btnVoz = document.getElementById('btn-voz-fincas');
      if (btnVoz) {
        btnVoz.onclick = async () => {
          const { VoiceFincasMelantia } = await import('./voice_fincas.js');
          const voz = new VoiceFincasMelantia();
          voz.onCommand = async ({accion, nombre, cultivo, vozFemenina}) => {
            // Feedback con voz MELANTIA (Ángel por defecto, Paulette/Valentina si override)
            async function hablarMelantiaUI(mensaje, overrideFemenina = false) {
              const { hablarMelantia } = await import('./voz_melantia.js');
              if (overrideFemenina) {
                const vocesFem = ['Paulette', 'Valentina'];
                const voz = vocesFem[Math.floor(Math.random() * vocesFem.length)];
                await hablarMelantia(mensaje, 3, null, voz); // 3 = Gestión de Fincas
              } else {
                await hablarMelantia(mensaje, 3); // Voz por defecto (Ángel)
              }
            }
            // Detectar override por voz femenina en el comando
            const overrideFemenina = vozFemenina === true;
            if (accion === 'alta' && nombre) {
              const { guardarFincaLocal } = await import('./persistencia_fincas.js');
              const id = 'finca_' + Date.now();
              await guardarFincaLocal({
                id,
                nombre,
                cultivo: cultivo || '',
                alerta_tecnica: 'OK',
                ultima_foto_iso: new Date().toISOString(),
                sincronizada: false
              });
              GestionFincasMelantia.renderizarLotes();
              await hablarMelantiaUI(`Finca ${nombre} agregada correctamente.`, overrideFemenina);
            } else if (accion === 'buscar' && nombre) {
              document.getElementById('buscador-fincas').value = nombre;
              GestionFincasMelantia.renderizarLotes(nombre);
              await hablarMelantiaUI(`Mostrando resultados para finca ${nombre}.`, overrideFemenina);
            } else if (accion === 'eliminar' && nombre) {
              const { listarFincasLocales } = await import('./persistencia_fincas.js');
              const fincas = await listarFincasLocales();
              const finca = fincas.find(f => f.nombre && f.nombre.toLowerCase() === nombre.toLowerCase());
              if (finca) {
                await GestionFincasMelantia.eliminarFinca(finca.id);
                await hablarMelantiaUI(`Finca ${nombre} eliminada.`, overrideFemenina);
              } else {
                await hablarMelantiaUI(`No se encontró la finca ${nombre}.`, overrideFemenina);
              }
            } else {
              await hablarMelantiaUI('Comando no reconocido.', overrideFemenina);
            }
          };
          voz.start();
        };
      }
    }, 100);
    this.renderizarLotes();
  },

  async renderizarLotes(query = '') {
    const tablero = await this.cargarTablero(query);
    const cont = document.getElementById('fincas-lista');
    if (!cont) return;
    // Buscador
    cont.innerHTML = `
      <input type="text" id="buscador-fincas" placeholder="Buscar finca..." style="width:100%;margin-bottom:12px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;" oninput="GestionFincasMelantia.renderizarLotes(this.value)">
      <div id="fincas-lista-items"></div>
    `;
    const items = document.getElementById('fincas-lista-items');
      items.innerHTML = (tablero.lotes.length === 0)
        ? '<div style="color:#888">No hay fincas registradas.</div>'
        : tablero.lotes
          .map(
            (lote) => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="flex:1;">
              <strong>${lote.nombre_lote}</strong> <span style="color:#888">(${lote.cultivo})</span><br>
              Estado: <span style="color:#276749">${lote.alerta_tecnica}</span><br>
              Última foto: ${new Date(lote.ultima_foto_iso).toLocaleString()}<br>
              <button onclick="GestionFincasMelantia.verDetalleLote('${lote.id_lote}')">Ver detalle</button>
              <button onclick="GestionFincasMelantia.mostrarEditarFinca('${lote.id_lote}')" style="background:#fbc02d;color:#222;padding:6px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:8px;">Editar</button>
            </div>
            <button onclick="GestionFincasMelantia.eliminarFinca('${lote.id_lote}')" style="background:#e53935;color:#fff;padding:6px 12px;border:none;border-radius:6px;cursor:pointer;">Eliminar</button>
          </div>
        `
          )
          .join('');
      async mostrarEditarFinca(idLote, overrideFemenina = false) {
        const { obtenerFincaLocal, guardarFincaLocal, supabase } = await import('./persistencia_fincas.js');
        const finca = await obtenerFincaLocal(idLote);
        if (!finca) return;
        const panel = document.getElementById('panel-novedades') || document.body;
        panel.innerHTML = `<div class="panel-editar-finca" style="max-width:500px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
          <h3>Editar Finca</h3>
          <form id="form-editar-finca">
            <label>Nombre:<br><input type="text" id="edit-nombre" value="${finca.nombre || ''}" required style="width:100%;margin-bottom:10px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;"></label><br>
            <label>Cultivo:<br><input type="text" id="edit-cultivo" value="${finca.cultivo || ''}" style="width:100%;margin-bottom:10px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;"></label><br>
            <button type="submit" style="background:#276749;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Guardar cambios</button>
            <button type="button" onclick="GestionFincasMelantia.mostrarPanelFincas()" style="margin-left:10px;background:#888;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Cancelar</button>
          </form>
        </div>`;
        setTimeout(() => {
          const form = document.getElementById('form-editar-finca');
          if (form) {
            form.onsubmit = async (e) => {
              e.preventDefault();
              const nombre = document.getElementById('edit-nombre').value.trim();
              const cultivo = document.getElementById('edit-cultivo').value.trim();
              if (!nombre) return;
              const fincaEditada = { ...finca, nombre, cultivo };
              await guardarFincaLocal(fincaEditada);
              // Actualizar en Supabase si hay conexión
              if (navigator.onLine) {
                try {
                  await supabase.from('fincas').update({ nombre, cultivo }).eq('id', finca.id);
                } catch (e) {}
              } else {
                fincaEditada.sincronizada = false;
                await guardarFincaLocal(fincaEditada);
              }
              // Feedback de voz
              try {
                const { hablarMelantia } = await import('./voz_melantia.js');
                if (overrideFemenina) {
                  const vocesFem = ['Paulette', 'Valentina'];
                  const voz = vocesFem[Math.floor(Math.random() * vocesFem.length)];
                  await hablarMelantia('Finca editada correctamente.', 3, null, voz);
                } else {
                  await hablarMelantia('Finca editada correctamente.', 3);
                }
              } catch (e) {}
              GestionFincasMelantia.mostrarPanelFincas();
            };
          }
        }, 100);
      },
    async eliminarFinca(idLote, overrideFemenina = false) {
      if (!confirm('¿Seguro que deseas eliminar esta finca?')) return;
      const { supabase } = await import('./persistencia_fincas.js');
      const localforage = (await import('localforage')).default;
      // Eliminar local
      await localforage.removeItem(`finca_${idLote}`);
      // Eliminar en Supabase si hay conexión
      if (navigator.onLine) {
        try {
          await supabase.from('fincas').delete().eq('id', idLote);
        } catch (e) {}
      }
      // Confirmación visual
      const cont = document.getElementById('fincas-lista-items');
      if (cont) {
        cont.insertAdjacentHTML('afterbegin', `<div id="msg-finca-eliminada" style="background:#e53935;color:#fff;padding:8px 12px;border-radius:6px;margin-bottom:10px;">Finca eliminada correctamente.</div>`);
        setTimeout(() => {
          const msg = document.getElementById('msg-finca-eliminada');
          if (msg) msg.remove();
        }, 1800);
      }
      // Feedback de voz
      try {
        const { hablarMelantia } = await import('./voz_melantia.js');
        if (overrideFemenina) {
          const vocesFem = ['Paulette', 'Valentina'];
          const voz = vocesFem[Math.floor(Math.random() * vocesFem.length)];
          await hablarMelantia('Finca eliminada correctamente.', 3, null, voz);
        } else {
          await hablarMelantia('Finca eliminada correctamente.', 3);
        }
      } catch (e) {}
      // Refrescar lista
      this.renderizarLotes();
    },
  },

  async verDetalleLote(idLote) {
    // Buscar en cache o en persistencia
    let lote = this._cacheTablero?.lotes?.find((l) => l.id_lote == idLote);
    if (!lote) {
      const { obtenerFincaLocal } = await import('./persistencia_fincas.js');
      const finca = await obtenerFincaLocal(idLote);
      if (finca) {
        lote = {
          id_lote: finca.id,
          nombre_lote: finca.nombre,
          tipo_lote: finca.tipo_lote || 'agricola',
          cultivo: finca.cultivo || '',
          alerta_tecnica: finca.alerta_tecnica || 'OK',
          ultima_foto_iso: finca.ultima_foto_iso || new Date().toISOString(),
        };
      }
    }
    if (!lote) return;
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `<div class="panel-lote-detalle" style="max-width:500px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h3>${lote.nombre_lote}</h3>
      <p>Cultivo: <strong>${lote.cultivo}</strong></p>
      <p>Estado técnico: <span style="color:#276749">${lote.alerta_tecnica}</span></p>
      <p>Última foto: ${new Date(lote.ultima_foto_iso).toLocaleString()}</p>
      <button onclick="GestionFincasMelantia.mostrarPanelFincas()">Volver a fincas</button>
    </div>`;
  },
};

window.GestionFincasMelantia = GestionFincasMelantia;
export default GestionFincasMelantia;
