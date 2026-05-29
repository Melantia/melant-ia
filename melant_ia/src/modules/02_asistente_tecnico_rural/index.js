// index.js
// Panel principal para Asistente Técnico Rural

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Asistente Técnico Rural</h2>
      <p style="color:#444;font-size:1.1em;">Selecciona el submódulo que deseas consultar o utiliza la función de foto inteligente:</p>
      <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:24px 0;">
        <button class="btn-submodulo" data-submodulo="AsistenteTecnicoCultivos">Asistente Técnico en Cultivos</button>
        <button class="btn-submodulo" data-submodulo="AsistenteTecnicoVeterinario">Asistente Técnico Veterinario</button>
        <button class="btn-submodulo" data-submodulo="salud_medicina_veterinaria">Salud y Medicina Veterinaria</button>
        <button class="btn-submodulo" data-submodulo="AgriculturaPrecision">Agricultura de Precisión (Sensores)</button>
        <button class="btn-submodulo" data-submodulo="GpsMedicionTerrenos">GPS (Medición de Terrenos)</button>
        <button class="btn-submodulo" data-submodulo="VisionArtificial">Visión Artificial</button>
        <button class="btn-submodulo" data-submodulo="VisionSatelital">Visión Satelital</button>
      </div>
      <div style="margin:32px 0;text-align:center;">
        <input type="file" accept="image/*" capture="environment" id="input-foto-cultivo" style="display:none;" />
        <button id="btn-tomar-foto" style="padding:12px 28px;background:#3182ce;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1.1em;">📷 Tomar o Subir Foto</button>
        <div id="foto-preview" style="margin-top:18px;"></div>
      </div>
      <button onclick="window.cargarDatosModulo(null, 'Inicio')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver al Inicio</button>
    </div>
  `;

  // Vincular eventos a los botones de submódulos
  Array.from(document.querySelectorAll('.btn-submodulo')).forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const modulo = btn.getAttribute('data-submodulo');
      const mod = await window.cargarModulo(modulo);
      mod.mostrarPanel?.();
    });
  });

  // Lógica para tomar o subir foto
  const btnFoto = document.getElementById('btn-tomar-foto');
  const inputFoto = document.getElementById('input-foto-cultivo');
  const fotoPreview = document.getElementById('foto-preview');
  btnFoto.addEventListener('click', () => {
    inputFoto.value = '';
    inputFoto.click();
  });
  inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      fotoPreview.innerHTML = `<img src="${ev.target.result}" alt="Foto subida" style="max-width:320px;border-radius:8px;box-shadow:0 2px 8px #0002;display:block;margin:0 auto 16px;" />`;
      // Simular pregunta al usuario
      fotoPreview.innerHTML += `<div style='margin:12px 0;'>¿Qué necesitas hacer con esta foto?</div>
        <button class='opcion-foto' data-accion='cultivo' style='margin:4px 8px;padding:8px 18px;'>Diagnóstico de Cultivo</button>
        <button class='opcion-foto' data-accion='veterinario' style='margin:4px 8px;padding:8px 18px;'>Diagnóstico Veterinario</button>
        <button class='opcion-foto' data-accion='evidencia' style='margin:4px 8px;padding:8px 18px;'>Registrar Evidencia</button>`;
      Array.from(document.querySelectorAll('.opcion-foto')).forEach((btn) => {
        btn.addEventListener('click', () => {
          const accion = btn.getAttribute('data-accion');
          if (accion === 'cultivo') {
            alert(
              'La imagen será analizada para identificar el cultivo y almacenada para aprendizaje.'
            );
            // Aquí se podría llamar a VisionArtificial o lógica de IA
          } else if (accion === 'veterinario') {
            alert(
              'La imagen será analizada para diagnóstico veterinario y almacenada para aprendizaje.'
            );
            // Aquí se podría llamar a submódulo veterinario o IA
          } else if (accion === 'evidencia') {
            alert('La imagen se guardará como evidencia en el sistema.');
            // Aquí se podría llamar a Registro Evidencias
          }
        });
      });
    };
    reader.readAsDataURL(file);
  });
}
