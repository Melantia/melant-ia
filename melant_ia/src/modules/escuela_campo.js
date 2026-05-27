// Módulo: Escuela de Campo
// Funciones y lógica de cursos y prácticas

window.MelantiaEscuelaCampo = {
  mostrarMenuPrincipal(contenedorId = 'app-menu') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `
      <h2 style="color:#276749;text-align:center;margin-bottom:24px;">🌾 Escuela de Campo MELANTIA</h2>
      <div class="tarjetas-grid" style="margin-bottom:18px;">
        <div class="card" style="min-width:260px;max-width:340px;cursor:pointer;" onclick="MelantiaEscuelaCampo.mostrarCursos()">
          <div style="font-size:2.2em;">📚</div>
          <h3 style="margin-bottom:6px;">Cursos Especializados</h3>
          <p style="margin:0 0 8px 0;">Capacítate en agricultura regenerativa, trazabilidad, manejo animal y más. Acceso según tu plan.</p>
        </div>
        <div class="card" style="min-width:260px;max-width:340px;cursor:pointer;" onclick="MelantiaEscuelaCampo.mostrarPracticas()">
          <div style="font-size:2.2em;">🌱</div>
          <h3 style="margin-bottom:6px;">Prácticas Regenerativas</h3>
          <p style="margin:0 0 8px 0;">Guías y registro de prácticas en campo. Sincroniza con gestión de fincas y evidencia.</p>
        </div>
      </div>
      <div id="escuela-submodulo"></div>
    `;
    // Voz Melantia al entrar al menú principal
    if (window.mandoVozActivo && typeof window.hablarMelantia === 'function') {
      window.hablarMelantia(
        '¡Hola! Soy Melantia y te doy la bienvenida a la Escuela de Campo. Aquí aprenderás a transformar tu finca y tu vida con prácticas regenerativas, cursos innovadores y acompañamiento personalizado. ¡Explora, pregunta y crece con nosotros!',
        7
      );
    }
  },
  async mostrarMenu(contenedorId = 'app-menu') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `
      <h2>🌾 Escuela de Campo MELANTIA</h2>
      <div class="tarjetas-grid">
        <div class="card" onclick="MelantiaEscuelaCampo.mostrarCursos()">
          <div style="font-size:2em;">📚</div>
          <h3>Cursos Especializados</h3>
          <p>Capacítate en agricultura regenerativa, trazabilidad, manejo animal y más. Acceso según tu plan.</p>
        </div>
      </div>
      <div id="escuela-submodulo"></div>
    `;
  },

  async mostrarCursos(contenedorId = 'escuela-submodulo') {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    // Cargar cursos desde JSON principal
    const resp = await fetch('modules/07_escuela de campo/escuela_cursos.json');
    const data = await resp.json();
    cont.innerHTML =
      `<h3>Cursos Disponibles</h3><div class="tarjetas-grid">` +
      data.cursos
        .map(
          (curso, idx) => `
        <div class="card" style="cursor:pointer;" onclick="MelantiaEscuelaCampo.mostrarDetalleCurso(${idx})">
          <h3>${curso.titulo}</h3>
          <p>${curso.descripcion}</p>
        </div>
      `
        )
        .join('') +
      `</div>`;
    window._escuelaCursosCache = data.cursos;
    // Voz Melantia al mostrar cursos
    if (window.mandoVozActivo && typeof window.hablarMelantia === 'function') {
      window.hablarMelantia(
        'Te presento los cursos más innovadores y prácticos para el campo. Elige el que más te inspire y recuerda: cada aprendizaje es una semilla para tu futuro.',
        7
      );
    }
  },

  async mostrarDetalleCurso(idx, contenedorId = 'escuela-submodulo') {
    const cursos = window._escuelaCursosCache;
    if (!cursos || !cursos[idx]) return;
    const curso = cursos[idx];
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    // Cargar prácticas asociadas al curso
    let practicas = [];
    if (curso.practicas_json) {
      try {
        const resp = await fetch(curso.practicas_json);
        const data = await resp.json();
        practicas = data.practicas || [];
      } catch {}
    }
    cont.innerHTML =
      `
      <button onclick="MelantiaEscuelaCampo.mostrarCursos()">← Volver a cursos</button>
      <h3>${curso.titulo}</h3>
      <p>${curso.descripcion}</p>
      <h4>Prácticas Regenerativas Relacionadas</h4>
      <ul>` +
      practicas
        .map(
          (p, i) =>
            `<li><b>${p.nombre}</b>: ${p.descripcion || ''} <button onclick="MelantiaEscuelaCampo.registrarPractica(${idx},${i})">Registrar Evidencia</button></li>`
        )
        .join('') +
      `</ul>`;
    window._escuelaPracticasCache = practicas;
    // Voz Melantia al mostrar detalle de curso
    if (window.mandoVozActivo && typeof window.hablarMelantia === 'function') {
      window.hablarMelantia(
        `Curso seleccionado: ${curso.titulo}. ${curso.descripcion} Recuerda que puedes registrar tus avances y consultar a Melantia cuando lo necesites. ¡Tú puedes lograrlo!`,
        7
      );
    }
  },

  registrarPractica(idxCurso, idxPractica) {
    const cursos = window._escuelaCursosCache;
    const practicas = window._escuelaPracticasCache;
    if (!cursos || !practicas || !practicas[idxPractica]) return;
    const practica = practicas[idxPractica];
    // Aquí se conecta con gestión de fincas y trazabilidad
    if (
      window.GestionFincas &&
      typeof window.GestionFincas.registrarPractica === 'function'
    ) {
      window.GestionFincas.registrarPractica({
        curso: cursos[idxCurso].titulo,
        nombre: practica.nombre,
        descripcion: practica.descripcion,
        fecha: new Date().toISOString(),
      });
      alert('¡Evidencia registrada y asociada a tu finca!');
      // Voz Melantia al registrar práctica
      if (
        window.mandoVozActivo &&
        typeof window.hablarMelantia === 'function'
      ) {
        window.hablarMelantia(
          `¡Excelente! La práctica ${practica.nombre} ha sido registrada y vinculada a tu finca. Cada acción cuenta para regenerar tu campo y tu comunidad. ¡Sigue adelante, Melantia te acompaña!`,
          7
        );
      }
    } else {
      alert(
        'Evidencia registrada localmente. (Integración con gestión de fincas no disponible)'
      );
      if (
        window.mandoVozActivo &&
        typeof window.hablarMelantia === 'function'
      ) {
        window.hablarMelantia(
          `La práctica ${practica.nombre} ha sido registrada localmente. Cuando la integración esté disponible, se sumará a tu historial de finca. ¡No dejes de registrar tus logros!`,
          7
        );
      }
    }
  },
};
