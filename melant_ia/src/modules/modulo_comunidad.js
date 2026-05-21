// módulo de interacción de comunidad MELANTIA
// Integración: ReporteLunes (Frontend, visual y síntesis de voz)

window.ReporteLunes = {
  // ── Estado persistido en localStorage ──
  _CLAVE_SYNC: 'melantia_ultima_sync',
  _CLAVE_SALUD: 'melantia_salud_semana',
  _CLAVE_PREFS: 'melantia_reporte_prefs', // preferencias de formato
  _CLAVE_PERIODICO: 'melantia_periodico', // texto del periódico pendiente
  _watchdog: null,
  _cancelado: false,
  _enCarga: false, // true cuando está enchufado

  // ── Guiones del carrusel (se reemplazan con datos reales al actualizar) ──
  _guiones: {
    Angel: {
      pitch: 1.1,
      rate: 1.0,
      texto: () => {
        const d = window.ReporteLunes._leerDato('angel_novedad');
        return (
          d ||
          'Los precios del mercado se han mantenido estables esta semana. Te recomiendo revisar los precios del cacao y el café antes de negociar.'
        );
      },
    },
    Fabrizzio: {
      pitch: 0.85,
      rate: 0.92,
      texto: () => {
        const d = window.ReporteLunes._leerDato('fabrizzio_novedad');
        return (
          d ||
          'He incorporado nuevas experiencias de productores vecinos en tu manual técnico. Revisa la sección de control de plagas.'
        );
      },
    },
    'Dr. Pablo': {
      pitch: 0.9,
      rate: 0.88,
      texto: () => {
        const d = window.ReporteLunes._leerDato('pablo_novedad');
        return (
          d ||
          'He revisado las normativas vigentes. No hay cambios críticos esta semana, pero te recomiendo verificar el estado de tu registro de productor.'
        );
      },
    },
    Paulette: {
      pitch: 1.15,
      rate: 1.0,
      texto: () => {
        const d = window.ReporteLunes._leerDato('paulette_novedad');
        return (
          d ||
          'Recuerda revisar banderas rojas, mantener el botiquin al dia e hidratarte durante las jornadas de campo. La prevencion oportuna evita emergencias mayores.'
        );
      },
    },
  },

  // ── Punto de entrada: verificar si es lunes y hay sync completada ──
  verificarYSaludar() {
    const hoy = new Date().getDay();
    if (hoy !== 1) return; // Solo lunes

    const ultimaSync = localStorage.getItem(this._CLAVE_SYNC);
    if (!ultimaSync) return; // Nunca se sincronizó

    // Evitar mostrar el reporte más de una vez por día
    const claveHoy = `melantia_reporte_${new Date().toLocaleDateString('es-EC')}`;
    if (localStorage.getItem(claveHoy)) return;
    localStorage.setItem(claveHoy, '1');

    // ── Modo Estación de Carga ──
    if (!('getBattery' in navigator)) {
      this._lanzarReporte();
      return;
    }
    navigator.getBattery().then((bat) => {
      if (bat.charging) {
        this._enCarga = true;
        this._lanzarReporte();
      } else {
        this._mostrarAvisoCargador();
        const vigilante = () => {
          if (bat.charging && new Date().getDay() === 1) {
            bat.removeEventListener('chargingchange', vigilante);
            this._enCarga = true;
            this._lanzarReporte();
          }
        };
        bat.addEventListener('chargingchange', vigilante);
      }
    });
  },

  _mostrarAvisoCargador() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="border-top-color:#facc15">
        <p class="novedad-n1">🔌 Reporte de novedades listo</p>
        <p class="novedad-n2">
          Conecta el cargador para escuchar el resumen de novedades de la semana.
          Mi equipo tiene muchas cosas que contarte.
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.mostrarPeriodico()">📰 Ver como periódico</button>
          <button onclick="ReporteLunes.cerrar()">Más tarde</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    console.log('[REPORTE] Lunes sin cargador — aviso silencioso mostrado.');
  },

  _lanzarReporte() {
    ui_melantia.pensar();
    setTimeout(() => {
      ui_melantia.listo();
      this._mostrarPreguntaApertura();
    }, 1500);
  },

  _mostrarPreguntaApertura() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const prefs = this._leerPrefs();
    const veces = prefs.vecesPostpuesto || 0;

    const sugerirTexto = veces >= 3;
    const mensajeExtra = sugerirTexto
      ? '<p class="novedad-n3" style="color:#facc15">He notado que prefieres leer las novedades. ¿Te dejo el periódico de esta semana?</p>'
      : '<p class="novedad-n3">¿Tienes un par de minutos para escucharlo ahora?</p>';

    const botonPrincipal = sugerirTexto
      ? `<button onclick="ReporteLunes.mostrarPeriodico()">📰 Sí, dame el periódico</button>`
      : `<button onclick="ReporteLunes.ejecutarSecuencia()">✅ ¡Claro, cuéntame!</button>`;

    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">🌿 Hola. He preparado el resumen de novedades.</p>
        <p class="novedad-n2">
          Detecto que estamos conectados a la energía. Es el momento perfecto:
          mientras recupero fuerzas, te daré el resumen de lo que el equipo
          aprendió este fin de semana en el pueblo.
        </p>
        ${mensajeExtra}
        <div class="novedad-acciones">
          ${botonPrincipal}
          <button onclick="ReporteLunes.mostrarPeriodico()">📰 Leer</button>
          <button onclick="ReporteLunes._posponer()">⏳ Más tarde</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    _voz(
      sugerirTexto
        ? 'He notado que prefieres leer las novedades. Te dejo el periódico de la semana.'
        : 'Hola. He preparado el resumen de novedades con el equipo. ¿Tienes un par de minutos para escucharlo ahora?'
    );
  },

  _posponer() {
    const prefs = this._leerPrefs();
    prefs.vecesPostpuesto = (prefs.vecesPostpuesto || 0) + 1;
    prefs.ultimoPostpuesto = new Date().toLocaleDateString('es-EC');
    localStorage.setItem(this._CLAVE_PREFS, JSON.stringify(prefs));
    this.cerrar();
    _voz('Entendido. Estaré lista cuando tengas tiempo.');
    const btn = document.getElementById('btn-reporte-pendiente');
    if (btn) btn.style.display = 'block';
    console.log(
      '[REPORTE] Pospuesto por el usuario. Veces:',
      prefs.vecesPostpuesto
    );
  },

  mostrarPeriodico() {
    this.cerrar();
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const lineas = Object.entries(this._guiones)
      .map(([nombre, cfg]) => {
        let t = 'Sin novedades esta semana.';
        try {
          t = cfg.texto();
        } catch {}
        return `<p><strong>${nombre}:</strong> ${t}</p>`;
      })
      .join('');

    const salud = this._leerSalud();
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="max-height:70vh;overflow-y:auto">
        <p class="novedad-n1">📰 Periódico Semanal — MELANTIA</p>
        <p style="font-size:0.75em;color:#aaa;margin-bottom:8px">
          ${new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <hr style="border-color:#333;margin:8px 0">
        ${lineas}
        <hr style="border-color:#333;margin:8px 0">
        <p style="font-size:0.75em;color:#777">
          📦 ${salud.actualizados || 0} archivos actualizados | 🕒 ${salud.fecha || 'N/D'}
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.cerrar()">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    localStorage.setItem(
      this._CLAVE_PERIODICO,
      panel.querySelector('.novedad-card').innerHTML
    );
    console.log('[REPORTE] Periódico de texto generado y guardado.');
  },

  _leerPrefs() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_PREFS) || '{}');
    } catch {
      return {};
    }
  },

  ejecutarSecuencia() {
    this.cerrar();
    this._cancelado = false;

    this._watchdog = setTimeout(() => {
      if (!this._cancelado) this.forzarCierre();
    }, 15000);

    ui_melantia.pensar();
    const turnos = Object.entries(this._guiones);
    this._ejecutarTurno(turnos, 0);
  },

  _ejecutarTurno(turnos, idx) {
    if (this._cancelado) return;
    if (idx >= turnos.length) {
      clearTimeout(this._watchdog);
      this._watchdog = null;
      ui_melantia.listo();
      this._mostrarEstadoSalud();
      return;
    }

    const [nombre, cfg] = turnos[idx];

    if (typeof StaffController !== 'undefined') {
      StaffController._aplicarColor(nombre);
    }

    const timeoutModulo = setTimeout(() => {
      console.warn(`[REPORTE] ${nombre} tardó más de 3 s — saltando.`);
      speechSynthesis.cancel();
      this._ejecutarTurno(turnos, idx + 1);
    }, 3000);

    let texto;
    try {
      texto = cfg.texto();
      if (typeof texto !== 'string' || texto.trim().length < 5)
        throw new Error('Texto inválido');
    } catch (e) {
      console.warn(`[REPORTE] Error de integridad en ${nombre}:`, e.message);
      clearTimeout(timeoutModulo);
      this._ejecutarTurno(turnos, idx + 1);
      return;
    }

    const guion = `${nombre} dice: ${texto}`;
    const utt = new SpeechSynthesisUtterance(guion);
    utt.lang = 'es-EC';
    utt.pitch = cfg.pitch;
    utt.rate = cfg.rate;

    utt.onend = () => {
      clearTimeout(timeoutModulo);
      const pausaTermica = this._enCarga ? 8000 : 600;
      setTimeout(() => this._ejecutarTurno(turnos, idx + 1), pausaTermica);
    };
    utt.onerror = () => {
      clearTimeout(timeoutModulo);
      this._ejecutarTurno(turnos, idx + 1);
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
    this._mostrarFichaExperto(nombre, texto);
  },

  _mostrarFichaExperto(nombre, texto) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="${nombre}">
        <p class="novedad-n1">🎙️ ${nombre}</p>
        <p class="novedad-n2">${texto}</p>
        <p style="font-size:0.75em;color:#aaa;margin-top:8px">
          Reporte del equipo MELANTIA — ${new Date().toLocaleDateString('es-EC')}
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.forzarCierre()">Saltar resumen</button>
        </div>
      </div>`;
    panel.style.display = 'block';
  },

  _mostrarEstadoSalud() {
    const salud = this._leerSalud();
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const iconoBat =
      salud.bateria >= 80 ? '🟢' : salud.bateria >= 50 ? '🟡' : '🔴';
    const iconoErr = salud.errores === 0 ? '✅' : '⚠️';

    panel.innerHTML = `
      <div class="novedad-card salud-app" data-experto="Melantia">
        <p class="novedad-n1">🌿 Estado de Salud de MELANTIA</p>
        <p class="novedad-n2">
          ${iconoBat} Batería al momento de sincronizar: <strong>${salud.bateria}%</strong><br>
          ${iconoErr} Errores durante la semana: <strong>${salud.errores}</strong><br>
          📦 Archivos actualizados: <strong>${salud.actualizados}</strong><br>
          🕒 Última sincronización: <strong>${salud.fecha}</strong>
        </p>
        <p class="novedad-n3">Todo está en orden. ¡Tu finca tiene un asistente saludable!</p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.cerrar()">¡Excelente! Ir a módulos</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    if (typeof StaffController !== 'undefined') {
      StaffController._aplicarColor('Melantia');
    }
    _voz(
      `Todo está en orden. Batería al ${salud.bateria} por ciento, ${salud.errores} errores durante la semana. Actualizamos ${salud.actualizados} archivos. ¡Tu finca tiene un asistente saludable!`
    );
    setTimeout(() => this._limpiarDatosReporte(), 5000);
  },

  forzarCierre() {
    this._cancelado = true;
    if (this._watchdog) {
      clearTimeout(this._watchdog);
      this._watchdog = null;
    }
    speechSynthesis.cancel();
    ui_melantia.listo();
    _voz('He terminado de procesar lo más importante por ahora. ¡A trabajar!');
    this.cerrar();
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) panel.style.display = 'none';
  },

  guardarSalud(actualizados, errores, bateria) {
    const salud = {
      actualizados,
      errores,
      bateria: Math.round(bateria),
      fecha: new Date().toLocaleString('es-EC'),
    };
    localStorage.setItem(this._CLAVE_SALUD, JSON.stringify(salud));
    localStorage.setItem(this._CLAVE_SYNC, new Date().toISOString());
  },

  _leerSalud() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_SALUD) || '{}');
    } catch {
      return {};
    }
  },

  _leerDato(clave) {
    return localStorage.getItem(`melantia_reporte_dato_${clave}`) || null;
  },

  guardarDato(clave, valor) {
    if (typeof valor !== 'string' || valor.length > 300) return;
    localStorage.setItem(`melantia_reporte_dato_${clave}`, valor);
  },

  _limpiarDatosReporte() {
    const claves = [
      'angel_novedad',
      'fabrizzio_novedad',
      'pablo_novedad',
      'paulette_novedad',
    ];
    claves.forEach((c) =>
      localStorage.removeItem(`melantia_reporte_dato_${c}`)
    );
    console.log('[REPORTE] Datos del reporte anterior liberados de memoria.');
  },
};
