// Descargar, Compartir e Imprimir — MELANTIA
// Panel para gestionar descargas, compartir e impresión de documentos y evidencias

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Descargar, Compartir e Imprimir</h2>
    <button id='btn-descargar-evidencias' class='btn-melantia'>Descargar Evidencias</button>
    <button id='btn-compartir-evidencias' class='btn-melantia'>Compartir Evidencias</button>
    <button id='btn-imprimir-evidencias' class='btn-melantia'>Imprimir Evidencias</button>
    <div id='msg-evidencias'></div>
  `;
  document.getElementById('btn-descargar-evidencias').onclick = function () {
    const evidencias = JSON.parse(
      localStorage.getItem('evidencias_fotos') || '[]'
    );
    if (!evidencias.length) {
      document.getElementById('msg-evidencias').innerText =
        'No hay evidencias para descargar.';
      return;
    }
    evidencias.forEach((ev, i) => {
      const a = document.createElement('a');
      a.href = ev.foto;
      a.download = `evidencia_${i + 1}.png`;
      a.click();
    });
  };
  document.getElementById('btn-compartir-evidencias').onclick = function () {
    const evidencias = JSON.parse(
      localStorage.getItem('evidencias_fotos') || '[]'
    );
    if (!evidencias.length || !navigator.share) {
      document.getElementById('msg-evidencias').innerText =
        'No hay evidencias para compartir o el navegador no soporta compartir.';
      return;
    }
    evidencias.forEach((ev) => {
      navigator.share({
        title: 'Evidencia Fotográfica',
        text: 'Evidencia registrada en MELANTIA',
        url: ev.foto,
      });
    });
  };
  document.getElementById('btn-imprimir-evidencias').onclick = function () {
    const evidencias = JSON.parse(
      localStorage.getItem('evidencias_fotos') || '[]'
    );
    if (!evidencias.length) {
      document.getElementById('msg-evidencias').innerText =
        'No hay evidencias para imprimir.';
      return;
    }
    const win = window.open('', '_blank');
    win.document.write('<h2>Evidencias Fotográficas</h2>');
    evidencias.forEach((ev) => {
      win.document.write(
        `<div><img src='${ev.foto}' style='max-width:300px;'><br><span>${ev.fecha}</span></div><hr>`
      );
    });
    win.print();
  };
}
