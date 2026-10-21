// modules/asistente_tecnico/AsistenteTecnicoModule.jsx
// Contenedor del M2: navegación entre las 4 funcionalidades conectadas
// al backend (calculadora, lunar, cronograma, geodesia).

import React, { useState } from "react";
import CalculadoraAgricolaPage from "./pages/CalculadoraAgricolaPage";
import CalendarioLunarPage from "./pages/CalendarioLunarPage";
import CronogramaSiembraPage from "./pages/CronogramaSiembraPage";
import GeodesiaPage from "./pages/GeodesiaPage";

const SECCIONES = [
  { id: "calculadora", nombre: "🧮 Calculadora Agrícola", componente: CalculadoraAgricolaPage },
  { id: "lunar", nombre: "🌙 Calendario Lunar", componente: CalendarioLunarPage },
  { id: "cronograma", nombre: "📅 Cronograma de Siembra", componente: CronogramaSiembraPage },
  { id: "geodesia", nombre: "🗺️ Geodesia y GPS", componente: GeodesiaPage },
];

export default function AsistenteTecnicoModule() {
  const [seccion, setSeccion] = useState("calculadora");
  const Pagina = SECCIONES.find((s) => s.id === seccion).componente;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-bold mb-5 max-w-3xl">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`flex-1 py-2 px-3 rounded transition whitespace-nowrap ${
              seccion === s.id
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>
      <Pagina />
    </div>
  );
}
