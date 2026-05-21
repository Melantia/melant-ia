// Guardado y carga de puntos GPS y zonas de alta velocidad
(function () {
  function guardarPunto(punto) {
    // Guarda punto GPS en localStorage
    let puntos = JSON.parse(
      localStorage.getItem('puntos_senal_melantia') || '[]'
    );
    puntos.push(punto);
    localStorage.setItem('puntos_senal_melantia', JSON.stringify(puntos));
  }
  function cargarPuntos() {
    return JSON.parse(localStorage.getItem('puntos_senal_melantia') || '[]');
  }
  window.PuntosSenalMelantia = { guardarPunto, cargarPuntos };
})();
