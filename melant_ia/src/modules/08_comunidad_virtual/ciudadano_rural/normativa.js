// Normativa y fuentes legales — Voz Dr. Pablo
import normativaFuentes from '../../../knowledge_seeds/08_comunidad_virtual/ciudadano_rural/normativa_fuentes.json';

export const NormativaCiudadanoRural = {
  obtenerNormativa() {
    if (window.hablarDrPablo)
      window.hablarDrPablo('Consulta de normativa y fuentes legales.');
    return normativaFuentes;
  },
};
