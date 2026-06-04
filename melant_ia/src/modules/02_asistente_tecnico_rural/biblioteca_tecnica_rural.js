// ========================================================================
// BIBLIOTECA TÉCNICA RURAL - Módulo de consulta de recursos técnicos
// ========================================================================
// Centraliza: Guías, manuales, tutoriales, artículos técnicos y documentación
// para asesoramiento y capacitación continua de productores rurales

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;

  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:900px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;margin-bottom:8px;">📚 Biblioteca Técnica Rural</h2>
      <p style="color:#666;font-size:0.95em;margin-bottom:24px;">Centro de recursos técnicos: guías, manuales, tutoriales y documentación para productores</p>

      <!-- Buscador -->
      <div style="margin-bottom:24px;">
        <input 
          type="text" 
          id="buscar-biblioteca" 
          placeholder="🔍 Buscar: cultivos, plagas, técnicas..." 
          style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1em;"
        />
      </div>

      <!-- Categorías -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px;">
        <button class="btn-categoria" data-categoria="cultivos" style="padding:16px;background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          🌱 Cultivos Sostenibles
        </button>
        <button class="btn-categoria" data-categoria="plagas" style="padding:16px;background:#fff3e0;border:2px solid #ff9800;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          🐛 Manejo de Plagas
        </button>
        <button class="btn-categoria" data-categoria="suelo" style="padding:16px;background:#fce4ec;border:2px solid #e91e63;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          🌍 Fertilidad del Suelo
        </button>
        <button class="btn-categoria" data-categoria="riego" style="padding:16px;background:#e1f5fe;border:2px solid #03a9f4;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          💧 Riego Eficiente
        </button>
        <button class="btn-categoria" data-categoria="ganaderia" style="padding:16px;background:#f3e5f5;border:2px solid #9c27b0;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          🐄 Ganadería Rural
        </button>
        <button class="btn-categoria" data-categoria="regenerativo" style="padding:16px;background:#eceff1;border:2px solid #455a64;border-radius:8px;cursor:pointer;font-weight:600;color:#276749;">
          ♻️ Agricultura Regenerativa
        </button>
      </div>

      <!-- Contenedor de recursos -->
      <div id="contenedor-recursos" style="margin-bottom:32px;">
        <p style="color:#999;text-align:center;padding:20px;">Selecciona una categoría o busca un término</p>
      </div>

      <!-- Recursos Destacados -->
      <div style="background:#f9f9f9;border-left:4px solid #276749;padding:20px;border-radius:8px;margin-bottom:24px;">
        <h3 style="color:#276749;margin-top:0;margin-bottom:12px;">📌 Recursos Destacados</h3>
        <ul style="margin:0;padding-left:20px;color:#555;line-height:1.8;">
          <li><strong>Manual de Buenas Prácticas Agrícolas (BPA)</strong> - Lineamientos para producción sostenible</li>
          <li><strong>Guía de Identificación de Plagas por Cultivo</strong> - Fotos, síntomas y control biológico</li>
          <li><strong>Calendario Lunar para Siembras</strong> - Optimización según fases lunares</li>
          <li><strong>Recetas de Bioinsumos</strong> - Preparados caseros para control de plagas</li>
          <li><strong>Protocolo de Toma de Muestras de Suelo</strong> - Análisis de fertilidad</li>
        </ul>
      </div>

      <!-- Botones de acción -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button 
          id="btn-descargar-pdf" 
          style="padding:12px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;font-weight:600;"
        >
          📥 Descargar Guía Completa (PDF)
        </button>
        <button 
          id="btn-comentarios" 
          style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;font-weight:600;"
        >
          💬 Dejar Comentario / Sugerencia
        </button>
        <button 
          onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" 
          style="padding:12px 24px;background:#ccc;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:1em;"
        >
          ← Volver
        </button>
      </div>
    </div>
  `;

  // Datos de recursos por categoría
  const recursos = {
    cultivos: [
      {
        titulo: 'Cacao Regenerativo',
        descripcion: 'Prácticas de cultivo sostenible del cacao',
        archivo: 'cacao_regenerativo.py',
      },
      {
        titulo: 'Platano Prácticas Regenerativas',
        descripcion: 'Mejora de suelo y biodiversidad en platanales',
        archivo: 'practicas_regenerativas_platano.py',
      },
      {
        titulo: 'Palmas - Control y Manejo',
        descripcion: 'Técnicas de cultivo y control de plagas',
        archivo: 'tablas_control_palmas.sql',
      },
      {
        titulo: 'Limón Sutil Aprovechamiento',
        descripcion: 'Curso teórico-práctico de aprovechamiento',
        archivo: 'curso_aprovechamiento_limon_sutil.py',
      },
    ],
    plagas: [
      {
        titulo: 'Identificación de Plagas en Cacao',
        descripcion: 'Catálogo visual de plagas más comunes',
        archivo: 'plagas_cacao.py',
      },
      {
        titulo: 'Manejo Fitosanitario - Badea',
        descripcion: 'Control de enfermedades y plagas',
        archivo: 'generar_pdf_manejo_plagas_enfermedades_badea.py',
      },
      {
        titulo: 'Manejo Fitosanitario - Maracuyá',
        descripcion: 'Prevención y control de afecciones',
        archivo: 'generar_pdf_manejo_plagas_enfermedades_maracuya.py',
      },
      {
        titulo: 'Tareas Diarias - Fusarium',
        descripcion: 'Monitoreo y prevención de Fusarium',
        archivo: 'tareas_diarias_fusarium.py',
      },
    ],
    suelo: [
      {
        titulo: 'Análisis de Fertilidad del Suelo',
        descripcion: 'Protocolo de toma de muestras y análisis',
        archivo: 'protocolo_toma_muestras.txt',
      },
      {
        titulo: 'Bioinsumos Barraganete',
        descripcion: 'Preparados naturales para fortalecer el suelo',
        archivo: 'SistemaBarraganete.py',
      },
      {
        titulo: 'Recetas Bioinsumos',
        descripcion: 'Fórmulas caseras para nutrientes y control',
        archivo: 'recetas_bioinsumos.json',
      },
      {
        titulo: 'Manejo de Suelo',
        descripcion: 'Técnicas de labranza mínima y conservación',
        archivo: 'suelo.py',
      },
    ],
    riego: [
      {
        titulo: 'Eficiencia Hídrica en Cultivos',
        descripcion: 'Optimización del uso del agua',
        archivo: 'agricultura_precision.js',
      },
      {
        titulo: 'Sistemas de Riego por Goteo',
        descripcion: 'Instalación y mantenimiento',
        archivo: 'agricultura_precision.js',
      },
      {
        titulo: 'Calendario de Riego Inteligente',
        descripcion: 'Basado en clima y tipo de suelo',
        archivo: 'clima_inteligente.py',
      },
    ],
    ganaderia: [
      {
        titulo: 'Control de Ganadería',
        descripcion: 'Tablero de control de ganado',
        archivo: 'tablero_control_ganaderia.py',
      },
      {
        titulo: 'Control de Aves',
        descripcion: 'Manejo de aves de corral',
        archivo: 'tablero_control_mis_aves.py',
      },
      {
        titulo: 'Razas Paso Fino',
        descripcion: 'Cuidado y crianza de caballos paso fino',
        archivo: 'tablero_control_paso_fino.py',
      },
    ],
    regenerativo: [
      {
        titulo: 'Prácticas Regenerativas Generales',
        descripcion: 'Principios de agricultura regenerativa',
        archivo: 'practicas_regenerativas.js',
      },
      {
        titulo: 'Curso Práctico - Limón Sutil Regenerativo',
        descripcion: 'Aplicación de técnicas regenerativas',
        archivo: 'curso_practico_regenerativo_limon_sutil.py',
      },
      {
        titulo: 'Argumento de Prácticas Regenerativas',
        descripcion: 'Justificación científica de técnicas',
        archivo: 'practicas_regenerativas_platano_argumentadas.json',
      },
    ],
  };

  // Botones de categoría
  Array.from(document.querySelectorAll('.btn-categoria')).forEach((btn) => {
    btn.addEventListener('click', () => {
      const categoria = btn.getAttribute('data-categoria');
      mostrarRecursosPorCategoria(categoria, recursos[categoria] || []);
    });
  });

  // Búsqueda
  document
    .getElementById('buscar-biblioteca')
    .addEventListener('keyup', (e) => {
      const termino = e.target.value.toLowerCase();
      if (termino.length > 0) {
        buscarRecursos(termino, recursos);
      }
    });

  // Botón descargar PDF
  document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
    alert('📥 Descarga iniciada: Biblioteca_Tecnica_Rural_Completa.pdf');
    console.log('Generar PDF con todos los recursos');
  });

  // Botón comentarios
  document.getElementById('btn-comentarios').addEventListener('click', () => {
    const comentario = prompt('Comparte tu sugerencia o comentario:');
    if (comentario) {
      alert('✅ Gracias por tu aporte: ' + comentario);
    }
  });

  function mostrarRecursosPorCategoria(categoria, items) {
    const contenedor = document.getElementById('contenedor-recursos');
    if (items.length === 0) {
      contenedor.innerHTML =
        '<p style="color:#999;text-align:center;padding:20px;">Sin recursos en esta categoría</p>';
      return;
    }

    let html = `<h3 style="color:#276749;margin-top:0;">Recursos de ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h3>`;
    html += '<div style="display:grid;gap:16px;">';

    items.forEach((item) => {
      html += `
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid #4caf50;">
          <h4 style="color:#276749;margin:0 0 8px 0;">${item.titulo}</h4>
          <p style="color:#666;margin:0 0 12px 0;font-size:0.95em;">${item.descripcion}</p>
          <button style="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">
            📖 Leer más
          </button>
        </div>
      `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
  }

  function buscarRecursos(termino, recursos) {
    const contenedor = document.getElementById('contenedor-recursos');
    let resultados = [];

    Object.values(recursos).forEach((items) => {
      items.forEach((item) => {
        if (
          item.titulo.toLowerCase().includes(termino) ||
          item.descripcion.toLowerCase().includes(termino)
        ) {
          resultados.push(item);
        }
      });
    });

    if (resultados.length === 0) {
      contenedor.innerHTML =
        '<p style="color:#999;text-align:center;padding:20px;">No se encontraron resultados</p>';
      return;
    }

    let html = `<h3 style="color:#276749;margin-top:0;">Resultados de búsqueda (${resultados.length})</h3>`;
    html += '<div style="display:grid;gap:16px;">';

    resultados.forEach((item) => {
      html += `
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid #ff9800;">
          <h4 style="color:#276749;margin:0 0 8px 0;">${item.titulo}</h4>
          <p style="color:#666;margin:0 0 12px 0;font-size:0.95em;">${item.descripcion}</p>
          <button style="padding:8px 16px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">
            📖 Leer más
          </button>
        </div>
      `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
  }
}
