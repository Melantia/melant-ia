// Importa y une los módulos técnicos, expone objetos globales
// Asume que cada módulo ya expone su objeto en window
(function () {
  // No requiere importaciones explícitas, solo asegura inicialización global
  window.MelantiaTecnico = {
    RadarUI: window.RadarUIMelantia,
    Vibracion: window.VibracionMelantia,
    Diagnostico: window.DiagnosticoMelantia,
    PuntosSenal: window.PuntosSenalMelantia,
    VozFabrizzio: window.vozFabrizzio,
    VozValentina: window.vozValentina,
    VozJorge: window.vozJorge,
  };
})();
