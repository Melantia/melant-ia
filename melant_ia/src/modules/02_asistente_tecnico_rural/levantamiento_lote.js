// levantamiento_lote.js
// Módulo para captura, cálculo y actualización automática del JSON de levantamiento de lotes
// Listo para integración en PWA MELANT IA

const LevantamientoLote = {
  datos: {
    registro_inicial: {
      propietario_nombre: '',
      propietario_id: '',
      lote_nombre: '',
      ubicacion: {
        provincia: '',
        canton: '',
        sector: '',
      },
      uso_suelo: {
        cultivo: '',
        variedad: '',
      },
    },
    encabezado: {},
    configuracion_plano: {},
    poligono: [],
    resultados_calculados: {},
  },

  // Inicializa el registro inicial (campos mínimos)
  registroInicial({
    propietario_nombre,
    propietario_id,
    lote_nombre,
    provincia,
    canton,
    sector,
    cultivo,
    variedad,
  }) {
    this.datos.registro_inicial = {
      propietario_nombre: propietario_nombre || '',
      propietario_id: propietario_id || '',
      lote_nombre: lote_nombre || '',
      ubicacion: {
        provincia: provincia || '',
        canton: canton || '',
        sector: sector || '',
      },
      uso_suelo: {
        cultivo: cultivo || '',
        variedad: variedad || '',
      },
    };
  },

  // Sugerencias/autocompletado para selects (pueden cargarse desde JSON externo)
  sugerencias: {
    provincias: [
      'Manabí',
      'Guayas',
      'Los Ríos',
      'Esmeraldas',
      'El Oro',
      'Santa Elena',
      'Chimborazo',
      'Cotopaxi',
      'Imbabura',
      'Pichincha',
      'Bolívar',
      'Carchi',
      'Tungurahua',
      'Pastaza',
      'Sucumbíos',
      'Morona Santiago',
      'Napo',
      'Orellana',
      'Zamora Chinchipe',
      'Azuay',
      'Cañar',
      'Loja',
    ],
    cultivos: [
      'Cacao',
      'Café',
      'Maíz',
      'Arroz',
      'Banano',
      'Palma Africana',
      'Potrero',
      'Yuca',
      'Plátano',
      'Frutales',
      'Hortalizas',
    ],
    variedades: [
      'Nacional',
      'CCN-51',
      'Robusta',
      'Criollo',
      'IR-8',
      'Sarchimor',
      'Catuaí',
      'Otras',
    ],
  },

  // Inicializa el levantamiento con metadatos y configuración
  iniciar({
    lote_nombre,
    propietario,
    ubicacion_general,
    cultivo_principal,
    dispositivo_precision_m,
    sistema_referencia = 'WGS84 / UTM zone 17S',
    formato_salida = 'A4_Horizontal',
    unidad_medida = 'metros',
  }) {
    this.datos.encabezado = {
      lote_nombre,
      propietario,
      ubicacion_general,
      fecha_medicion: new Date().toISOString(),
      cultivo_principal,
      dispositivo_precision_m,
    };
    this.datos.configuracion_plano = {
      unidad_medida,
      sistema_referencia,
      formato_salida,
    };
    this.datos.poligono = [];
    this.datos.resultados_calculados = {};
  },

  // Agrega un vértice al polígono
  agregarVertice({ nombre, lat, lng, utm_x, utm_y, alerta_sonora = true }) {
    const punto_id = this.datos.poligono.length + 1;
    this.datos.poligono.push({
      punto_id,
      nombre,
      lat,
      lng,
      utm_x,
      utm_y,
      alerta_sonora,
    });
  },

  // Calcula distancias, área, perímetro y error de cierre
  cerrarPoligono() {
    const pol = this.datos.poligono;
    if (pol.length < 3) return;
    // Calcular distancias entre puntos
    for (let i = 0; i < pol.length; i++) {
      const p1 = pol[i];
      const p2 = pol[(i + 1) % pol.length];
      const dx = p2.utm_x - p1.utm_x;
      const dy = p2.utm_y - p1.utm_y;
      pol[i].distancia_al_siguiente = Math.sqrt(dx * dx + dy * dy);
    }
    // Área y perímetro
    let area = 0,
      perimetro = 0;
    for (let i = 0; i < pol.length; i++) {
      const p1 = pol[i];
      const p2 = pol[(i + 1) % pol.length];
      area += p1.utm_x * p2.utm_y - p2.utm_x * p1.utm_y;
      perimetro += pol[i].distancia_al_siguiente;
    }
    area = Math.abs(area) / 2;
    // Error de cierre
    const cierre_dx = pol[0].utm_x - pol[pol.length - 1].utm_x;
    const cierre_dy = pol[0].utm_y - pol[pol.length - 1].utm_y;
    const cierre_poligono_error = Math.sqrt(
      cierre_dx * cierre_dx + cierre_dy * cierre_dy
    );
    this.datos.resultados_calculados = {
      area_total_m2: area,
      area_hectareas: area / 10000,
      perimetro_total_m: perimetro,
      cierre_poligono_error,
    };
  },

  // Marca un punto como ya visitado (apaga alerta sonora)
  marcarPuntoVisitado(punto_id) {
    const p = this.datos.poligono.find((pt) => pt.punto_id === punto_id);
    if (p) p.alerta_sonora = false;
  },

  // Devuelve el JSON listo para guardar o exportar
  getJSON() {
    return JSON.parse(JSON.stringify(this.datos));
  },

  // Recupera datos previos del propietario para autocompletar (localStorage)
  cargarPropietarioPrevio() {
    try {
      const prev = localStorage.getItem('propietario_melant');
      if (prev) {
        const datos = JSON.parse(prev);
        this.datos.registro_inicial.propietario_nombre =
          datos.propietario_nombre || '';
        this.datos.registro_inicial.propietario_id = datos.propietario_id || '';
      }
    } catch (e) {}
  },

  // Guarda datos del propietario para autocompletar en el futuro
  guardarPropietarioPrevio() {
    try {
      const datos = {
        propietario_nombre: this.datos.registro_inicial.propietario_nombre,
        propietario_id: this.datos.registro_inicial.propietario_id,
      };
      localStorage.setItem('propietario_melant', JSON.stringify(datos));
    } catch (e) {}
  },
};

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:900px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:12px;">
      <h2 style="margin:0;color:#276749;">Levantamiento de Lote</h2>
      <p style="margin:0;color:#445;">Registra vertices UTM, calcula area, perimetro y error de cierre con la logica real del modulo.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        <label>Nombre del lote<input id="lev-lote" type="text" value="Lote 1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Propietario<input id="lev-prop" type="text" value="Productor" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Cultivo<input id="lev-cultivo" type="text" value="Cacao" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end;">
        <label>UTM X<input id="lev-x" type="number" step="0.01" value="671042.32" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>UTM Y<input id="lev-y" type="number" step="0.01" value="9969645.15" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <button id="lev-add" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Agregar vertice</button>
        <button id="lev-close" style="padding:10px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Cerrar poligono</button>
      </div>

      <div id="lev-vertices" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Sin vertices.</div>
      <div id="lev-resultados" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Sin calculos.</div>

      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  LevantamientoLote.iniciar({
    lote_nombre: document.getElementById('lev-lote')?.value || 'Lote 1',
    propietario: document.getElementById('lev-prop')?.value || 'Productor',
    ubicacion_general: 'No especificada',
    cultivo_principal: document.getElementById('lev-cultivo')?.value || 'Cacao',
    dispositivo_precision_m: 2.5,
  });

  const render = () => {
    const vHost = document.getElementById('lev-vertices');
    const rHost = document.getElementById('lev-resultados');
    if (vHost) {
      const pol = LevantamientoLote.datos.poligono || [];
      vHost.innerHTML = pol.length
        ? `<ul style="margin:0;padding-left:18px;">${pol
            .map((p) => `<li>P${p.punto_id}: (${p.utm_x}, ${p.utm_y})</li>`)
            .join('')}</ul>`
        : 'Sin vertices.';
    }
    if (rHost) {
      const r = LevantamientoLote.datos.resultados_calculados || {};
      rHost.innerHTML = r.area_total_m2
        ? `Area: <b>${Number(r.area_total_m2).toLocaleString('es-EC')}</b> m2 | Hectareas: <b>${Number(r.area_hectareas).toFixed(4)}</b> ha | Perimetro: <b>${Number(r.perimetro_total_m).toFixed(2)}</b> m | Error cierre: <b>${Number(r.cierre_poligono_error).toFixed(3)}</b> m`
        : 'Sin calculos.';
    }
  };

  document.getElementById('lev-add')?.addEventListener('click', () => {
    const x = Number(document.getElementById('lev-x')?.value || 0);
    const y = Number(document.getElementById('lev-y')?.value || 0);
    LevantamientoLote.agregarVertice({
      nombre: `Hito ${LevantamientoLote.datos.poligono.length + 1}`,
      lat: 0,
      lng: 0,
      utm_x: x,
      utm_y: y,
      alerta_sonora: true,
    });
    render();
  });

  document.getElementById('lev-close')?.addEventListener('click', () => {
    LevantamientoLote.cerrarPoligono();
    render();
  });

  render();
}

window.LevantamientoLote = LevantamientoLote;
export { LevantamientoLote };
export default { mostrarPanel, LevantamientoLote };

// Ejemplo de uso:
// LevantamientoLote.iniciar({ lote_nombre: "La Esperanza", propietario: "Juan Pérez", ubicacion_general: "Chone, Manabí", cultivo_principal: "Cacao Arriba", dispositivo_precision_m: 2.5 });
// LevantamientoLote.agregarVertice({ nombre: "Hito Norte", lat: -0.274512, lng: -79.463210, utm_x: 671042.32, utm_y: 9969645.15 });
// ... (agregar más vértices)
// LevantamientoLote.cerrarPoligono();
// const json = LevantamientoLote.getJSON();
