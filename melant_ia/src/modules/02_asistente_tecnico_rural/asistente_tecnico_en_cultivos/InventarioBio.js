window.InventarioBio = {
  _storageKey: 'melantia_inventario_bio_local',

  _toast(msg, type = 'success') {
    if (typeof window.toast === 'function') return window.toast(msg, type);
    console.log(`[${type}] ${msg}`);
  },

  _hablar(msg) {
    if (typeof window.hablar === 'function') return window.hablar(msg);
  },

  _fallbackItems() {
    try {
      return JSON.parse(localStorage.getItem(this._storageKey) || '[]');
    } catch {
      return [];
    }
  },

  _saveFallbackItems(items) {
    localStorage.setItem(this._storageKey, JSON.stringify(items));
  },

  async addItem() {
    const nombre = (document.querySelector('#bioNombre')?.value || '').trim();
    const cantidad = Number(document.querySelector('#bioCantidad')?.value || 0);
    const fechaVencimiento = document.querySelector('#bioVencimiento')?.value;
    const proveedor = (
      document.querySelector('#bioProveedor')?.value || ''
    ).trim();
    if (!nombre || cantidad <= 0 || !fechaVencimiento) {
      this._toast('Ingresa nombre, cantidad y vencimiento del insumo', 'error');
      return;
    }

    if (window.Auth && Auth.currentUser && window.DB) {
      await DB.add('inventario_bio', {
        userId: Auth.currentUser.id,
        nombre,
        cantidad,
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        proveedor,
        estado: 'activo',
      });
    } else {
      const items = this._fallbackItems();
      items.push({
        id: `bio_${Date.now()}`,
        nombre,
        cantidad,
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        proveedor,
        estado: 'activo',
      });
      this._saveFallbackItems(items);
    }
    this._toast('Insumo biologico registrado', 'success');
    await this.render();
  },

  async _items() {
    if (window.Auth && Auth.currentUser && window.DB) {
      return await DB.getByIndex(
        'inventario_bio',
        'userId',
        Auth.currentUser.id
      );
    }
    return this._fallbackItems();
  },

  _daysToExpire(item) {
    const ms = new Date(item.fechaVencimiento).getTime() - Date.now();
    return Math.ceil(ms / 86400000);
  },

  async consumeForTreatment(nombre, qty) {
    const items = await this._items();
    const item = items
      .filter((i) => i.nombre === nombre && i.estado !== 'vencido')
      .sort(
        (a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
      )[0];
    if (!item) {
      this._toast(`No hay inventario disponible de ${nombre}`, 'error');
      return;
    }
    const restante = Math.max(0, Number(item.cantidad || 0) - Number(qty || 1));
    if (window.Auth && Auth.currentUser && window.DB) {
      await DB.put('inventario_bio', {
        ...item,
        cantidad: restante,
        estado: restante <= 0 ? 'agotado' : item.estado,
      });
    } else {
      const items = this._fallbackItems().map((it) =>
        it.id === item.id
          ? {
              ...it,
              cantidad: restante,
              estado: restante <= 0 ? 'agotado' : it.estado,
            }
          : it
      );
      this._saveFallbackItems(items);
    }
    this._hablar(
      `Insumo descontado del inventario. Te quedan ${restante} unidades disponibles`
    );
    if (restante < 2) {
      this._hablar(
        `Te queda solo ${restante} ${restante === 1 ? 'unidad' : 'unidades'} de ${nombre}. ¿Deseas contactar a tu proveedor para no interrumpir el ciclo sanitario?`
      );
    }
    await this.render();
  },

  async enviarNotificacionVencimiento(item) {
    const dias = this._daysToExpire(item);
    if (dias === 15) {
      this._hablar(
        'Atención, el hongo Beauveria está por vencer. Prioriza su uso en el próximo lote de ganado'
      );
    } else if (dias <= 3 && dias >= 0) {
      this._toast(
        '⚠️ Insumo próximo a expirar. No tendrá efecto biológico si pasa la fecha',
        'error'
      );
    }
  },

  async render() {
    const host = document.querySelector('#bioInventarioLista');
    if (!host) return;
    const items = await this._items();
    if (items.length === 0) {
      host.innerHTML = 'Sin insumos registrados.';
      return;
    }
    let hayProximos = false;
    const html = [];
    for (const item of items.sort(
      (a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
    )) {
      const dias = this._daysToExpire(item);
      let color = 'var(--fg-dim)';
      let estado = item.estado || 'activo';
      if (dias < 0) {
        color = '#9CA3AF';
        estado = 'vencido';
      } else if (dias < 5) {
        color = 'var(--danger)';
        hayProximos = true;
      } else if (dias <= 15) {
        color = 'var(--orange)';
        hayProximos = true;
      } else if (Number(item.cantidad || 0) < 2) {
        color = 'var(--orange)';
      }
      html.push(
        `<div style="padding:8px 0;border-bottom:1px solid var(--border);color:${color};"><strong>${item.nombre}</strong> | ${Number(item.cantidad || 0)} unidades | vence ${new Date(item.fechaVencimiento).toLocaleDateString('es-ES')} | ${estado}${item.proveedor ? ` | ${item.proveedor}` : ''}</div>`
      );
      await this.enviarNotificacionVencimiento(item);
    }
    host.innerHTML = html.join('');
    if (hayProximos) {
      this._hablar(
        'Tienes insumos biológicos próximos a vencer. Revisa tu inventario para no perder la inversión'
      );
    }
  },
};

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:860px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:12px;">
      <h2 style="margin:0;color:#276749;">Inventario de Biodiversidad</h2>
      <p style="margin:0;color:#445;">Registro y control de insumos biologicos con alertas de vencimiento.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end;">
        <label>Insumo<input id="bioNombre" type="text" placeholder="Beauveria" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Cantidad<input id="bioCantidad" type="number" min="1" value="1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Vencimiento<input id="bioVencimiento" type="date" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Proveedor<input id="bioProveedor" type="text" placeholder="Proveedor" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <button id="bioAddBtn" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Agregar insumo</button>
      </div>

      <div id="bioInventarioLista" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Cargando...</div>
      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  document.getElementById('bioAddBtn')?.addEventListener('click', () => {
    window.InventarioBio.addItem();
  });
  window.InventarioBio.render();
}

export default { mostrarPanel };
