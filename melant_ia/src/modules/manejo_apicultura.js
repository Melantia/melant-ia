// Módulo: Manejo de Apicultura
// Lógica y UI para la apicultura y manejo de colmenas en MELANTIA

const MelantiaManejoApicultura = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-apicultura" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#D4AF37;margin-bottom:8px;'>Manejo de Apicultura</h2>
        <form id="form-labor-apicultura" style="margin-bottom:24px;">
          <label>Tipo de labor:<br><input name='tipo' required placeholder='Ej: Revisión sanitaria, Alimentación, Cosecha...'></label><br>
          <label>Colmena/Ubicación:<br><input name='colmena' required placeholder='Ej: Colmena 1, Lote A...'></label><br>
          <label>Observaciones:<br><textarea name='observaciones' rows='2' placeholder='Notas adicionales'></textarea></label><br>
          <button type='submit' style='margin-top:8px;background:#D4AF37;color:#fff;padding:8px 20px;border:none;border-radius:8px;font-size:1em;cursor:pointer;'>Registrar labor</button>
        </form>
        <div id="apicultura-content"></div>
        <h3 style='margin-top:32px;color:#D4AF37;'>Historial de labores</h3>
        <ul id="labores-apicultura-lista" style='padding-left:18px;'></ul>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#D4AF37;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();
    this.mostrarHistorialLabores();
    this.configurarFormulario();
  },

  mostrarHistorialLabores: function () {
    import('./apicultura_data_store.js').then((storeMod) => {
      const store = storeMod.default || window.ApiculturaDataStore;
      const lista = document.getElementById('labores-apicultura-lista');
      if (!lista) return;
      const labores = store.cargarLabores();
      lista.innerHTML =
        labores.length === 0 ? '<li>No hay labores registradas.</li>' : '';
      labores.forEach((l, i) => {
        const fecha = new Date(l.fecha).toLocaleString();
        lista.innerHTML += `<li><b>${l.tipo}</b> en <b>${l.colmena}</b> - ${fecha}<br><small>${l.observaciones || ''}</small> <button onclick='MelantiaManejoApicultura.eliminarLabor(${i})' style='margin-left:8px;color:#D4AF37;background:none;border:none;cursor:pointer;'>🗑️</button></li>`;
      });
    });
  },

  eliminarLabor: function (index) {
    import('./apicultura_data_store.js').then((storeMod) => {
      const store = storeMod.default || window.ApiculturaDataStore;
      store.eliminarLabor(index);
      MelantiaManejoApicultura.mostrarHistorialLabores();
    });
  },

  configurarFormulario: function () {
    const form = document.getElementById('form-labor-apicultura');
    if (!form) return;
    form.onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      import('./apicultura_data_store.js').then((storeMod) => {
        const store = storeMod.default || window.ApiculturaDataStore;
        store.guardarLabor(data);
        form.reset();
        MelantiaManejoApicultura.mostrarHistorialLabores();
      });
    };
  },
  cargarDatosDemo: function () {
    // Ejemplo de fases y buenas prácticas apícolas
    const data = {
      titulo: 'Manejo Técnico de Apicultura',
      fases: [
        {
          paso: 1,
          titulo: 'Ubicación y Materiales de Colmenas',
          estado: 'completado',
          detalles: [
            'Colocar colmenas protegidas de vientos dominantes',
            'Usar materiales inocuos para abejas y miel',
            'Evitar contaminantes en la zona de apiario',
          ],
        },
        {
          paso: 2,
          titulo: 'Manejo Sanitario y Alimentación',
          estado: 'completado',
          detalles: [
            'Revisar periódicamente la salud de las abejas',
            'Alimentar en épocas de escasez',
            'Aplicar buenas prácticas apícolas oficiales (Agrocalidad 2020)',
          ],
        },
        {
          paso: 3,
          titulo: 'Cosecha y Procesamiento',
          estado: 'pendiente',
          detalles: [
            'Cosechar miel, cera, propóleo y polen en condiciones higiénicas',
            'Evitar residuos en los productos',
            'Ejemplo: Uso de extractores y filtrado adecuado',
          ],
        },
        {
          paso: 4,
          titulo: 'Certificación y Comercialización',
          estado: 'bloqueado',
          detalles: [
            'Cumplir normativas nacionales y certificaciones',
            'Asociatividad y acceso a mercados',
            'Ejemplo: Registro apícola y trazabilidad de productos',
          ],
        },
      ],
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'apicultura-content',
        data
      );
    });
  },
};

export default MelantiaManejoApicultura;
