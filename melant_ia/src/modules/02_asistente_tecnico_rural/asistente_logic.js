// asistente_logic.js
// Adaptación JS del módulo Python asistente_logic.py para integración web

export function calcularFertilizacion(cultivoNombre, toneladasEsperadas, data) {
  // data debe ser un objeto con la estructura de data_cultivos.json
  if (!data || !data.requerimientos || !data.requerimientos[cultivoNombre]) {
    return 'Cultivo no encontrado en la base de datos offline.';
  }
  const req = data.requerimientos[cultivoNombre];
  // Lógica de cálculo (Extracción nutricional)
  const nTotal = req.N * toneladasEsperadas;
  const pTotal = req.P * toneladasEsperadas;
  const kTotal = req.K * toneladasEsperadas;
  // Formatear resultado para el usuario
  return `📊 PLAN DE FERTILIZACIÓN (Estimado)\n----------------------------------\nCultivo: ${req.nombre}\nMeta de Producción: ${toneladasEsperadas} Toneladas\n\nNecesidad total de Nutrientes:\n- Nitrógeno (N): ${nTotal.toFixed(2)} kg\n- Fósforo (P): ${pTotal.toFixed(2)} kg\n- Potasio (K): ${kTotal.toFixed(2)} kg\n\nNota: Consulte con un técnico para ajustar según su análisis de suelo.`;
}

// Ejemplo de uso:
// import { calcularFertilizacion } from './asistente_logic.js';
// const resultado = calcularFertilizacion('naranja', 10, data_cultivos_json);
// console.log(resultado);
