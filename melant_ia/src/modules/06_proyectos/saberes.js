// Módulo Saberes y Folklore
const SaberesFolklore = {
  historias: [],
  escuchadas: [],
  historiaActual: null,
  vecesEscuchada: 0,
  maxVeces: 2,
  async init() {
    this.cargarHistorias();
    this.seleccionarHistoriaDiaria();
    this.render();
    this.notificarHistoria();
  },
  cargarHistorias() {
    // Aquí se cargarían desde un JSON o base de datos local
    this.historias = [
      { id: 1, titulo: "La leyenda del Cuy", region: "Sierra", audio: "audios/cuy.mp3", duracion: 180 },
      { id: 2, titulo: "El duende de la selva", region: "Oriente", audio: "audios/duende.mp3", duracion: 240 },
      { id: 3, titulo: "La Tunda", region: "Costa", audio: "audios/tunda.mp3", duracion: 300 }
      // ...más historias
    ];
    // Cargar desde los JSON existentes
    let historias = [];
    const escuchadas = localStorage.getItem('saberes_escuchadas');
    if (escuchadas) this.escuchadas = JSON.parse(escuchadas);
  },
  seleccionarHistoriaDiaria() {
    // Selección diaria aleatoria, una por día
    const hoy = new Date().toISOString().slice(0, 10);
    const historiaGuardada = localStorage.getItem('saberes_historia_' + hoy);
    if (historiaGuardada) {
      this.historiaActual = JSON.parse(historiaGuardada);
    } else {
      // Filtrar historias no escuchadas
      const disponibles = this.historias.filter(h => !this.escuchadas.includes(h.id));
      let seleccionada;
      if (disponibles.length === 0) {
        // Reset si ya escuchó todas
        this.escuchadas = [];
        localStorage.removeItem('saberes_escuchadas');
        seleccionada = this.historias[Math.floor(Math.random() * this.historias.length)];
      } else {
        seleccionada = disponibles[Math.floor(Math.random() * disponibles.length)];
      }
      this.historiaActual = seleccionada;
      localStorage.setItem('saberes_historia_' + hoy, JSON.stringify(seleccionada));
    }
    this.vecesEscuchada = 0;
  },

  notificarHistoria() {
    if (!this.historiaActual) return;
    // Mostrar notificación visual
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Nueva historia disponible', {
        body: `Hoy puedes escuchar o leer: "${this.historiaActual.titulo}"`,
        icon: '/assets/logo_melant_ia.png'
      });
    } else if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Nueva historia disponible', {
            body: `Hoy puedes escuchar o leer: "${this.historiaActual.titulo}"`,
            icon: '/assets/logo_melant_ia.png'
          });
        }
      });
    } else {
      // Fallback: mensaje en la app
      setTimeout(() => {
        if (document.getElementById('saberesMsg')) {
          document.getElementById('saberesMsg').innerHTML = `<b>¡Nueva historia disponible hoy!</b> <br> "${this.historiaActual.titulo}"`;
        }
      }, 1000);
    }
  },
  render() {
    const view = document.getElementById('view-saberes');
    if (!view) return;
    if (!this.historiaActual) {
      view.innerHTML = `<div class='empty-state'><i class='fa-solid fa-book'></i><p>No hay historias disponibles hoy.</p></div>`;
      return;
    }
    view.innerHTML = `
      <h1 style="font-size:22px;margin-bottom:10px;">Proyecto Saberes y Folklore</h1>
      <p style="color:var(--fg-muted);font-size:14px;margin-bottom:18px;">Promoviendo la cultura ecuatoriana. 1 historia diaria, máximo 5 minutos.</p>
      <div class="card">
        <h3>${this.historiaActual.titulo} <span style='font-size:13px;color:var(--accent);'>(${this.historiaActual.region})</span></h3>
        <div style="margin:10px 0;font-size:14px;">${this.historiaActual.descripcion}</div>
        ${this.historiaActual.audio ? `<audio id="audioSaberes" controls preload="auto" style="width:100%;margin:12px 0;"><source src="${this.historiaActual.audio}" type="audio/mpeg">Tu navegador no soporta audio.</audio>` : ''}
        <div style="margin:10px 0;font-size:13px;">${this.historiaActual.duracion ? `Duración: ${Math.round(this.historiaActual.duracion/60)} min` : ''}</div>
        <button class="btn btn-primary" onclick="SaberesFolklore.marcarEscuchada()" id="btnEscucharSaberes">Marcar como escuchada</button>
        <button class="btn btn-ghost" onclick="SaberesFolklore.enviarOficina()">Pedir cuento por QR</button>
      </div>
      <div id="saberesMsg" style="margin-top:10px;font-size:13px;color:var(--fg-muted);"></div>
    `;
    this.configurarAudio();
  },
  configurarAudio() {
    const audio = document.getElementById('audioSaberes');
    if (!audio) return;
    audio.currentTime = 0;
    audio.onplay = () => {
      if (this.vecesEscuchada >= this.maxVeces) {
        audio.pause();
        document.getElementById('saberesMsg').textContent = 'Ya escuchaste el cuento el máximo de veces hoy.';
      }
    };
    audio.onended = () => {
      this.vecesEscuchada++;
      if (this.vecesEscuchada >= this.maxVeces) {
        document.getElementById('saberesMsg').textContent = 'Ya escuchaste el cuento el máximo de veces hoy.';
        document.getElementById('btnEscucharSaberes').disabled = true;
      }
    };
  },
  marcarEscuchada() {
    if (!this.historiaActual) return;
    if (!this.escuchadas.includes(this.historiaActual.id)) {
      this.escuchadas.push(this.historiaActual.id);
      localStorage.setItem('saberes_escuchadas', JSON.stringify(this.escuchadas));
    }
    this.historiaActual = null;
    this.render();
  },
  enviarOficina() {
    // Simulación: mostrar QR para descarga
    document.getElementById('saberesMsg').innerHTML = '<b>QR generado:</b> <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://melant-ia.com/descarga/'+this.historiaActual.id+'" alt="QR descarga" style="margin-top:8px;">';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-saberes')) SaberesFolklore.init();
});
