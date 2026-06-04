// asistente_tecnico_veterinario.js
// Adaptador real al flujo veterinario (fichas, evidencia, salud y sincronizacion).

async function asegurarDependenciasVeterinaria() {
  await import('./asistente_tecnico_veterinario/gestor_evidencia_fotos.js');
  const salud =
    await import('./asistente_tecnico_veterinario/salud_veterinaria.js');
  return salud?.Salud || null;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:940px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:14px;">
      <h2 style="margin:0;color:#276749;">Asistente Tecnico Veterinario</h2>
      <p style="margin:0;color:#445;">Flujo real conectado: ficha ligera del animal, captura de evidencia y control sanitario.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:end;">
        <label>ID Animal<input id="vet-id" type="text" value="BOV-001" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Especie
          <select id="vet-especie" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;">
            <option value="bovino">Bovino</option>
            <option value="porcino">Porcino</option>
            <option value="avicola">Avicola</option>
            <option value="equino">Equino</option>
          </select>
        </label>
        <label>Peso (kg)<input id="vet-peso" type="number" min="0" value="320" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Lote<input id="vet-lote" type="text" value="Lote-1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
        <label>Fecha<input id="vet-fecha" type="date" value="${hoyISO()}" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" /></label>
      </section>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="vet-guardar-ficha" style="padding:10px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Guardar ficha ligera</button>
        <button id="vet-capturar" style="padding:10px 14px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Capturar evidencia</button>
        <button id="vet-tablero" style="padding:10px 14px;border:none;border-radius:8px;background:#14532d;color:#fff;cursor:pointer;">Consultar tablero</button>
      </div>

      <div id="vet-resultado" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;min-height:58px;">Listo para registrar actividad veterinaria.</div>

      <section style="display:grid;gap:8px;border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;">
        <h3 style="margin:0;color:#1f2937;">Resumen de Salud Veterinaria</h3>
        <div id="view-salud" style="color:#334;"></div>
      </section>

      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  const Salud = await asegurarDependenciasVeterinaria();
  if (Salud && typeof Salud.init === 'function') {
    Salud.init();
  }

  const out = document.getElementById('vet-resultado');
  const setOut = (msg) => {
    if (out) out.textContent = msg;
  };
  const leerDatos = () => ({
    id: (document.getElementById('vet-id')?.value || '').trim(),
    especie: (document.getElementById('vet-especie')?.value || 'bovino').trim(),
    peso: Number(document.getElementById('vet-peso')?.value || 0),
    id_lote: (document.getElementById('vet-lote')?.value || '').trim(),
    fecha: document.getElementById('vet-fecha')?.value || hoyISO(),
    observaciones: 'Registro generado desde flujo veterinario MELANTIA',
  });

  document
    .getElementById('vet-guardar-ficha')
    ?.addEventListener('click', async () => {
      const datos = leerDatos();
      if (!datos.id || !datos.especie) {
        setOut('Debes ingresar ID animal y especie.');
        return;
      }
      if (typeof window.guardarFichaLigeraMelantia !== 'function') {
        setOut('No se pudo cargar el gestor veterinario.');
        return;
      }
      try {
        const res = await window.guardarFichaLigeraMelantia(datos);
        const ugm = Number(res?.inventarioUGM?.ugm_total || 0).toFixed(2);
        setOut(`Ficha guardada para ${datos.id}. UGM total estimada: ${ugm}.`);
      } catch (err) {
        setOut(`Error guardando ficha: ${err?.message || err}`);
      }
    });

  document
    .getElementById('vet-capturar')
    ?.addEventListener('click', async () => {
      const datos = leerDatos();
      if (typeof window.capturarEvidenciaIA !== 'function') {
        setOut('No se pudo cargar la captura de evidencia.');
        return;
      }
      try {
        setOut('Abriendo camara o selector de archivo para evidencia...');
        await window.capturarEvidenciaIA(
          datos.id,
          'crecimiento',
          datos.peso,
          datos.id_lote || null
        );
        setOut(`Evidencia capturada para ${datos.id}.`);
      } catch (err) {
        setOut(`No fue posible capturar evidencia: ${err?.message || err}`);
      }
    });

  document
    .getElementById('vet-tablero')
    ?.addEventListener('click', async () => {
      if (typeof window.obtenerTableroGranjasMelantia !== 'function') {
        setOut('No se pudo cargar el tablero de granjas.');
        return;
      }
      try {
        const tablero = await window.obtenerTableroGranjasMelantia();
        const resumen = Array.isArray(tablero)
          ? `Registros: ${tablero.length}`
          : 'Tablero consultado correctamente.';
        setOut(resumen);
      } catch (err) {
        setOut(`Error consultando tablero: ${err?.message || err}`);
      }
    });
}

export default { mostrarPanel };
