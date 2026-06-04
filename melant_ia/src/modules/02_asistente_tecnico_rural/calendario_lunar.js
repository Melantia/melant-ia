const FASES = [
  {
    nombre: 'Luna Nueva',
    icono: '🌑',
    recomendacion:
      'Ideal para podas sanitarias, control de malezas y preparacion de suelo.',
  },
  {
    nombre: 'Cuarto Creciente',
    icono: '🌓',
    recomendacion:
      'Favorece siembra de cultivos de fruto y aplicacion de bioestimulantes.',
  },
  {
    nombre: 'Luna Llena',
    icono: '🌕',
    recomendacion:
      'Buena ventana para injertos, cosecha de semilla y observacion fitosanitaria.',
  },
  {
    nombre: 'Cuarto Menguante',
    icono: '🌗',
    recomendacion:
      'Recomendado para cosecha, secado, compostaje y manejo de plagas de suelo.',
  },
];

function calcularFaseLunar(fechaISO) {
  const fecha = new Date(fechaISO);
  const dias = (fecha.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const edad = ((dias % 29.530588853) + 29.530588853) % 29.530588853;
  if (edad < 7.38) return { indice: 0, edad };
  if (edad < 14.77) return { indice: 1, edad };
  if (edad < 22.15) return { indice: 2, edad };
  return { indice: 3, edad };
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  const hoy = new Date().toISOString().slice(0, 10);
  const fase = calcularFaseLunar(hoy);
  const actual = FASES[fase.indice];

  contenedor.innerHTML = `
		<div style="max-width:820px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #1f2937;background:#0b0b0b;box-shadow:0 2px 16px #0007;color:#f3f4f6;">
			<h2 style="margin-top:0;color:#39ff14;">Calendario Lunar</h2>
			<p style="color:#cbd5e1;line-height:1.5;">Selecciona una fecha para obtener la fase lunar y recomendaciones agronomicas aplicables.</p>
			<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
				<label for="fecha-lunar" style="color:#e5e7eb;">Fecha:</label>
				<input id="fecha-lunar" type="date" value="${hoy}" style="padding:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f8fafc;" />
				<button id="btn-evaluar-luna" style="padding:8px 14px;border-radius:8px;border:none;background:#0ea5e9;color:#fff;cursor:pointer;">Evaluar</button>
			</div>
			<div id="resultado-lunar" style="margin-top:16px;padding:14px;border-radius:10px;background:#111827;border:1px solid #374151;">
				<div style="font-size:1.2em;"><strong>${actual.icono} ${actual.nombre}</strong></div>
				<div style="color:#9ca3af;margin-top:6px;">Edad lunar aproximada: ${fase.edad.toFixed(1)} dias</div>
				<div style="margin-top:8px;color:#d1fae5;">${actual.recomendacion}</div>
			</div>
			<button onclick="window.volverAlMenu && window.volverAlMenu()" style="margin-top:14px;padding:8px 14px;border-radius:8px;border:none;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
		</div>
	`;

  const btn = document.getElementById('btn-evaluar-luna');
  btn?.addEventListener('click', () => {
    const fecha = document.getElementById('fecha-lunar')?.value || hoy;
    const data = calcularFaseLunar(fecha);
    const info = FASES[data.indice];
    const salida = document.getElementById('resultado-lunar');
    if (!salida) return;
    salida.innerHTML = `
			<div style="font-size:1.2em;"><strong>${info.icono} ${info.nombre}</strong></div>
			<div style="color:#9ca3af;margin-top:6px;">Edad lunar aproximada: ${data.edad.toFixed(1)} dias</div>
			<div style="margin-top:8px;color:#d1fae5;">${info.recomendacion}</div>
		`;
  });
}

export default { mostrarPanel };
