// ==============================================
// MÓDULO 3 — Gestión de Fincas | FORMATO EXCEL
// ARCHIVO: modules/gestion_fincas.js
// ==============================================

window.GestionFincasMelantia = {
  datos: [],
  cargado: false,

  async cargarTablero() {
    const local = localStorage.getItem('melantia_fincas');
    this.datos = local ? JSON.parse(local) : [];
    this.cargado = true;
    this.mostrarPanelFincas();

    if (navigator.onLine) {
      try {
        const { supabase } = await import('./persistencia_fincas.js');
        const { data, error } = await supabase.from('fincas').select('*');
        if (!error && data) {
          this.datos = data;
          localStorage.setItem('melantia_fincas', JSON.stringify(data));
          this.mostrarPanelFincas();
        }
      } catch (e) {
        console.log('⚠️ Usando datos locales');
      }
    }
  },

  // 📊 PANEL PRINCIPAL — TABLA FORMATO EXCEL
  mostrarPanelFincas() {
    const contenedor =
      document.getElementById('contenido-modulo') ||
      document.getElementById('contenedor-principal') ||
      document.body;
    if (!contenedor) return;

    const total = this.datos.length;
    const totalHectareas = this.datos.reduce(
      (sum, f) => sum + (Number(f.hectareas) || 0),
      0
    );

    contenedor.innerHTML = `
      <div class="modulo-contenedor">
        <h2>🏡 Gestión de Fincas — Formato Excel</h2>

        <!-- 📈 Resumen -->
        <div class="resumen-excel">
          <div class="celda-resumen">
            <strong>Total Fincas:</strong> ${total}
          </div>
          <div class="celda-resumen">
            <strong>Hectáreas Totales:</strong> ${totalHectareas.toFixed(2)} ha
          </div>
          <button onclick="GestionFincasMelantia.formularioAlta()" class="btn primary">➕ Nueva Finca</button>
        </div>

        <!-- 📋 TABLA PRINCIPAL — FORMATO EXCEL -->
        <div class="tabla-excel-contenedor">
          <table class="tabla-excel">
            <thead>
              <tr>
                <th>Nombre de Finca</th>
                <th>Ubicación / Cantón</th>
                <th>Área (ha)</th>
                <th>Cultivo Principal</th>
                <th>Propietario</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                this.datos.length === 0
                  ? `
                <tr class="fila-vacia">
                  <td colspan="7" class="celda-vacia">
                    📋 Sin registros. Haz clic en "Nueva Finca" para agregar la primera.
                  </td>
                </tr>
              `
                  : this.datos
                      .map(
                        (f) => `
                <tr class="fila-datos">
                  <td class="celda-dato">${f.nombre || '-'}</td>
                  <td class="celda-dato">${f.ubicacion || '-'}</td>
                  <td class="celda-dato num">${f.hectareas || 0}</td>
                  <td class="celda-dato">${f.cultivo || '-'}</td>
                  <td class="celda-dato">${f.propietario || '-'}</td>
                  <td class="celda-dato fecha">${new Date(f.fecha_creacion).toLocaleDateString()}</td>
                  <td class="celda-acciones">
                    <button onclick="GestionFincasMelantia.editar(${f.id})" class="btn-icono" title="Editar">✏️</button>
                    <button onclick="GestionFincasMelantia.eliminar(${f.id})" class="btn-icono peligro" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <!-- 📤 Botones de exportación -->
        <div class="barra-inferior">
          <button onclick="GestionFincasMelantia.exportarCSV()" class="btn">📥 Exportar Excel (.csv)</button>
          <button onclick="GestionFincasMelantia.imprimir()" class="btn">🖨️ Imprimir Tabla</button>
        </div>
      </div>
    `;
  },

  // 📝 FORMULARIO DE ALTA — TAMBIÉN EN FORMATO TABLA
  formularioAlta() {
    const contenedor =
      document.getElementById('contenido-modulo') ||
      document.getElementById('contenedor-principal') ||
      document.body;
    if (!contenedor) return;
    contenedor.innerHTML = `
      <div class="formulario-excel-contenedor">
        <h2>➕ Registrar Nueva Finca — Formato Tabla</h2>
        
        <form onsubmit="GestionFincasMelantia.guardarNueva(event)" class="formulario-excel">
          <table class="tabla-formulario">
            <tbody>
              <tr>
                <td class="etiqueta">Nombre de Finca <span class="requerido">*</span></td>
                <td class="campo">
                  <input type="text" id="finca_nombre" required placeholder="Ej: Finca El Paraíso">
                </td>
              </tr>
              <tr>
                <td class="etiqueta">Ubicación / Cantón <span class="requerido">*</span></td>
                <td class="campo">
                  <input type="text" id="finca_ubicacion" required placeholder="Parroquia, Cantón, Provincia">
                </td>
              </tr>
              <tr>
                <td class="etiqueta">Área (Hectáreas) <span class="requerido">*</span></td>
                <td class="campo">
                  <input type="number" step="0.01" id="finca_hectareas" required placeholder="2.5">
                </td>
              </tr>
              <tr>
                <td class="etiqueta">Cultivo Principal</td>
                <td class="campo">
                  <input type="text" id="finca_cultivo" placeholder="Café, Cacao, Maíz, Caña...">
                </td>
              </tr>
              <tr>
                <td class="etiqueta">Propietario / Responsable</td>
                <td class="campo">
                  <input type="text" id="finca_propietario" placeholder="Nombre o Razón Social">
                </td>
              </tr>
              <tr>
                <td class="etiqueta">Observaciones</td>
                <td class="campo">
                  <textarea id="finca_obs" rows="2" placeholder="Notas adicionales..."></textarea>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="botones-form">
            <button type="button" onclick="GestionFincasMelantia.mostrarPanelFincas()" class="btn">↩️ Volver a Tabla</button>
            <button type="submit" class="btn primary">✅ Guardar Finca</button>
          </div>
        </form>
      </div>
    `;
  },

  // 💾 Guardar
  async guardarNueva(e) {
    e.preventDefault();

    const nueva = {
      id: Date.now(),
      nombre: document.getElementById('finca_nombre').value,
      ubicacion: document.getElementById('finca_ubicacion').value,
      hectareas: parseFloat(document.getElementById('finca_hectareas').value),
      cultivo: document.getElementById('finca_cultivo').value,
      propietario: document.getElementById('finca_propietario').value,
      observaciones: document.getElementById('finca_obs')?.value || '',
      fecha_creacion: new Date().toISOString(),
    };

    this.datos.unshift(nueva);
    localStorage.setItem('melantia_fincas', JSON.stringify(this.datos));

    if (navigator.onLine) {
      try {
        const { supabase } = await import('./persistencia_fincas.js');
        await supabase.from('fincas').insert([nueva]);
      } catch (err) {
        console.log('Guardado local — sincronización pendiente');
      }
    }

    this.mostrarPanelFincas();
    alert('✅ Finca registrada correctamente');
  },

  // ✏️ Editar
  editar(id) {
    alert('🔧 Edición en desarrollo — selecciona la fila para modificar');
  },

  // 🗑️ Eliminar
  eliminar(id) {
    if (!confirm('¿Eliminar esta fila? Se borrará permanentemente.')) return;
    this.datos = this.datos.filter((f) => f.id !== id);
    localStorage.setItem('melantia_fincas', JSON.stringify(this.datos));
    this.mostrarPanelFincas();
  },

  // 📥 Exportar a Excel (CSV)
  exportarCSV() {
    if (this.datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const encabezados = [
      'Nombre',
      'Ubicación',
      'Hectáreas',
      'Cultivo',
      'Propietario',
      'Fecha',
    ];
    const filas = this.datos.map((f) => [
      f.nombre,
      f.ubicacion,
      f.hectareas,
      f.cultivo,
      f.propietario,
      new Date(f.fecha_creacion).toLocaleDateString(),
    ]);

    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((c) => `${c || ''}`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fincas_Melantia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 🖨️ Imprimir
  imprimir() {
    window.print();
  },
};

// Función de entrada
export function mostrarPanel() {
  window.GestionFincasMelantia.cargarTablero();
}

export default window.GestionFincasMelantia;
