// Módulo Salud Veterinaria
const Salud = {
  init() {
    this.render();
  },
  render() {
    const view = document.getElementById('view-salud');
    if (view) {
      view.innerHTML = `
        <h1 style="font-size:22px;margin-bottom:10px;">Salud Veterinaria</h1>
        <div id="saludContent">
          <!-- Contenido dinámico -->
        </div>
      `;
      this.showTab();
    }
  },
  showTab() {
    const content = document.getElementById('saludContent');
    if (!content) return;
    content.innerHTML = `
      <h2>Salud Veterinaria</h2>
      <ul>
        <li>Información preventiva para animales de granja y compañía.</li>
        <li>Guía para tareas sencillas de cuidado animal.</li>
        <li>Para casos complejos, se recomienda acudir a un veterinario especializado.</li>
      </ul>
    `;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-salud')) Salud.init();
});
