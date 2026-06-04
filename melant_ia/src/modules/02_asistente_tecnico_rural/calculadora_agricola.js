const CULTIVOS_ECUADOR = {
  cacao: {
    nombre: 'Cacao',
    distFilas: 3.0,
    distPlantas: 3.0,
    npkMin: 250,
    npkMax: 400,
    co2Min: 2.5,
    co2Max: 4.0,
  },
  cafe: {
    nombre: 'Cafe',
    distFilas: 2.5,
    distPlantas: 1.0,
    npkMin: 300,
    npkMax: 500,
    co2Min: 2.0,
    co2Max: 3.5,
  },
  palma: {
    nombre: 'Palma',
    distFilas: 9.0,
    distPlantas: 9.0,
    npkMin: 600,
    npkMax: 900,
    co2Min: 5.0,
    co2Max: 8.0,
  },
  maiz: {
    nombre: 'Maiz',
    distFilas: 0.8,
    distPlantas: 0.2,
    npkMin: 150,
    npkMax: 250,
    co2Min: 0.5,
    co2Max: 1.0,
  },
  platano: {
    nombre: 'Platano',
    distFilas: 3.0,
    distPlantas: 2.0,
    npkMin: 400,
    npkMax: 600,
    co2Min: 1.0,
    co2Max: 2.0,
  },
};

class CalculadoraAgricola {
  // 1. FUNCIONES AGRICOLAS
  static calcularDensidad(
    areaHa,
    distFilas,
    distPlantas,
    germinacion = 1,
    pureza = 1
  ) {
    const areaM2 = Number(areaHa) * 10000;
    const separacion = Number(distFilas) * Number(distPlantas);
    if (areaM2 <= 0 || separacion <= 0) return 0;
    const plantasPorHa = areaM2 / separacion;
    return Math.floor(plantasPorHa * Number(germinacion) * Number(pureza));
  }

  static calcularDosisMezcla(dosisHa, area, volumenTanque) {
    const dosisTotal = Number(dosisHa) * Number(area);
    const aguaNecesaria = Number(volumenTanque);
    return { dosisTotal, aguaNecesaria };
  }

  // 2. FUNCIONES GANADERAS Y PORCINAS
  static calcularUGM(animales) {
    return (
      Number(animales?.vacas || 0) * 1.0 +
      Number(animales?.toros || 0) * 1.2 +
      Number(animales?.terneros || 0) * 0.5
    );
  }

  static calcularGDP(pesoFinal, pesoInicial, dias) {
    const totalDias = Number(dias);
    if (totalDias <= 0) return 0;
    return (Number(pesoFinal) - Number(pesoInicial)) / totalDias;
  }

  // 3. FUNCIONES FORESTALES
  static cubicarSmalian(dap1, dap2, longitud) {
    const area1 = Math.PI * Math.pow(Number(dap1) / 200, 2);
    const area2 = Math.PI * Math.pow(Number(dap2) / 200, 2);
    return ((area1 + area2) / 2) * Number(longitud);
  }

  static estimarCarbono(volumenMadera, factorBEF = 1.3, fraccionCarbono = 0.5) {
    const biomasa = Number(volumenMadera) * Number(factorBEF);
    return biomasa * Number(fraccionCarbono) * 3.67;
  }

  // 4. LOGICA INTELIGENTE
  static recomendarRiego(aguaUtilPct) {
    const valor = Number(aguaUtilPct);
    if (valor < 30) {
      return {
        nivel: 'ALERTA',
        mensaje:
          'Agua util menor al 30%. Se recomienda activar plan de riego inmediato.',
      };
    }
    if (valor < 50) {
      return {
        nivel: 'PRECAUCION',
        mensaje:
          'Agua util entre 30% y 50%. Ajuste frecuencia de monitoreo y riego preventivo.',
      };
    }
    return {
      nivel: 'OK',
      mensaje: 'Humedad adecuada. Mantenga monitoreo de rutina.',
    };
  }

  static procesarBalanceHidrico(aguaUtilPct) {
    return this.recomendarRiego(aguaUtilPct);
  }

  static calcularUGMInventario(animales) {
    const ugm = this.calcularUGM(animales);
    try {
      window.dispatchEvent(
        new CustomEvent('melantia:inventario:ugm_actualizada', {
          detail: { ugm, animales },
        })
      );
    } catch {
      // Sin bloqueo: la calculadora sigue funcionando si no hay listener global.
    }
    return ugm;
  }

  static async registrarCapturaCarbono(payload) {
    const registro = {
      ...payload,
      fecha: new Date().toISOString(),
      fuente: 'calculadora_agricola',
    };

    if (window.supabase?.from) {
      const { error } = await window.supabase
        .from('captura_carbono')
        .insert(registro);
      if (error) return { ok: false, destino: 'supabase', error };
      return { ok: true, destino: 'supabase' };
    }

    const key = 'melantia_captura_carbono_local';
    let historial = [];
    try {
      historial = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      historial = [];
    }
    historial.push(registro);
    localStorage.setItem(key, JSON.stringify(historial));
    return { ok: true, destino: 'localStorage' };
  }
}

function n(value, digits = 2) {
  return Number(value || 0).toLocaleString('es-EC', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function aplicarContextoCultivo(cultivoId) {
  const cultivo = document.getElementById('calc-cultivo');
  const distFilas = document.getElementById('calc-dist-filas');
  const distPlantas = document.getElementById('calc-dist-plantas');
  const dosisHa = document.getElementById('calc-dosis-ha');
  const salida = document.getElementById('res-densidad');

  if (!cultivo || !CULTIVOS_ECUADOR[cultivoId]) return;
  const ref = CULTIVOS_ECUADOR[cultivoId];

  cultivo.value = cultivoId;
  if (distFilas) distFilas.value = String(ref.distFilas);
  if (distPlantas) distPlantas.value = String(ref.distPlantas);
  if (dosisHa) dosisHa.value = String((ref.npkMin + ref.npkMax) / 2);
  if (salida) {
    salida.textContent = `Contexto de cultivo activo: ${ref.nombre}. Distancias y dosis sugeridas precargadas.`;
  }
}

function bindCalculadoraEventos() {
  const cultivo = document.getElementById('calc-cultivo');
  const areaHa = document.getElementById('calc-area-ha');
  const distFilas = document.getElementById('calc-dist-filas');
  const distPlantas = document.getElementById('calc-dist-plantas');

  cultivo?.addEventListener('change', () => {
    const ref = CULTIVOS_ECUADOR[cultivo.value];
    if (!ref) return;
    localStorage.setItem('melantia_cultivo_activo', cultivo.value);
    distFilas.value = String(ref.distFilas);
    distPlantas.value = String(ref.distPlantas);
  });

  document.getElementById('btn-densidad')?.addEventListener('click', () => {
    const g =
      Number(document.getElementById('calc-germinacion')?.value || 100) / 100;
    const p =
      Number(document.getElementById('calc-pureza')?.value || 100) / 100;
    const densidad = CalculadoraAgricola.calcularDensidad(
      Number(areaHa?.value || 0),
      Number(distFilas?.value || 0),
      Number(distPlantas?.value || 0),
      g,
      p
    );
    const out = document.getElementById('res-densidad');
    if (out)
      out.textContent = `Densidad estimada: ${densidad.toLocaleString('es-EC')} plantas`;
  });

  document.getElementById('btn-dosis')?.addEventListener('click', () => {
    const dosisHa = Number(
      document.getElementById('calc-dosis-ha')?.value || 0
    );
    const area = Number(areaHa?.value || 0);
    const volumenTanque = Number(
      document.getElementById('calc-tanque')?.value || 0
    );
    const { dosisTotal, aguaNecesaria } =
      CalculadoraAgricola.calcularDosisMezcla(dosisHa, area, volumenTanque);
    const out = document.getElementById('res-dosis');
    if (out) {
      out.textContent = `Mezcla total: ${n(dosisTotal)} kg/L de producto, agua sugerida: ${n(aguaNecesaria)} L`;
    }
  });

  document.getElementById('btn-ugm')?.addEventListener('click', () => {
    const animales = {
      vacas: Number(document.getElementById('gan-vacas')?.value || 0),
      toros: Number(document.getElementById('gan-toros')?.value || 0),
      terneros: Number(document.getElementById('gan-terneros')?.value || 0),
    };
    const ugm = CalculadoraAgricola.calcularUGMInventario(animales);
    const out = document.getElementById('res-ugm');
    if (out) out.textContent = `UGM total: ${n(ugm, 3)}`;
  });

  document.getElementById('btn-gdp')?.addEventListener('click', () => {
    const gdp = CalculadoraAgricola.calcularGDP(
      Number(document.getElementById('gan-pf')?.value || 0),
      Number(document.getElementById('gan-pi')?.value || 0),
      Number(document.getElementById('gan-dias')?.value || 0)
    );
    const out = document.getElementById('res-gdp');
    if (out) out.textContent = `GDP: ${n(gdp, 3)} kg/dia`;
  });

  document
    .getElementById('btn-carbono')
    ?.addEventListener('click', async () => {
      const dap1 = Number(document.getElementById('for-dap1')?.value || 0);
      const dap2 = Number(document.getElementById('for-dap2')?.value || 0);
      const longitud = Number(
        document.getElementById('for-longitud')?.value || 0
      );
      const volumen = CalculadoraAgricola.cubicarSmalian(dap1, dap2, longitud);
      const co2 = CalculadoraAgricola.estimarCarbono(volumen);
      const out = document.getElementById('res-carbono');
      if (out) {
        out.textContent = `Volumen: ${n(volumen, 4)} m3 | CO2 estimado: ${n(co2, 4)} tCO2e`;
      }
      await CalculadoraAgricola.registrarCapturaCarbono({
        dap1,
        dap2,
        longitud,
        volumen_madera: volumen,
        co2_estimado: co2,
      });
    });

  document.getElementById('btn-riego')?.addEventListener('click', () => {
    const aguaUtil = Number(
      document.getElementById('h2o-agua-util')?.value || 0
    );
    const rec = CalculadoraAgricola.procesarBalanceHidrico(aguaUtil);
    const out = document.getElementById('res-riego');
    if (out) out.textContent = `${rec.nivel}: ${rec.mensaje}`;
  });

  const actualizarDesdeInventario = (event) => {
    const detalle = event?.detail || {};
    const animales = detalle?.animales || {};
    const ugm = Number(detalle?.ugm || 0);

    const vacas = document.getElementById('gan-vacas');
    const toros = document.getElementById('gan-toros');
    const terneros = document.getElementById('gan-terneros');
    if (vacas) vacas.value = String(Number(animales.vacas || 0));
    if (toros) toros.value = String(Number(animales.toros || 0));
    if (terneros) terneros.value = String(Number(animales.terneros || 0));

    const out = document.getElementById('res-ugm');
    if (out) {
      out.textContent = `UGM total: ${n(ugm, 3)} (actualizado desde inventario)`;
    }
  };

  if (window.__melantiaUGMListener) {
    window.removeEventListener(
      'melantia:inventario:ugm_actualizada',
      window.__melantiaUGMListener
    );
  }
  window.__melantiaUGMListener = actualizarDesdeInventario;
  window.addEventListener(
    'melantia:inventario:ugm_actualizada',
    window.__melantiaUGMListener
  );

  try {
    const resumenGuardado = JSON.parse(
      localStorage.getItem('melantia_ugm_resumen') || 'null'
    );
    if (resumenGuardado?.animales) {
      actualizarDesdeInventario({ detail: resumenGuardado });
    }
  } catch {
    // Mantener funcionamiento aunque no haya resumen previo.
  }

  const actualizarDesdeCultivos = (event) => {
    const cultivoId = String(event?.detail?.cultivo || '')
      .trim()
      .toLowerCase();
    if (!cultivoId) return;
    localStorage.setItem('melantia_cultivo_activo', cultivoId);
    aplicarContextoCultivo(cultivoId);
  };

  if (window.__melantiaCultivoListener) {
    window.removeEventListener(
      'melantia:cultivo:seleccionado',
      window.__melantiaCultivoListener
    );
  }
  window.__melantiaCultivoListener = actualizarDesdeCultivos;
  window.addEventListener(
    'melantia:cultivo:seleccionado',
    window.__melantiaCultivoListener
  );

  const cultivoGuardado = String(
    localStorage.getItem('melantia_cultivo_activo') || ''
  )
    .trim()
    .toLowerCase();
  if (CULTIVOS_ECUADOR[cultivoGuardado]) {
    aplicarContextoCultivo(cultivoGuardado);
  }
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:980px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:16px;">
      <h2 style="margin:0;color:#276749;">Calculadora Agricola Inteligente</h2>
      <p style="margin:0;color:#334;">Motor unificado para agricultura, ganaderia y captura de carbono, con reglas tecnicas para Ecuador.</p>

      <section style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;display:grid;gap:10px;">
        <h3 style="margin:0;color:#1f2937;">1) Agricultura: densidad y dosis</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
          <label>Cultivo
            <select id="calc-cultivo" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;">
              <option value="cacao">Cacao</option>
              <option value="cafe">Cafe</option>
              <option value="palma">Palma</option>
              <option value="maiz">Maiz</option>
              <option value="platano">Platano</option>
            </select>
          </label>
          <label>Area (ha)<input id="calc-area-ha" type="number" step="0.01" value="1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Dist. filas (m)<input id="calc-dist-filas" type="number" step="0.01" value="3" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Dist. plantas (m)<input id="calc-dist-plantas" type="number" step="0.01" value="3" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Germinacion (%)<input id="calc-germinacion" type="number" step="0.01" value="100" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Pureza (%)<input id="calc-pureza" type="number" step="0.01" value="100" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end;">
          <label>Dosis/ha<input id="calc-dosis-ha" type="number" step="0.01" value="250" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Volumen tanque (L)<input id="calc-tanque" type="number" step="0.01" value="200" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <button id="btn-densidad" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Calcular densidad</button>
          <button id="btn-dosis" style="padding:10px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Calcular dosis</button>
        </div>
        <p id="res-densidad" style="margin:0;color:#1f2937;font-weight:700;">Densidad estimada: -</p>
        <p id="res-dosis" style="margin:0;color:#1f2937;font-weight:700;">Mezcla total: -</p>
      </section>

      <section style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;display:grid;gap:10px;">
        <h3 style="margin:0;color:#1f2937;">2) Ganaderia: UGM y GDP</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
          <label>Vacas<input id="gan-vacas" type="number" value="10" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Toros<input id="gan-toros" type="number" value="1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Terneros<input id="gan-terneros" type="number" value="5" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <button id="btn-ugm" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Calcular UGM</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
          <label>Peso inicial (kg)<input id="gan-pi" type="number" step="0.01" value="180" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Peso final (kg)<input id="gan-pf" type="number" step="0.01" value="250" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Dias<input id="gan-dias" type="number" value="90" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <button id="btn-gdp" style="padding:10px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Calcular GDP</button>
        </div>
        <p id="res-ugm" style="margin:0;color:#1f2937;font-weight:700;">UGM total: -</p>
        <p id="res-gdp" style="margin:0;color:#1f2937;font-weight:700;">GDP: -</p>
      </section>

      <section style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;display:grid;gap:10px;">
        <h3 style="margin:0;color:#1f2937;">3) Forestal: Smalian y carbono</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
          <label>DAP 1 (cm)<input id="for-dap1" type="number" step="0.01" value="22" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>DAP 2 (cm)<input id="for-dap2" type="number" step="0.01" value="20" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <label>Longitud (m)<input id="for-longitud" type="number" step="0.01" value="2.5" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
          <button id="btn-carbono" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Estimar CO2</button>
        </div>
        <p id="res-carbono" style="margin:0;color:#1f2937;font-weight:700;">Volumen y CO2: -</p>
      </section>

      <section style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;display:grid;gap:10px;">
        <h3 style="margin:0;color:#1f2937;">4) Logica inteligente</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end;">
          <label>Agua util (%)
            <input id="h2o-agua-util" type="number" step="0.01" value="28" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" />
          </label>
          <button id="btn-riego" style="padding:10px;border:none;border-radius:8px;background:#b45309;color:#fff;cursor:pointer;">Evaluar riego</button>
        </div>
        <p id="res-riego" style="margin:0;color:#1f2937;font-weight:700;">Estado de humedad: -</p>
      </section>

      <section style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;overflow:auto;">
        <h3 style="margin-top:0;color:#1f2937;">Factores de conversion para Ecuador</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Cultivo</th>
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Distancia (m)</th>
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">NPK (kg/ha)</th>
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">CO2 (t/ha/anio)</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(CULTIVOS_ECUADOR)
              .map(
                (c) => `
                <tr>
                  <td style="padding:8px;border:1px solid #e5e7eb;">${c.nombre}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;">${c.distFilas} x ${c.distPlantas}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;">${c.npkMin} - ${c.npkMax}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb;">${c.co2Min} - ${c.co2Max}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </section>

      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border-radius:6px;border:none;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  bindCalculadoraEventos();
}

window.CalculadoraAgricola = CalculadoraAgricola;
export default CalculadoraAgricola;
