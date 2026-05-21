// Funciones de vibración según fuerza de señal
(function () {
  function vibrarFuerte() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
  function vibrarSuave() {
    if (navigator.vibrate) navigator.vibrate(100);
  }
  window.VibracionMelantia = { vibrarFuerte, vibrarSuave };
})();
