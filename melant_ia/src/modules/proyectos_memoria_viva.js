export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;text-align:center;margin-bottom:24px;'>Memoria Viva y Herbario</h2>
      <div id="memoria-herbario"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  renderizarMemoriaViva('memoria-herbario');
}

// proyectos_memoria_viva.js
// Renderiza tarjetas de "Memoria Viva" y "Herbario" desde JSON

export async function renderizarMemoriaViva(
  contenedorId = 'memoria-herbario',
  jsonUrl = 'knowledge_seeds/06_proyectos/el_tesoro_abuelos/memoria_viva.json'
) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = '<div style="color:#A4FF00">Cargando...</div>';
  try {
    const resp = await fetch(jsonUrl);
    const datos = await resp.json();
    cont.innerHTML = '';
    (datos.memoria_viva || []).forEach((item) => {
      cont.innerHTML += `
        <div class="card">
          ${item.imagen ? `<img src="${item.imagen}" alt="${item.titulo}" style="width:100%;border-radius:10px;">` : ''}
          <h3>${item.titulo || item.nombre || 'Sin título'}</h3>
          <p><strong>Autor:</strong> ${item.autor || 'Anónimo'}</p>
          <p>${item.descripcion || ''}</p>
          ${item.relato ? `<p><em>"${item.relato}"</em></p>` : ''}
          ${item.audio ? `<button onclick="new Audio('${item.audio}').play()">Escuchar relato</button>` : ''}
        </div>
      `;
    });
  } catch (e) {
    cont.innerHTML =
      '<div style="color:red">No se pudo cargar la memoria viva.</div>';
  }
}

export async function renderizarHerbario(
  contenedorId = 'memoria-herbario',
  jsonUrl = 'knowledge_seeds/06_proyectos/herbario_cultural.json'
) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = '<div style="color:#A4FF00">Cargando...</div>';
  try {
    const resp = await fetch(jsonUrl);
    const datos = await resp.json();
    cont.innerHTML = '';
    (datos.herbario_cultural || []).forEach((planta) => {
      cont.innerHTML += `
        <div class="card">
          ${planta.imagen ? `<img src="${planta.imagen}" alt="${planta.nombre_local}" style="width:100%;border-radius:10px;">` : ''}
          <h3>${planta.nombre_local || 'Sin nombre'}</h3>
          <p><strong>Uso:</strong> ${planta.usos_medicinales || ''}</p>
          ${planta.relato ? `<p><em>"${planta.relato}"</em></p>` : ''}
        </div>
      `;
    });
  } catch (e) {
    cont.innerHTML =
      '<div style="color:red">No se pudo cargar el herbario.</div>';
  }
}

// Ejemplo de uso en tu HTML:
// <div class="tarjetas-grid" id="memoria-herbario"></div>
// import { renderizarMemoriaViva, renderizarHerbario } from './modules/proyectos_memoria_viva.js';
// renderizarMemoriaViva(); // o renderizarHerbario();
