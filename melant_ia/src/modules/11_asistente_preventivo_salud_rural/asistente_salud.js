// Módulo Salud
const Salud = {
  init() {
    this.render();
  },
  render() {
    const view = document.getElementById('view-salud');
    if (view) {
      view.innerHTML = `
        <h1 style="font-size:22px;margin-bottom:10px;">Salud Humana</h1>
        <div id="saludContent">
          <!-- Contenido dinámico -->
        </div>
      `;
      this.showTab();
    }
  },
  showTab(tab) {
    const content = document.getElementById('saludContent');
    if (!content) return;
    content.innerHTML = `
      <h2>Salud Humana</h2>
      <ul>
        <li>Información preventiva de enfermedades comunes.</li>
        <li>Detección de síntomas leves y urgencias.</li>
        <li>Recomendación de acudir a un centro médico si es necesario.</li>
        <li><a href="#" onclick="alert('Ejercicios saludables próximamente');return false;">Recomendación de ejercicios</a></li>
      </ul>
    `;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-salud')) Salud.init();
});
