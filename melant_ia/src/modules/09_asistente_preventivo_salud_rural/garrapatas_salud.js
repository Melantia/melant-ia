// Panel informativo sobre garrapatas y enfermedades transmitidas — MELANTIA

export function mostrarPanelGarrapatas(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Garrapatas y Enfermedades en Humanos</h2>
    <div class="info-block">
      <p>Las garrapatas pueden transmitir enfermedades graves. Es fundamental conocer los síntomas y actuar rápido.</p>
      <button id="btn-ver-enfermedades-garrapatas" class="btn-melantia">Ver enfermedades</button>
      <button id="btn-prevencion-garrapatas" class="btn-melantia">Prevención y extracción</button>
      <div id="panel-detalle-garrapatas"></div>
    </div>
  `;
  document.getElementById('btn-ver-enfermedades-garrapatas').onclick =
    renderEnfermedades;
  document.getElementById('btn-prevencion-garrapatas').onclick =
    renderPrevencion;

  function renderEnfermedades() {
    const panel = document.getElementById('panel-detalle-garrapatas');
    panel.innerHTML = `
      <h3>Enfermedades transmitidas por garrapatas</h3>
      <ul>
        <li><b>Fiebre Maculosa de las Montañas Rocosas:</b> Fiebre alta, dolor de cabeza, erupción, dolor muscular, náuseas. <i>Dermacentor variabilis, D. andersoni, Rhipicephalus sanguineus</i></li>
        <li><b>Enfermedad de Lyme:</b> Mancha roja en diana, fiebre, dolor articular, fatiga. <i>Ixodes scapularis, I. pacificus</i></li>
        <li><b>Anaplasmosis:</b> Fiebre, escalofríos, dolor muscular, náuseas. <i>Ixodes scapularis, I. pacificus</i></li>
        <li><b>Babesiosis:</b> Fiebre, sudoración, fatiga, anemia. <i>Ixodes scapularis</i></li>
        <li><b>Ehrlichiosis:</b> Fiebre, dolor muscular, erupción. <i>Amblyomma americanum, Dermacentor variabilis</i></li>
        <li><b>Tularemia:</b> Fiebre súbita, úlceras, ganglios inflamados. <i>Dermacentor variabilis, Amblyomma americanum</i></li>
      </ul>
    `;
  }

  function renderPrevencion() {
    const panel = document.getElementById('panel-detalle-garrapatas');
    panel.innerHTML = `
      <h3>Prevención y extracción segura</h3>
      <ul>
        <li>Retira la garrapata con pinzas finas, cerca de la piel, tirando hacia arriba.</li>
        <li>No aplastes ni quemes la garrapata mientras esté adherida.</li>
        <li>Lava y desinfecta la zona tras la extracción.</li>
        <li>Guarda la garrapata en un recipiente limpio o bolsa con cierre para mostrarla al médico.</li>
        <li>Toma una foto clara de la garrapata para su identificación.</li>
        <li>Anota la fecha y el lugar de la picadura.</li>
        <li>Usa ropa de manga larga y revisa el cuerpo tras estar al aire libre.</li>
        <li>Utiliza repelente de insectos en piel y ropa.</li>
      </ul>
    `;
  }
}
