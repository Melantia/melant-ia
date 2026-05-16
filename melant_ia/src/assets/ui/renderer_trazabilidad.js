const UIRenderer = {
  dibujarTrazabilidad(contenedor, data) {
    const contenedorApp = document.getElementById(contenedor);

    let html = `<h2 style="color: #003366; margin-left: 15px;">${data.titulo}</h2>`;

    html += data.fases
      .map(
        (fase) => `
            <div class="fase-card" style="border-left: 6px solid #2E7D32; background: #ffffff; padding: 20px; margin: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="background: #003366; color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">
                            ${fase.paso}
                        </span>
                        <h3 style="margin: 0; color: #003366;">${fase.titulo}</h3>
                    </div>
                    <span class="melantio-badge" style="background: ${this.obtenerColorEstado(fase.estado)};">
                        ${fase.estado.toUpperCase()}
                    </span>
                </div>
                <ul style="margin-top: 15px; color: #555; line-height: 1.6;">
                    ${fase.detalles.map((d) => `<li>${d}</li>`).join('')}
                </ul>
                ${fase.paso === 4 ? '<button class="btn-melantia" style="margin-top:10px;">Generar QR</button>' : ''}
            </div>
        `
      )
      .join('');

    contenedorApp.innerHTML = html;
  },

  obtenerColorEstado(estado) {
    const colores = {
      completado: '#d1fae5', // Verde claro
      pendiente: '#fef3c7', // Dorado/Amarillo
      bloqueado: '#f3f4f6', // Gris
    };
    return colores[estado] || '#fef3c7';
  },
  },

  dibujarFichaCultivoGuanabana(contenedor, data) {
    const contenedorApp = document.getElementById(contenedor);
    let html = `<h2 style="color: #2e7d32; margin-left: 15px;">Cultivo de Guanábana</h2>`;
    html += `<div class='ficha-cultivo'>
      <b>Nombre científico:</b> ${data.nombre_cientifico}<br>
      <b>Descripción:</b> ${data.descripcion}<br>
      <b>Variedades:</b> ${data.variedades.map(v => v.nombre + ' (' + v.caracteristicas + ')').join(', ')}<br>
      <b>Riego óptimo:</b> ${data.riego_optimo}<br>
      <b>Fertilización NPK:</b> N:${data.npk_recomendado.N} P:${data.npk_recomendado.P} K:${data.npk_recomendado.K}<br>
      <b>Época de siembra:</b> ${data.epoca_siembra_recomendada} (${data.calendario_lunar})<br>
      <b>Polinización artificial:</b> ${data.polinizacion_artificial.descripcion}<br>
      <ul>${data.polinizacion_artificial.pasos.map(p=>`<li>${p}</li>`).join('')}</ul>
      <b>Beneficios:</b> ${data.polinizacion_artificial.beneficios}<br>
      <b>Cosecha:</b> ${data.cosecha.indicadores}, ${data.cosecha.epoca}, ${data.cosecha.recomendaciones}<br>
      <b>Postcosecha:</b> Limpieza: ${data.postcosecha.limpieza}, Almacenamiento: ${data.postcosecha.almacenamiento}, Procesamiento: ${data.postcosecha.procesamiento}<br>
      <b>Plagas comunes:</b> <ul>${data.plagas_comunes.map(p=>`<li>${p.nombre}: ${p.sintoma} (Orgánico: ${p.control_organico}, Químico: ${p.control_quimico})</li>`).join('')}</ul>
      <b>Enfermedades comunes:</b> <ul>${data.enfermedades_comunes.map(e=>`<li>${e.nombre}: ${e.sintoma} (Control: ${e.control})</li>`).join('')}</ul>
      <b>Zonas de producción en Ecuador:</b> ${data.zonas_produccion_ecuador.join(', ')}<br>
      <b>Importancia económica:</b> ${data.importancia_economica}<br>
    </div>`;
    contenedorApp.innerHTML = html;
  }
};
