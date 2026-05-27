// Módulo: Proyectos
// Funciones y lógica de proyectos, saberes ancestrales, tesoro de abuelos, herbario

import { renderizarMemoriaViva } from './proyectos_memoria_viva.js';

window.MelantiaProyectos = {
  mostrarTesoroAbuelos(contenedorId = 'app-menu') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `
      <h2>El Tesoro de los Abuelos</h2>
      <div class="tarjetas-grid" id="memoria-herbario"></div>
    `;
    renderizarMemoriaViva('memoria-herbario');
  },
  mostrarMenuProyectos(contenedorId = 'app-menu') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `
      <h2 style="color:#276749;text-align:center;margin-bottom:24px;">🌱 Proyectos MELANTIA</h2>
      <div class="tarjetas-grid" style="margin-bottom:18px;">
        <div class="card card-sostenible" style="min-width:260px;max-width:340px;cursor:pointer;" onclick="MelantiaProyectos.mostrarProyectoCarbono()">
          <div style="font-size:2.2em;">🌳</div>
          <h3 class="titulo-proyecto" style="margin-bottom:6px;">Captura de Carbono</h3>
          <p style="margin:0 0 8px 0;">Registra prácticas regenerativas, checklist profesional y genera tu contrato digital para acceder a beneficios ambientales y económicos.</p>
          <span class="badge-carbono">Verificado ISO/Verra</span>
        </div>
        <div class="card card-sostenible" style="min-width:260px;max-width:340px;cursor:pointer;" onclick="MelantiaProyectos.mostrarTesoroAbuelos()">
          <div style="font-size:2.2em;">🧓</div>
          <h3 class="titulo-proyecto" style="margin-bottom:6px;">El Tesoro de los Abuelos</h3>
          <p style="margin:0 0 8px 0;">Historias, saberes y relatos ancestrales de la comunidad. Preserva la memoria viva y comparte el legado cultural.</p>
          <span class="badge-carbono" style="background:#a0aec0;color:#fff;">Memoria Viva</span>
        </div>
      </div>
      <div id="proyectos-submodulo"></div>
    `;
  },
  async mostrarProyectoCarbono(contenedorId = 'app-menu') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `<h2 class="titulo-proyecto">Proyecto Captura de Carbono</h2>
      <div id="carbono-bienvenida" class="card-sostenible"></div>
      <div id="carbono-checklist" class="card-sostenible"></div>
      <div id="carbono-evidencia" class="card-sostenible"></div>
      <div id="carbono-contrato" class="card-sostenible"></div>
      <div id="carbono-fuentes" class="card-sostenible"></div>
    `;
    // Bienvenida y reglas
    document.getElementById('carbono-bienvenida').innerHTML = `
      <b>Bienvenida al Proyecto de Captura de Carbono MELANTIA</b><br>
      <span>¡Comienza tu registro y accede a los beneficios de la agricultura regenerativa y la reforestación!</span>
      <ul style="margin-top:8px;">
        <li>Implementa prácticas regenerativas y registra evidencia.</li>
        <li>Genera tu contrato digital y checklist profesional.</li>
        <li>Consulta fuentes técnicas y requisitos internacionales.</li>
      </ul>
      <div style="margin-top:8px;font-size:0.95em;opacity:0.8;">
        <b>Variables clave:</b> cobertura_suelo_pct, biomasa_residual, uso_fertilizante_sintetico, manejo_pasturas, uso_bioinsumos, rastrojo_kg_ha, labranza_si_no, cultivos_cobertura_si_no
      </div>
    `;
    // Checklist
    try {
      const resp = await fetch(
        'knowledge_seeds/06_proyectos/proyecto_captura_carbono/checklist_carbono_productor.json'
      );
      const checklist = await resp.json();
      let html = `<b>Checklist profesional del productor</b><ul>`;
      (checklist.estructura_expediente || []).forEach((bloque) => {
        html += `<li><b>${bloque.bloque}:</b><ul>`;
        bloque.campos.forEach((campo) => {
          html += `<li>${campo.replace(/_/g, ' ')}</li>`;
        });
        html += `</ul></li>`;
      });
      html += `</ul><div style='font-size:0.9em;opacity:0.7;'>Modo offline: ${checklist.modo_offline}</div>`;
      document.getElementById('carbono-checklist').innerHTML = html;
    } catch {}
    // Evidencia práctica regenerativa
    try {
      const resp = await fetch(
        'knowledge_seeds/06_proyectos/proyecto_captura_carbono/evidencia_practica_regenerativa.json'
      );
      const evidencia = await resp.json();
      let html = `<b>Evidencia de prácticas regenerativas</b><ul>`;
      (evidencia.practicas || []).forEach((practica) => {
        html += `<li><b>${practica.nombre}:</b> ${practica.estrella_dorada ? '⭐' : ''}<ul>`;
        (practica.evidencias || []).forEach((ev) => {
          html += `<li>${ev.descripcion} (${ev.foto ? '📷' : ''}) ${ev.validada ? '✔️' : ''}</li>`;
        });
        html += `</ul></li>`;
      });
      html += `</ul>`;
      document.getElementById('carbono-evidencia').innerHTML = html;
    } catch {}
    // Contrato de cesión de beneficios
    try {
      const resp = await fetch(
        'knowledge_seeds/06_proyectos/proyecto_captura_carbono/contrato_cesion_beneficios_carbono.txt'
      );
      const contrato = await resp.text();
      document.getElementById('carbono-contrato').innerHTML =
        `<b>Contrato de Cesión de Beneficios de Carbono</b><pre style='white-space:pre-wrap;background:#f0fff4;border-radius:8px;padding:8px;'>${contrato}</pre>`;
    } catch {}
    // Fuentes y normativas
    try {
      const resp = await fetch(
        'knowledge_seeds/06_proyectos/proyecto_captura_carbono/fuentes_bibliograficas.json'
      );
      const fuentes = await resp.json();
      let html = `<b>Fuentes técnicas y normativas</b><ul>`;
      (fuentes.enlaces || []).forEach((f) => {
        html += `<li><a href='${f.url}' target='_blank'>${f.titulo}</a></li>`;
      });
      html += `</ul>`;
      document.getElementById('carbono-fuentes').innerHTML = html;
    } catch {}
  },
};
