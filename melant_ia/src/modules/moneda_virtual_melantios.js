export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#fbc02d;text-align:center;margin-bottom:24px;'>Moneda Virtual Melantios</h2>
      <p>Consulta, transfiere y utiliza tus Melantios en el ecosistema MELANTIA.</p>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#fbc02d;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
}
// Moneda Virtual Melantios — Módulo centralizado
// Submódulo de Suscripciones
// Aquí se centraliza toda la lógica de Melantios: saldo, historial, conversión, reglas, premios, fidelidad, formas de ganar, y mantenimiento de políticas.

const MelantiosCore = {
  config: {
    CONVERSION: 100, // 100M = $1
    EXCHANGE_RATE: 0.01, // 1M = $0.01
    MAX_PAYMENT_PCT: 0.25, // Máx. 25% del valor de un producto
    FIDELIDAD_MESES: 6, // Meses de suscripción para canje
    EXPIRATION_DAYS: 90, // Días de expiración de Melantios
  },
  saldo: 0,
  historialGanancia: [],
  historialGasto: [],
  formasDeGanar: [
    'Validar y certificar fotos útiles de cultivos/plagas/virus',
    'Participar en campañas de aprendizaje',
    'Completar retos de la app',
    'Referir nuevos usuarios',
    'Mantener suscripción activa (bonos de fidelidad)',
    'Otras actividades especiales (según promociones)',
  ],
  ganar(tipo, cantidad, detalle = '') {
    this.historialGanancia.push({
      tipo,
      cantidad,
      detalle,
      fecha: new Date().toISOString(),
    });
    this.saldo += cantidad;
    return this.saldo;
  },
  gastar(tipo, cantidad, detalle = '') {
    this.historialGasto.push({
      tipo,
      cantidad,
      detalle,
      fecha: new Date().toISOString(),
    });
    this.saldo -= cantidad;
    return this.saldo;
  },
  convertirADolares(melantios) {
    return (melantios * this.config.EXCHANGE_RATE).toFixed(2);
  },
  convertirAMelantios(usd) {
    return Math.floor(usd / this.config.EXCHANGE_RATE);
  },
  puedeCanjear(perfil) {
    // Valida si el usuario tiene 6 meses consecutivos de plan activo
    if (!perfil || !Array.isArray(perfil.suscripciones)) return false;
    const suscripciones = perfil.suscripciones
      .slice()
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    let actual = null;
    let mesesConsecutivos = 0;
    for (let i = 0; i < suscripciones.length; i++) {
      const s = suscripciones[i];
      if (s.activo) {
        if (!actual) {
          actual = { inicio: new Date(s.inicio), fin: new Date(s.fin) };
        } else {
          const diff =
            (new Date(s.inicio) - actual.fin) / (1000 * 60 * 60 * 24);
          if (diff <= 1) {
            actual.fin = new Date(s.fin);
          } else {
            actual = { inicio: new Date(s.inicio), fin: new Date(s.fin) };
          }
        }
        const meses =
          (actual.fin.getFullYear() - actual.inicio.getFullYear()) * 12 +
          (actual.fin.getMonth() - actual.inicio.getMonth());
        mesesConsecutivos = Math.max(mesesConsecutivos, meses);
      }
    }
    return mesesConsecutivos >= this.config.FIDELIDAD_MESES;
  },
  reglas: [
    'Solo puedes canjear Melantios si tienes al menos 6 meses consecutivos de suscripción activa.',
    'Los Melantios pueden cubrir hasta el 25% del valor de un producto.',
    '100 Melantios equivalen a 1 dólar.',
    'Los Melantios pueden expirar si no se usan en 90 días.',
    'Las formas de ganar Melantios pueden cambiar según promociones.',
  ],
};

// UI principal del submódulo
function mostrarPanelMonedaVirtualMelantios(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId) || document.body;
  let perfil = null;
  try {
    perfil = JSON.parse(localStorage.getItem('perfil_usuario'));
  } catch {}
  const saldo = MelantiosCore.saldo;
  const usd = MelantiosCore.convertirADolares(saldo);
  const puedeCanjear = MelantiosCore.puedeCanjear(perfil);
  let html = `<h2>Moneda Virtual Melantios</h2>`;
  html += `<div style='margin-bottom:16px;'>
    <b>Saldo actual:</b> <span style='font-size:1.3em;color:#b45309;'>${saldo}M</span> <span style='color:#555;'>(~$${usd} USD)</span><br>
    <b>Estado de canje:</b> <span style='color:${puedeCanjear ? '#27ae60' : '#b91c1c'};'>${puedeCanjear ? 'Habilitado' : 'No habilitado (requiere 6 meses de suscripción)'}</span>
  </div>`;
  html += `<div style='margin-bottom:18px;'>
    <button id='btn-canjear-melantios' style='padding:10px 24px;background:${puedeCanjear ? '#276749' : '#aaa'};color:#fff;border:none;border-radius:8px;font-size:1em;cursor:${puedeCanjear ? 'pointer' : 'not-allowed'};' ${puedeCanjear ? '' : 'disabled'}>Canjear Melantios</button>
  </div>`;
  html += `<h3>Formas de ganar Melantios</h3><ul>`;
  MelantiosCore.formasDeGanar.forEach((f) => {
    html += `<li>${f}</li>`;
  });
  html += `</ul>`;
  html += `<h3>Reglas y Políticas</h3><ul>`;
  MelantiosCore.reglas.forEach((r) => {
    html += `<li>${r}</li>`;
  });
  html += `</ul>`;
  html += `<h3>Historial de Melantios</h3><ul>`;
  MelantiosCore.historialGanancia
    .slice(-10)
    .reverse()
    .forEach((e) => {
      html += `<li>+${e.cantidad}M — ${e.tipo} <span style='color:#888;font-size:11px;'>${new Date(e.fecha).toLocaleString()}</span></li>`;
    });
  MelantiosCore.historialGasto
    .slice(-10)
    .reverse()
    .forEach((e) => {
      html += `<li>- ${e.cantidad}M — ${e.tipo} <span style='color:#888;font-size:11px;'>${new Date(e.fecha).toLocaleString()}</span></li>`;
    });
  html += `</ul>`;
  cont.innerHTML = html;
  // Lógica del botón de canje
  const btn = document.getElementById('btn-canjear-melantios');
  if (btn) {
    btn.addEventListener('click', () => {
      if (puedeCanjear) {
        alert(
          '¡Canje de Melantios habilitado! Aquí irá la lógica de canje real.'
        );
      } else {
        alert(
          'El botón de canje se activa al cumplir 6 meses consecutivos de suscripción activa.'
        );
      }
    });
  }
}

// Exponer globalmente para el cargador de submódulos y toda la app
window.mostrarPanelMonedaVirtualMelantios = mostrarPanelMonedaVirtualMelantios;
window.MelantiosCore = MelantiosCore;
// Export para import dinámico y compatibilidad con enrutador
export {
  mostrarPanelMonedaVirtualMelantios,
  mostrarPanelMonedaVirtualMelantios as mostrarPanel,
  MelantiosCore,
};
