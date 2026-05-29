// Módulo: Trazabilidad de Granjas
// Lógica y UI para la trazabilidad de granjas en MELANTIA

export function mostrarPanel() {
  return MelantiaTrazabilidadGranjas.mostrarPanel();
}

const MelantiaTrazabilidadGranjas = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:900px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#1E88E5;margin-bottom:8px;'>Trazabilidad de Granjas</h2>
        <div id="trazabilidad-granjas-content"></div>
        <h3 style="color:#1976d2;">Libro de Campo</h3>
        <form id="form-actividad-granja" style="margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">
          <input type="date" id="fecha-actividad" required style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
          <input type="text" id="especie-actividad" placeholder="Especie (ej: Bovino)" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
          <input type="text" id="actividad-granja" placeholder="Actividad (ej: Vacunación)" style="width:180px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
          <input type="text" id="detalle-actividad" placeholder="Detalle" style="width:180px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
          <button type="submit" style="background:#1E88E5;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Registrar</button>
        </form>
        <div id="tabla-libro-granja" style="margin-bottom:24px;"></div>
        <h3 style="color:#1976d2;">Calendario de Vacunación</h3>
        <div id="calendario-vacunacion-granja" style="margin-bottom:24px;"></div>
        <h3 style="color:#1976d2;">Calculadoras Técnicas</h3>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <b>Alimento diario recomendado (kg):</b>
            <form id="form-alimento-granja">
              <input type="number" id="num-animales-alim" placeholder="N° Animales" min="0" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
              <input type="number" id="peso-promedio" placeholder="Peso promedio (kg)" min="0" style="width:140px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
              <button type="submit" style="background:#43a047;color:#fff;padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Calcular</button>
            </form>
            <div id="resultado-alimento-granja" style="margin-top:8px;color:#276749;"></div>
          </div>
          <div style="flex:1;min-width:260px;">
            <b>Fertilizante por lote (kg):</b>
            <form id="form-fertilizante-granja">
              <input type="number" id="num-lotes-fert" placeholder="N° Lotes" min="1" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
              <button type="submit" style="background:#fbc02d;color:#222;padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Calcular</button>
            </form>
            <div id="resultado-fertilizante-granja" style="margin-top:8px;color:#1976d2;"></div>
          </div>
        </div>
        <h3 style="color:#1976d2;margin-top:32px;">Informe Técnico y Visualización</h3>
        <div id="informe-granja" style="margin-bottom:24px;"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#1E88E5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();

    // Lógica de libro de campo
    let libroCampo = JSON.parse(
      localStorage.getItem('libroCampoGranja') || '[]'
    );
    function renderTabla() {
      const tabla = document.getElementById('tabla-libro-granja');
      if (!tabla) return;
      if (!libroCampo.length) {
        tabla.innerHTML = '<i>No hay registros aún.</i>';
        return;
      }
      let html = `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#e3f2fd;"><th>Fecha</th><th>Especie</th><th>Actividad</th><th>Detalle</th></tr></thead><tbody>`;
      libroCampo.forEach((r) => {
        html += `<tr><td>${r.fecha}</td><td>${r.especie}</td><td>${r.actividad}</td><td>${r.detalle}</td></tr>`;
      });
      html += '</tbody></table>';
      tabla.innerHTML = html;
    }
    renderTabla();

    document.getElementById('form-actividad-granja').onsubmit = function (e) {
      e.preventDefault();
      const fecha = document.getElementById('fecha-actividad').value;
      const especie = document.getElementById('especie-actividad').value.trim();
      const actividad = document
        .getElementById('actividad-granja')
        .value.trim();
      const detalle = document.getElementById('detalle-actividad').value.trim();
      if (!fecha || !actividad) return;
      libroCampo.push({ fecha, especie, actividad, detalle });
      localStorage.setItem('libroCampoGranja', JSON.stringify(libroCampo));
      renderTabla();
      this.reset();
      renderInforme();
    };

    // Calendario de vacunación (simulado)
    const calendario = [
      { fecha: '2026-06-05', evento: 'Vacunación fiebre aftosa (Bovinos)' },
      { fecha: '2026-07-10', evento: 'Desparasitación anual (Porcinos)' },
      { fecha: '2026-08-20', evento: 'Vacunación Newcastle (Aves)' },
    ];
    const calDiv = document.getElementById('calendario-vacunacion-granja');
    calDiv.innerHTML =
      '<ul style="padding-left:18px;">' +
      calendario
        .map((ev) => `<li><b>${ev.fecha}:</b> ${ev.evento}</li>`)
        .join('') +
      '</ul>';

    // Calculadora de alimento
    document.getElementById('form-alimento-granja').onsubmit = function (e) {
      e.preventDefault();
      const animales =
        parseInt(document.getElementById('num-animales-alim').value) || 0;
      const peso =
        parseFloat(document.getElementById('peso-promedio').value) || 0;
      // Fórmula ejemplo: 3% del peso vivo total
      const resultado =
        animales > 0 && peso > 0 ? (animales * peso * 0.03).toFixed(2) : 0;
      document.getElementById('resultado-alimento-granja').textContent =
        resultado + ' kg/día';
    };
    // Calculadora de fertilizante
    document.getElementById('form-fertilizante-granja').onsubmit = function (
      e
    ) {
      e.preventDefault();
      const lotes =
        parseInt(document.getElementById('num-lotes-fert').value) || 0;
      const resultado = lotes > 0 ? (lotes * 25).toFixed(2) : 0;
      document.getElementById('resultado-fertilizante-granja').textContent =
        resultado + ' kg/mes';
    };

    // Informe técnico y visualización
    function renderInforme() {
      const div = document.getElementById('informe-granja');
      if (!div) return;
      if (!libroCampo.length) {
        div.innerHTML = '<i>No hay datos para informe.</i>';
        return;
      }
      const totalActividades = libroCampo.length;
      const especies = [...new Set(libroCampo.map((r) => r.especie))];
      div.innerHTML = `
        <div style="background:#e3f2fd;padding:18px;border-radius:12px;max-width:600px;margin:18px auto;">
          <b>Total actividades registradas:</b> ${totalActividades}<br>
          <b>Especies gestionadas:</b> ${especies.join(', ') || 'N/A'}<br>
        </div>
      `;
    }
    renderInforme();
  },
  cargarDatosDemo: function () {
    // Adaptado: fases y ejemplos reales de trazabilidad de granjas
    const data = {
      titulo: 'Trazabilidad de Granjas',
      fases: [
        {
          paso: 1,
          titulo: 'Registro y Documentación',
          estado: 'completado',
          detalles: [
            'Identificación individual de animales',
            'Registro digital de vacunación y manejo',
            'Ejemplo: Uso de formatos estándar y QR para trazabilidad',
          ],
        },
        {
          paso: 2,
          titulo: 'Alimentación y Manejo',
          estado: 'completado',
          detalles: [
            'Registro de raciones y control sanitario',
            'Capacitación en digitalización de registros',
            'Ejemplo: Respaldo automático en la nube de datos sanitarios',
          ],
        },
        {
          paso: 3,
          titulo: 'Producción y Calidad',
          estado: 'pendiente',
          detalles: [
            'Registro de producción y calidad',
            'Generación de reportes técnicos con QR',
            'Ejemplo: Recuperación de historial tras auditoría',
          ],
        },
        {
          paso: 4,
          titulo: 'Comercialización y Certificación',
          estado: 'bloqueado',
          detalles: [
            'Certificados y trazabilidad documental',
            'Cumplimiento de normativas y auditorías',
            'Ejemplo: Acceso a mercados con trazabilidad completa',
          ],
        },
      ],
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'trazabilidad-granjas-content',
        data
      );

      // Selector visual de especie con iconos y botones
      const especies = [
        {
          nombre: 'Cerdos',
          icono: '🐖',
          color: '#f57c00',
          handler: mostrarPanelGuiaCerdosPotrero,
        },
        {
          nombre: 'Bovinos',
          icono: '🐄',
          color: '#388e3c',
          handler: mostrarPanelGuiaBovinos,
        },
        {
          nombre: 'Aves',
          icono: '🐔',
          color: '#fbc02d',
          handler: mostrarPanelGuiaAves,
        },
        {
          nombre: 'Cabras',
          icono: '🐐',
          color: '#8d6e63',
          handler: mostrarPanelGuiaCabras,
        },
        {
          nombre: 'Cuyes',
          icono: '🐹',
          color: '#a1887f',
          handler: mostrarPanelGuiaCuyes,
        },
        {
          nombre: 'Equinos',
          icono: '🐎',
          color: '#1976d2',
          handler: mostrarPanelGuiaEquinos,
        },
      ];
      const cont = document.getElementById('trazabilidad-granjas-content');
      if (cont) {
        const selector = document.createElement('div');
        selector.style =
          'display:flex;flex-wrap:wrap;gap:12px;margin:24px 0 12px 0;justify-content:center;';
        especies.forEach((esp) => {
          const btn = document.createElement('button');
          btn.innerHTML = `<span style="font-size:1.6em;margin-right:8px;">${esp.icono}</span> ${esp.nombre}`;
          btn.className = 'btn-melantia';
          btn.style = `padding:12px 18px;background:${esp.color};color:#fff;border:none;border-radius:8px;font-size:1em;cursor:pointer;min-width:160px;display:flex;align-items:center;gap:8px;justify-content:center;`;
          btn.onclick = esp.handler;
          selector.appendChild(btn);
        });
        cont.appendChild(selector);
      }
    });
    // Panel interactivo para la guía paso a paso
    window.mostrarPanelGuiaCerdosPotrero = function () {
      import('../modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/cerdos.js').then(
        (mod) => {
          const Cerdos = mod.default || window.Cerdos;
          let paso = 0;
          let tipo = 'potrero';
          const panel =
            document.getElementById('panel-novedades') || document.body;
          function renderPaso() {
            const mensaje = Cerdos.guiarManejo(paso, tipo);
            panel.innerHTML = `
            <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
              <h2 style='color:#f57c00;margin-bottom:8px;'>Guía: Cría de Cerdos en Potrero</h2>
              <div style="min-height:60px;font-size:1.15em;color:#333;margin-bottom:18px;">${mensaje || '¡Has completado la guía!'}</div>
              <div style="display:flex;gap:12px;justify-content:flex-end;">
                <button id="btn-siguiente-cerdo" style="background:#f57c00;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">${mensaje ? 'Siguiente' : 'Volver'}</button>
              </div>
            </div>
          `;
            document.getElementById('btn-siguiente-cerdo').onclick =
              function () {
                if (mensaje) {
                  paso++;
                  renderPaso();
                } else {
                  MelantiaTrazabilidadGranjas.mostrarPanel();
                }
              };
          }
          renderPaso();
        }
      );
    };
    // Plantillas para otras especies
    window.mostrarPanelGuiaBovinos = function () {
      import('../modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/bovinos.js').then(
        (mod) => {
          const Bovinos = mod.default || window.Bovinos;
          const panel =
            document.getElementById('panel-novedades') || document.body;
          let guia = 'manejo';
          let paso = 0;

          function renderPaso() {
            let mensaje = '';
            let color = '#388e3c';
            let titulo = '';
            if (guia === 'manejo') {
              mensaje = Bovinos.guiarManejo(paso);
              titulo = 'Guía: Manejo de Bovinos';
            } else if (guia === 'reproduccion') {
              mensaje = Bovinos.guiarReproduccion(paso);
              titulo = 'Guía: Reproducción de Bovinos';
            } else if (guia === 'alimentacion') {
              mensaje = Bovinos.guiarAlimentacion(paso);
              titulo = 'Guía: Alimentación de Bovinos';
            } else if (guia === 'sanidad') {
              mensaje = Bovinos.guiarSanidad(paso);
              titulo = 'Guía: Sanidad de Bovinos';
            }
            panel.innerHTML = `
              <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
                <h2 style='color:${color};margin-bottom:8px;'><span style="font-size:1.5em;">🐄</span> ${titulo}</h2>
                <div style="display:flex;gap:8px;margin-bottom:18px;justify-content:center;">
                  <button id="btn-guia-manejo" style="background:${guia === 'manejo' ? color : '#e0e0e0'};color:${guia === 'manejo' ? '#fff' : '#333'};padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Manejo</button>
                  <button id="btn-guia-reproduccion" style="background:${guia === 'reproduccion' ? color : '#e0e0e0'};color:${guia === 'reproduccion' ? '#fff' : '#333'};padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Reproducción</button>
                  <button id="btn-guia-alimentacion" style="background:${guia === 'alimentacion' ? color : '#e0e0e0'};color:${guia === 'alimentacion' ? '#fff' : '#333'};padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Alimentación</button>
                  <button id="btn-guia-sanidad" style="background:${guia === 'sanidad' ? color : '#e0e0e0'};color:${guia === 'sanidad' ? '#fff' : '#333'};padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Sanidad</button>
                </div>
                <div style="min-height:60px;font-size:1.15em;color:#333;margin-bottom:18px;">${mensaje || '¡Has completado la guía!'}</div>
                <div style="display:flex;gap:12px;justify-content:flex-end;">
                  <button id="btn-siguiente-bovino" style="background:${color};color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">${mensaje ? 'Siguiente' : 'Volver'}</button>
                </div>
              </div>
            `;
            document.getElementById('btn-guia-manejo').onclick = function () {
              guia = 'manejo';
              paso = 0;
              renderPaso();
            };
            document.getElementById('btn-guia-reproduccion').onclick =
              function () {
                guia = 'reproduccion';
                paso = 0;
                renderPaso();
              };
            document.getElementById('btn-guia-alimentacion').onclick =
              function () {
                guia = 'alimentacion';
                paso = 0;
                renderPaso();
              };
            document.getElementById('btn-guia-sanidad').onclick = function () {
              guia = 'sanidad';
              paso = 0;
              renderPaso();
            };
            document.getElementById('btn-siguiente-bovino').onclick =
              function () {
                if (mensaje) {
                  paso++;
                  renderPaso();
                } else {
                  MelantiaTrazabilidadGranjas.mostrarPanel();
                }
              };
          }
          renderPaso();
        }
      );
    };
    window.mostrarPanelGuiaAves = function () {
      alert('Guía de aves: próximamente.');
    };
    window.mostrarPanelGuiaCabras = function () {
      alert('Guía de cabras: próximamente.');
    };
    window.mostrarPanelGuiaCuyes = function () {
      alert('Guía de cuyes: próximamente.');
    };
    window.mostrarPanelGuiaEquinos = function () {
      alert('Guía de equinos: próximamente.');
    };
  },
};

export default MelantiaTrazabilidadGranjas;
