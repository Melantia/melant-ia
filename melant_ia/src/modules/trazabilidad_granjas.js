// Módulo: Trazabilidad de Granjas
// Lógica y UI para la trazabilidad de granjas en MELANTIA

const MelantiaTrazabilidadGranjas = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#1E88E5;margin-bottom:8px;'>Trazabilidad de Granjas</h2>
        <div id="trazabilidad-granjas-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#1E88E5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();
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
