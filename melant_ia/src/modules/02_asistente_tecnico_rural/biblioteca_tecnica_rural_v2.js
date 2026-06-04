// ========================================================================
// BIBLIOTECA TÉCNICA RURAL v2.0 - Módulo de consulta con capítulos
// ========================================================================
// Estructura: 7 Capítulos técnicos por cultivo
// Capítulos: 1. Botánica, 2. Establecimiento, 3. Nutrición, 4. Plagas, 5. Enfermedades, 6. Cosecha, 7. Economía

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;

  contenedor.innerHTML = `
    <div class="biblioteca-container" style="max-width:1100px;margin:20px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:2em;">📚</span> Biblioteca Técnica Rural - Centro de Conocimiento
      </h2>
      <p style="color:#666;font-size:0.95em;margin-bottom:24px;">
        <strong>Contenido técnico profesional para consulta offline.</strong> Cada cultivo se desarrolla en 7 capítulos exhaustivos con procedimientos paso a paso, tablas de referencia y recomendaciones prácticas.
      </p>

      <!-- Tabs de Cultivos -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;border-bottom:2px solid #e0e0e0;padding-bottom:16px;overflow-x:auto;">
        <button class="tab-cultivo" data-cultivo="cacao" style="padding:10px 20px;background:#276749;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🍫 Cacao
        </button>
        <button class="tab-cultivo" data-cultivo="cafe" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          ☕ Café
        </button>
        <button class="tab-cultivo" data-cultivo="palma" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🌴 Palma Africana
        </button>
        <button class="tab-cultivo" data-cultivo="platano" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🍌 Plátano Barraganete
        </button>
        <button class="tab-cultivo" data-cultivo="ganaderia" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🐄 Ganadería
        </button>
        <button class="tab-cultivo" data-cultivo="maiz" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🌽 Maíz
        </button>
        <button class="tab-cultivo" data-cultivo="maiz_regenerativo" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🌱 Maíz Regenerativo
        </button>
        <button class="tab-cultivo" data-cultivo="arroz_convencional" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🍚 Arroz Convencional
        </button>
        <button class="tab-cultivo" data-cultivo="arroz_agroecologico" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🌾 Arroz Agroecológico
        </button>
        <button class="tab-cultivo" data-cultivo="papa_convencional" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🥔 Papa Convencional
        </button>
        <button class="tab-cultivo" data-cultivo="papa_nativa" style="padding:10px 20px;background:#f5f5f5;color:#276749;border:none;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">
          🥔 Papa Nativa
        </button>
      </div>

      <!-- Contenedor de Capítulos -->
      <div id="capitulos-container" style="margin-bottom:32px;">
        <div style="text-align:center;padding:40px;color:#999;">
          <p>Selecciona un cultivo para ver los capítulos disponibles</p>
        </div>
      </div>

      <!-- Botones de acción -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;border-top:2px solid #e0e0e0;padding-top:24px;">
        <button id="btn-descargar-pdf" style="padding:12px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;font-weight:600;">
          📥 Descargar Guía Completa (PDF)
        </button>
        <button id="btn-compartir" style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;font-weight:600;">
          📤 Compartir Capítulo
        </button>
        <button onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" style="padding:12px 24px;background:#ccc;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:1em;">
          ← Volver
        </button>
      </div>

      <!-- Visor de Capítulo (oculto por defecto) -->
      <div id="visor-capitulo" style="display:none;margin-top:32px;padding:24px;background:#f9f9f9;border-left:4px solid #276749;border-radius:8px;max-height:80vh;overflow-y:auto;">
        <button id="btn-cerrar-visor" style="float:right;background:#276749;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-bottom:16px;font-weight:600;">
          ✕ Cerrar
        </button>
        <div id="contenido-capitulo"></div>
      </div>
    </div>
  `;

  // Mapeo de cultivos a capítulos
  const cultivos = {
    cacao: {
      nombre: 'Cacao',
      capitulos: [
        {
          numero: 1,
          titulo: 'Introducción a la Botánica del Cacao',
          archivo: 'cacao_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento del Cultivo de Cacao',
          archivo: 'cacao_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización del Cacao',
          archivo: 'cacao_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas del Cacao',
          archivo: 'cacao_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Cacao',
          archivo: 'cacao_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Poscosecha del Cacao',
          archivo: 'cacao_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Cultivo de Cacao',
          archivo: 'cacao_capitulo_7.json',
        },
      ],
    },
    cafe: {
      nombre: 'Café',
      capitulos: [
        {
          numero: 1,
          titulo: 'Introducción a la Botánica del Café',
          archivo: 'cafe_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento del Cultivo de Café',
          archivo: 'cafe_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización del Café',
          archivo: 'cafe_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas del Café',
          archivo: 'cafe_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Café',
          archivo: 'cafe_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Poscosecha del Café',
          archivo: 'cafe_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Cultivo de Café',
          archivo: 'cafe_capitulo_7.json',
        },
      ],
    },
    palma: {
      nombre: 'Palma Africana',
      capitulos: [
        {
          numero: 1,
          titulo: 'Introducción a la Botánica de la Palma Africana',
          archivo: 'palma_africana_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento del Cultivo de Palma Africana',
          archivo: 'palma_africana_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización de la Palma Africana',
          archivo: 'palma_africana_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas de la Palma Africana',
          archivo: 'palma_africana_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades de la Palma Africana',
          archivo: 'palma_africana_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Procesamiento de Palma Africana',
          archivo: 'palma_africana_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Cultivo de Palma Africana',
          archivo: 'palma_africana_capitulo_7.json',
        },
      ],
    },
    platano: {
      nombre: 'Plátano Barraganete',
      capitulos: [
        {
          numero: 1,
          titulo: 'Introducción a la Botánica del Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento del Cultivo de Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización del Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas del Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Poscosecha del Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Cultivo de Plátano Barraganete',
          archivo: 'platano_barraganete_capitulo_7.json',
        },
      ],
    },
    ganaderia: {
      nombre: 'Ganadería Bovina',
      capitulos: [
        {
          numero: 1,
          titulo: 'Introducción a la Ganadería Bovina',
          archivo: 'ganaderia_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Infraestructura y Pastos para Ganadería',
          archivo: 'ganaderia_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Alimentación del Ganado',
          archivo: 'ganaderia_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Parásitos y Sanidad Preventiva',
          archivo: 'ganaderia_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades Principales del Ganado',
          archivo: 'ganaderia_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Producción Lechera y Ordeño',
          archivo: 'ganaderia_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía de la Ganadería Bovina',
          archivo: 'ganaderia_capitulo_7.json',
        },
        {
          numero: 8,
          titulo: 'Sistema Integrado Ganadería + Maíz',
          archivo: 'ganaderia_capitulo_8.json',
        },
      ],
    },
    maiz: {
      nombre: 'Maíz',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Fisiología del Maíz',
          archivo: 'maiz_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento y Preparación del Cultivo de Maíz',
          archivo: 'maiz_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización del Maíz',
          archivo: 'maiz_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas del Maíz',
          archivo: 'maiz_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Maíz',
          archivo: 'maiz_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Procesamiento de Maíz',
          archivo: 'maiz_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Cultivo de Maíz',
          archivo: 'maiz_capitulo_7.json',
        },
        {
          numero: 8,
          titulo: 'Sistema Integrado Maíz + Ganadería',
          archivo: 'maiz_capitulo_8.json',
        },
      ],
    },
    maiz_regenerativo: {
      nombre: 'Maíz Transición Regenerativa',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Fisiología del Maíz Regenerativo',
          archivo: 'maiz_regenerativo_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento Regenerativo del Maíz',
          archivo: 'maiz_regenerativo_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización Regenerativa',
          archivo: 'maiz_regenerativo_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Control Biológico de Plagas',
          archivo: 'maiz_regenerativo_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades - Prevención Biológica',
          archivo: 'maiz_regenerativo_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Selección de Semilla Criolla',
          archivo: 'maiz_regenerativo_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía de Transición Regenerativa',
          archivo: 'maiz_regenerativo_capitulo_7.json',
        },
      ],
    },
    arroz_convencional: {
      nombre: 'Arroz Convencional',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Variedades de Arroz Convencional',
          archivo: 'arroz_convencional_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento y Preparación del Arroz Convencional',
          archivo: 'arroz_convencional_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización del Arroz',
          archivo: 'arroz_convencional_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas del Arroz Convencional',
          archivo: 'arroz_convencional_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Arroz Convencional',
          archivo: 'arroz_convencional_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Procesamiento del Arroz',
          archivo: 'arroz_convencional_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Arroz Convencional',
          archivo: 'arroz_convencional_capitulo_7.json',
        },
      ],
    },
    arroz_agroecologico: {
      nombre: 'Arroz Agroecológico',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Variedades de Arroz Agroecológico',
          archivo: 'arroz_agroecologico_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento Agroecológico del Arroz',
          archivo: 'arroz_agroecologico_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición Agroecológica del Arroz',
          archivo: 'arroz_agroecologico_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Control Biológico de Plagas en Arroz',
          archivo: 'arroz_agroecologico_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades del Arroz Agroecológico',
          archivo: 'arroz_agroecologico_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Procesamiento Arroz Agroecológico',
          archivo: 'arroz_agroecologico_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía del Arroz Agroecológico',
          archivo: 'arroz_agroecologico_capitulo_7.json',
        },
      ],
    },
    papa_convencional: {
      nombre: 'Papa Convencional',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Variedades de Papa Convencional',
          archivo: 'papa_convencional_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento y Preparación de Papa Convencional',
          archivo: 'papa_convencional_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición y Fertilización de Papa Convencional',
          archivo: 'papa_convencional_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas de Papa Convencional',
          archivo: 'papa_convencional_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades de Papa Convencional',
          archivo: 'papa_convencional_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Procesamiento de Papa',
          archivo: 'papa_convencional_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía de Papa Convencional',
          archivo: 'papa_convencional_capitulo_7.json',
        },
      ],
    },
    papa_nativa: {
      nombre: 'Papa Nativa',
      capitulos: [
        {
          numero: 1,
          titulo: 'Botánica y Variedades de Papa Nativa',
          archivo: 'papa_nativa_capitulo_1.json',
        },
        {
          numero: 2,
          titulo: 'Establecimiento y Siembra de Papa Nativa',
          archivo: 'papa_nativa_capitulo_2.json',
        },
        {
          numero: 3,
          titulo: 'Nutrición de Papa Nativa',
          archivo: 'papa_nativa_capitulo_3.json',
        },
        {
          numero: 4,
          titulo: 'Plagas de Papa Nativa',
          archivo: 'papa_nativa_capitulo_4.json',
        },
        {
          numero: 5,
          titulo: 'Enfermedades de Papa Nativa',
          archivo: 'papa_nativa_capitulo_5.json',
        },
        {
          numero: 6,
          titulo: 'Cosecha y Almacenaje de Papa Nativa',
          archivo: 'papa_nativa_capitulo_6.json',
        },
        {
          numero: 7,
          titulo: 'Economía de Papa Nativa',
          archivo: 'papa_nativa_capitulo_7.json',
        },
      ],
    },
  };

  // Event listeners para tabs de cultivos
  Array.from(document.querySelectorAll('.tab-cultivo')).forEach((btn) => {
    btn.addEventListener('click', () => {
      const cultivo = btn.getAttribute('data-cultivo');
      mostrarCapitulosCultivo(cultivo, cultivos[cultivo]);

      // Actualizar estilos de tabs
      Array.from(document.querySelectorAll('.tab-cultivo')).forEach((b) => {
        b.style.background = '#f5f5f5';
        b.style.color = '#276749';
      });
      btn.style.background = '#276749';
      btn.style.color = '#fff';
    });
  });

  function mostrarCapitulosCultivo(culturaNombre, culturaData) {
    const container = document.getElementById('capitulos-container');

    let html = `
      <div style="background:#f0f8f6;padding:20px;border-radius:8px;margin-bottom:24px;">
        <h3 style="color:#276749;margin-top:0;">${culturaData.nombre} - 7 Capítulos Técnicos</h3>
        <p style="color:#666;margin:0;">Cada capítulo contiene información exhaustiva, procedimientos detallados, tablas técnicas y recomendaciones prácticas de campo.</p>
      </div>
      <div style="display:grid;gap:16px;">
    `;

    culturaData.capitulos.forEach((cap) => {
      const disponible = cap.archivo !== null;
      html += `
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid ${disponible ? '#4caf50' : '#ccc'};display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <h4 style="color:#276749;margin:0 0 4px 0;">Capítulo ${cap.numero}: ${cap.titulo}</h4>
            <p style="color:#999;font-size:0.9em;margin:0;">${disponible ? '✅ Disponible para consulta' : '⏳ En preparación'}</p>
          </div>
          ${
            disponible
              ? `
            <button class="btn-abrir-capitulo" data-archivo="${cap.archivo}" data-titulo="Capítulo ${cap.numero}: ${cap.titulo}" style="padding:10px 20px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap;margin-left:12px;">
              📖 Leer
            </button>
          `
              : `
            <span style="color:#ccc;font-size:0.9em;white-space:nowrap;margin-left:12px;">Próximamente</span>
          `
          }
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Event listeners para botones abrir capítulo
    Array.from(document.querySelectorAll('.btn-abrir-capitulo')).forEach(
      (btn) => {
        btn.addEventListener('click', () => {
          const archivo = btn.getAttribute('data-archivo');
          const titulo = btn.getAttribute('data-titulo');
          cargarYMostrarCapitulo(archivo, titulo);
        });
      }
    );
  }

  async function cargarYMostrarCapitulo(archivo, titulo) {
    const visor = document.getElementById('visor-capitulo');
    const contenido = document.getElementById('contenido-capitulo');

    try {
      // Cargar desde archivo JSON local (importación dinámica)
      const modulo = await import(`./capitulos/${archivo}`);
      const datos = modulo.default || modulo;

      // Renderizar contenido del capítulo
      let html = `
        <h2 style="color:#276749;border-bottom:2px solid #276749;padding-bottom:12px;margin-top:0;">
          ${titulo}
        </h2>
        <div style="color:#555;line-height:1.8;">
      `;

      // Iterar sobre las secciones del capítulo
      Object.keys(datos.contenido).forEach((seccion) => {
        const seccionData = datos.contenido[seccion];
        html += renderizarSeccion(seccionData);
      });

      html += '</div>';
      contenido.innerHTML = html;
      visor.style.display = 'block';
      visor.scrollTop = 0;
    } catch (error) {
      contenido.innerHTML = `
        <div style="background:#ffebee;padding:16px;border-radius:6px;color:#b71c1c;">
          <p><strong>⚠️ Error al cargar capítulo:</strong> ${error.message}</p>
          <p>Estamos preparando este contenido. Por favor, intenta más tarde.</p>
        </div>
      `;
      visor.style.display = 'block';
    }
  }

  function renderizarSeccion(seccion) {
    let html = '';

    // Títulos
    if (seccion.titulo) {
      const nivel =
        seccion.titulo.includes('1.') || seccion.titulo.includes('2.')
          ? 'h3'
          : 'h4';
      html += `<${nivel} style="color:#276749;margin-top:24px;margin-bottom:12px;">${seccion.titulo}</${nivel}>`;
    }

    // Texto simple
    if (seccion.texto) {
      html += `<p style="white-space:pre-wrap;margin-bottom:16px;">${seccion.texto}</p>`;
    }

    // Datos clave (bullets)
    if (seccion.datos_clave && Array.isArray(seccion.datos_clave)) {
      html += '<ul style="margin-left:20px;margin-bottom:16px;">';
      seccion.datos_clave.forEach((item) => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }

    // Pasos secuenciales
    if (seccion.paso_1 || seccion.paso_1_seleccion_topografia) {
      Object.keys(seccion)
        .filter((k) => k.startsWith('paso_'))
        .forEach((key) => {
          const paso = seccion[key];
          html += `<div style="background:#f9f9f9;padding:12px;border-radius:6px;margin-bottom:12px;border-left:4px solid #4caf50;">`;
          if (paso.titulo) html += `<strong>${paso.titulo}</strong><br>`;
          if (paso.detalles) html += `${paso.detalles}<br>`;
          if (paso.criterios && Array.isArray(paso.criterios)) {
            html += '<ul style="margin:8px 0 0 20px;">';
            paso.criterios.forEach((c) => (html += `<li>${c}</li>`));
            html += '</ul>';
          }
          html += `</div>`;
        });
    }

    // Objetos anidados recursivos
    if (typeof seccion === 'object' && !Array.isArray(seccion)) {
      Object.keys(seccion).forEach((key) => {
        if (
          key !== 'titulo' &&
          key !== 'texto' &&
          key !== 'datos_clave' &&
          !key.startsWith('paso_')
        ) {
          const subseccion = seccion[key];
          if (typeof subseccion === 'object' && subseccion.titulo) {
            html += renderizarSeccion(subseccion);
          }
        }
      });
    }

    return html;
  }

  // Botón cerrar visor
  document.getElementById('btn-cerrar-visor').addEventListener('click', () => {
    document.getElementById('visor-capitulo').style.display = 'none';
  });

  // Botones de acción
  document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
    alert(
      '📥 Funcionalidad de descarga PDF en desarrollo.\nPronto podrás descargar guías completas en PDF para consulta offline.'
    );
  });

  document.getElementById('btn-compartir').addEventListener('click', () => {
    alert(
      '📤 Funcionalidad de compartir en desarrollo.\nPronto podrás compartir capítulos vía email o WhatsApp.'
    );
  });
}
