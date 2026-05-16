// servicios_financieros.js — Lógica para el ítem Servicios Financieros en Negocios Rurales MELANTIA

// Requisitos para desbloqueo de servicios financieros
const REQUISITOS_FINANCIEROS = [
  {
    clave: 'meses_uso',
    texto: 'Al menos 6 meses de uso de la app',
    check: (perfil) => (perfil.meses_uso || 0) >= 6,
  },
  {
    clave: 'cursos_regenerativa',
    texto:
      'Haber completado 3 cursos de Agricultura Regenerativa con prácticas',
    check: (perfil) => (perfil.cursos_regenerativa || 0) >= 3,
  },
  {
    clave: 'cosechas',
    texto: 'Registrar mínimo 3 cosechas o actividades productivas',
    check: (perfil) => (perfil.cosechas || 0) >= 3,
  },
  {
    clave: 'informe_ganancias',
    texto: 'Informe de pérdidas y ganancias, con ingreso mensual',
    check: (perfil) => !!perfil.informe_ganancias,
  },
  {
    clave: 'evidencias',
    texto: 'Subir evidencias (fotos, GPS, documentos)',
    check: (perfil) => (perfil.evidencias || 0) >= 3,
  },
  {
    clave: 'carbono',
    texto: 'Ser parte del proyecto de captura de carbono',
    check: (perfil) => !!perfil.captura_carbono,
  },
];

// Simulación de perfil del usuario (en producción, cargar desde backend o localStorage)
function obtenerPerfilUsuario() {
  // Simulación: cambiar estos valores para probar el progreso
  return {
    meses_uso: 5,
    cursos_regenerativa: 2,
    cosechas: 2,
    informe_ganancias: false,
    evidencias: 1,
    captura_carbono: false,
  };
}

window.mostrarServiciosFinancieros = function () {
  const contenedor = document.getElementById('app-menu');
  const perfil = obtenerPerfilUsuario();
  let requisitosHtml = '<ul class="servicios-financieros-lista">';
  let cumpleTodos = true;
  REQUISITOS_FINANCIEROS.forEach((req) => {
    const ok = req.check(perfil);
    requisitosHtml += `<li style="color:${ok ? '#2e7d32' : '#b91c1c'};">${ok ? '✔️' : '❌'} ${req.texto}</li>`;
    if (!ok) cumpleTodos = false;
  });
  requisitosHtml += '</ul>';

  contenedor.innerHTML = `
    <h2>Servicios Financieros Rurales</h2>
    <p>Accede a productos y oportunidades financieras diseñadas para productores y emprendedores rurales.</p>
    <h4>Requisitos para desbloquear el acceso:</h4>
    ${requisitosHtml}
    ${cumpleTodos ? `<button class="btn-melantia" onclick="window.iniciarOnboardingFinanciero()">Iniciar Onboarding Financiero</button>` : `<div style='color:#b91c1c;font-weight:bold;'>Aún no cumples todos los requisitos. Consulta tu progreso y sigue usando MELANTIA para acceder a los servicios financieros.</div>`}
  `;
};

window.iniciarOnboardingFinanciero = function () {
  const contenedor = document.getElementById('app-menu');
  contenedor.innerHTML = `
    <h3>Solicitud de Crédito Rural</h3>
    <form id="form-solicitud-credito">
      <label>Email de usuario:<br><input type="email" name="usuario_email" required></label><br>
      <label>Monto solicitado (USD):<br><input type="number" name="monto" min="100" step="10" required></label><br>
      <label>Destino del crédito:<br><input type="text" name="destino" required></label><br>
      <label>Plazo (meses):<br><input type="number" name="plazo_meses" min="1" max="60" required></label><br>
      <label>Ubicación (GPS):<br><input type="text" name="gps" placeholder="Lat,Lng"></label><br>
      <label>Adjuntar foto de la finca:<br><input type="file" name="foto" accept="image/*"></label><br>
      <label>Adjuntar documento (opcional):<br><input type="file" name="documento"></label><br>
      <button type="submit" class="btn-melantia">Enviar Solicitud</button>
    </form>
    <div id="solicitud-resultado"></div>
  `;

  document.getElementById('form-solicitud-credito').onsubmit = async function (
    e
  ) {
    e.preventDefault();
    const form = e.target;
    const data = {
      usuario_email: form.usuario_email.value,
      monto: parseFloat(form.monto.value),
      destino: form.destino.value,
      plazo_meses: parseInt(form.plazo_meses.value),
      gps: form.gps.value,
      creado_en: new Date().toISOString(),
      estado: 'pendiente',
    };

    // Manejo de archivos (foto y documento)
    const files = {};
    if (form.foto.files[0]) files.foto = form.foto.files[0];
    if (form.documento.files[0]) files.documento = form.documento.files[0];

    // Subir archivos a Supabase Storage si existen
    let evidencias = {};
    if (window.MELANTIA_SUPABASE_CONFIG && (files.foto || files.documento)) {
      const { url, anonKey, bucket } = window.MELANTIA_SUPABASE_CONFIG;
      const supabase =
        window.supabase ||
        (
          await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
        ).createClient(url, anonKey);
      for (const [key, file] of Object.entries(files)) {
        const filePath = `${data.usuario_email}/credito_${Date.now()}_${key}_${file.name}`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });
        if (!error) evidencias[key] = filePath;
      }
    }
    data.evidencias = evidencias;

    // Guardar solicitud en Supabase (tabla solicitudes_credito)
    try {
      const { url, anonKey } = window.MELANTIA_SUPABASE_CONFIG;
      const supabase =
        window.supabase ||
        (
          await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
        ).createClient(url, anonKey);
      const { error } = await supabase
        .from('solicitudes_credito')
        .insert([data]);
      if (error) {
        document.getElementById('solicitud-resultado').innerHTML =
          `<span style='color:#b91c1c;'>Error al enviar la solicitud: ${error.message}</span>`;
      } else {
        document.getElementById('solicitud-resultado').innerHTML =
          '<b>¡Solicitud enviada! Un asesor revisará tu información y te contactará.</b>';
        form.reset();

        // --- INTEGRACIÓN CON BANCO/COOPERATIVA ---
        // OPCIÓN 1: Enviar solicitud por API directa (si el banco provee endpoint)
        // Descomenta y configura según el endpoint y token del banco:
        // try {
        //   const response = await fetch('https://api.banco.com/solicitudes', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Bearer TU_TOKEN_API',
        //     },
        //     body: JSON.stringify(data),
        //   });
        //   if (response.ok) {
        //     // Notificar éxito
        //   }
        // } catch (apiErr) { /* Manejo de error */ }

        // OPCIÓN 2: Enviar solicitud por correo seguro (PDF/JSON adjunto)
        // Puedes usar un servicio backend (ej: Cloud Function, Zapier, Make) que reciba la solicitud y la reenvíe por correo.
        // Ejemplo de hook:
        // await fetch('https://tu-backend.com/enviar-correo', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data),
        // });

        // OPCIÓN 3: Dashboard para el banco/cooperativa
        // El banco puede acceder a Supabase y descargar las solicitudes desde la tabla 'solicitudes_credito'.
        // Puedes crear un dashboard web protegido para visualización y gestión.
        // --- FIN INTEGRACIÓN ---
      }
    } catch (err) {
      document.getElementById('solicitud-resultado').innerHTML =
        `<span style='color:#b91c1c;'>Error inesperado: ${err.message}</span>`;
    }
  };
};
