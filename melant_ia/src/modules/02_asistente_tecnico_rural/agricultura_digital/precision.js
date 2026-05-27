document.addEventListener('DOMContentLoaded', () => {
// precision.js — Módulo de Agricultura de Precisión MELANT IA
// Muestra cursos, integra lógica de diagnóstico y sincronización para el Asistente Técnico Rural

const Precision = {
  cursos: [],
  diagnosticoRules: [],
  syncSettings: null,

  // --- SYNC Y DIAGNÓSTICO ---
  async cargarSyncSettings() {
    try {
      const res = await fetch('SyncPolicy.json');
      const data = await res.json();
      this.syncSettings = data.sync_settings;
      localStorage.setItem('SyncPolicy.json', JSON.stringify(data));
    } catch (e) {
      // Si falla, usa local
      const local = localStorage.getItem('SyncPolicy.json');
      if (local) this.syncSettings = JSON.parse(local).sync_settings;
    }
  },

  async cargarDiagnosticoRules() {
    try {
      const res = await fetch('FuzzyRules.json');
      const data = await res.json();
      this.diagnosticoRules = data.diagnostico_rules;
      localStorage.setItem('FuzzyRules.json', JSON.stringify(data));
    } catch (e) {
      // Si falla, usa local
      const local = localStorage.getItem('FuzzyRules.json');
      if (local) this.diagnosticoRules = JSON.parse(local).diagnostico_rules;
    }
  },

  isFastEnough() {
    if (!this.syncSettings || !navigator.connection) return false;
    const minQ = this.syncSettings.min_network_quality;
    const conn = navigator.connection;
    if (minQ.block_on_edge_2g && /2g|slow-2g|edge/.test(conn.effectiveType)) return false;
    if (conn.downlink < minQ.download_mbps) return false;
    if (conn.type === 'cellular' && !minQ.preferred_network.some(n => conn.effectiveType.includes(n.toLowerCase()))) return false;
    return true;
  },

  async sincronizar() {
    await this.cargarSyncSettings();
    if (this.isFastEnough()) {
      await this.cargarDiagnosticoRules();
      // Aquí puedes agregar más descargas (ej. NDVI, alertas)
      this.showToast('Sincronización completa con éxito.');
    } else {
      this.showToast('Cobertura baja. Trabajando con datos locales.');
    }
  },

  diagnosticoFuzzy(input, cultivo, zona) {
    const rules = this.diagnosticoRules || [];
    return rules.find(r =>
      r.cultivo === cultivo &&
      r.zona === zona &&
      Object.entries(r.condiciones).every(([k, v]) => input[k] === v)
    );
  },

  // --- CURSOS ---
  async cargarCursos() {
    try {
      const res = await fetch('cursos_agricultura_precision.json');
      this.cursos = await res.json();
    } catch (e) {
      this.cursos = [];
      console.warn('No se pudieron cargar los cursos de Agricultura de Precisión:', e);
    }
  },

  mostrarCursos(containerId = 'precisionCursos') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    if (!this.cursos.length) {
      cont.innerHTML = '<div class="empty-state">No hay cursos disponibles.</div>';
      return;
    }
    let html = '<h2>Cursos Especializados en Agricultura de Precisión</h2>';
    this.cursos.forEach((curso, idx) => {
      html += `<div class="card" style="margin-bottom:18px;">
        <h3>${curso.titulo}</h3>
        <p>${curso.descripcion}</p>
        <button class="btn btn-primary btn-sm" onclick="Precision.tomarCurso(${idx})">Tomar curso</button>
      </div>`;
    });
    cont.innerHTML = html;
  },

  tomarCurso(idx) {
    const curso = this.cursos[idx];
    const cont = document.getElementById('precisionCursos');
    if (!curso || !cont) return;
    let html = `<h2>${curso.titulo}</h2><p>${curso.descripcion}</p>`;
    html += '<h3>Módulos</h3><ul>';
    if (curso.modulos) {
      curso.modulos.forEach(m => {
        html += `<li><b>${m.titulo}</b>: ${m.descripcion}</li>`;
      });
    }
    html += '</ul>';
    if (curso.ejercicios) {
      html += '<h3>Ejercicios de Autoevaluación</h3><ul>';
      curso.ejercicios.forEach(ej => {
        html += `<li>${ej}</li>`;
      });
      html += '</ul>';
    }
    html += `<button class="btn btn-green btn-sm" onclick="Precision.descargarCertificado('${curso.titulo}')">Descargar certificado</button> `;
    html += `<button class="btn btn-ghost btn-sm" onclick="Precision.mostrarCursos()">Volver a cursos</button>`;
    cont.innerHTML = html;
  },

  descargarCertificado(nombreCurso) {
    // Simulación de certificado descargable
    const contenido = `Certificado de Finalización\n\nSe otorga a: [Nombre del Usuario]\nPor completar el curso: ${nombreCurso}\n\nEscuela de Agricultura Regenerativa MELANT IA`;
    const blob = new Blob([contenido], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado_${nombreCurso.replace(/\s+/g,'_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  showToast(msg) {
    // Busca o crea el contenedor de notificaciones
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      document.body.appendChild(box);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
  },

  async init() {
    await this.cargarCursos();
    await this.sincronizar();
    this.mostrarCursos();
  }
};

// Permitir carga dinámica como submódulo
export { Precision };

document.addEventListener('DOMContentLoaded', () => {
  const view = document.getElementById('view-precision');
  if (view) {
    let cont = document.getElementById('precisionCursos');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'precisionCursos';
      view.appendChild(cont);
    }
    Precision.init();
  }
});
