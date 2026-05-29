// Proyecto Captura de Carbono — MELANTIA
// Panel principal JS para integración web/app
// Muestra información clave, checklist, requisitos y enlaces a documentos

import fuentesBibliograficas from '../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/fuentes_bibliograficas.json';
import plantillaGeojson from '../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/plantilla_geojson_productor.json';
import requisitosBono from '../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/requisitos_bono_carbono.json';
import checklistCarbono from '../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/checklist_carbono_productor.json';
import evidenciaRegenerativa from '../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/evidencia_practica_regenerativa.json';

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Proyecto Captura de Carbono</h2>
    <p>Este módulo permite registrar, validar y consultar información sobre proyectos de captura de carbono y bonos rurales.</p>
    <button id="btn-ver-checklist" class="btn-melantia">Ver Checklist Productor</button>
    <button id="btn-ver-requisitos" class="btn-melantia">Requisitos Bono de Carbono</button>
    <button id="btn-ver-fuentes" class="btn-melantia">Fuentes Bibliográficas</button>
    <button id="btn-ver-evidencia" class="btn-melantia">Evidencia Práctica Regenerativa</button>
    <div id="panel-carbono-info"></div>
    <div style="margin-top:18px;">
      <a href="../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/contrato_cesion_beneficios_carbono.txt" target="_blank">Descargar Contrato Cesión de Beneficios</a>
      <br>
      <a href="../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/cerebro_carbono.md" target="_blank">Ver Cerebro Carbono (Guía Técnica)</a>
      <br>
      <a href="../../knowledge_seeds/06_proyectos/proyecto_captura_carbono/plantilla_geojson_productor.json" target="_blank">Descargar Plantilla GeoJSON Productor</a>
    </div>
  `;
  document.getElementById('btn-ver-checklist').onclick = () => {
    document.getElementById('panel-carbono-info').innerHTML =
      '<h3>Checklist Productor</h3>' +
      '<ul>' +
      checklistCarbono.items.map((i) => `<li>${i}</li>`).join('') +
      '</ul>';
  };
  document.getElementById('btn-ver-requisitos').onclick = () => {
    document.getElementById('panel-carbono-info').innerHTML =
      '<h3>Requisitos Bono de Carbono</h3>' +
      '<ul>' +
      requisitosBono.requisitos.map((r) => `<li>${r}</li>`).join('') +
      '</ul>';
  };
  document.getElementById('btn-ver-fuentes').onclick = () => {
    document.getElementById('panel-carbono-info').innerHTML =
      '<h3>Fuentes Bibliográficas</h3>' +
      '<ul>' +
      fuentesBibliograficas.fuentes.map((f) => `<li>${f}</li>`).join('') +
      '</ul>';
  };
  document.getElementById('btn-ver-evidencia').onclick = () => {
    document.getElementById('panel-carbono-info').innerHTML =
      '<h3>Evidencia Práctica Regenerativa</h3>' +
      '<ul>' +
      evidenciaRegenerativa.evidencias.map((e) => `<li>${e}</li>`).join('') +
      '</ul>';
  };
}
