// gps_medicion_terrenos.js
// Flujo funcional: registro rapido de vertices y calculo de area/perimetro.

function calcularAreaYPerimetro(puntos) {
  if (!Array.isArray(puntos) || puntos.length < 3) {
    return { area: 0, perimetro: 0 };
  }
  let area2 = 0;
  let perimetro = 0;
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i];
    const b = puntos[(i + 1) % puntos.length];
    area2 += a.x * b.y - b.x * a.y;
    perimetro += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return { area: Math.abs(area2) / 2, perimetro };
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:900px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:12px;">
      <h2 style="margin:0;color:#276749;">GPS (Medicion de Terrenos)</h2>
      <p style="margin:0;color:#445;">Registra coordenadas UTM para estimar area y perimetro del lote.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end;">
        <label>UTM X<input id="gps-x" type="number" step="0.01" value="671042.32" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>UTM Y<input id="gps-y" type="number" step="0.01" value="9969645.15" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <button id="gps-add" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Agregar punto</button>
        <button id="gps-close" style="padding:10px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Calcular</button>
      </div>

      <div id="gps-lista" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Sin puntos.</div>
      <div id="gps-res" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Sin calculo.</div>

      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  const puntos = [];
  const render = () => {
    const lista = document.getElementById('gps-lista');
    if (lista) {
      lista.innerHTML = puntos.length
        ? `<ul style="margin:0;padding-left:18px;">${puntos
            .map((p, i) => `<li>P${i + 1}: (${p.x}, ${p.y})</li>`)
            .join('')}</ul>`
        : 'Sin puntos.';
    }
  };

  document.getElementById('gps-add')?.addEventListener('click', () => {
    const x = Number(document.getElementById('gps-x')?.value || 0);
    const y = Number(document.getElementById('gps-y')?.value || 0);
    puntos.push({ x, y });
    render();
  });

  document.getElementById('gps-close')?.addEventListener('click', () => {
    const { area, perimetro } = calcularAreaYPerimetro(puntos);
    const res = document.getElementById('gps-res');
    if (res) {
      res.textContent =
        area > 0
          ? `Area: ${area.toLocaleString('es-EC')} m2 | Hectareas: ${(area / 10000).toFixed(4)} ha | Perimetro: ${perimetro.toFixed(2)} m`
          : 'Necesitas al menos 3 puntos para calcular.';
    }
  });

  render();
}

export default { mostrarPanel };
