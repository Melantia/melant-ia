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
};
