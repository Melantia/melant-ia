// frontend/src/modules/gestion_fincas_trazabilidad/GestionFincas.jsx
import React, { useState } from "react";

export default function GestionFincas() {
  const [fincas] = useState([
    {
      id: 1,
      nombre: "Hacienda La Prosperidad",
      lotes: 4,
      hatos: 3,
      tipo: "PYME Agropecuaria",
    },
  ]);

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-5xl mx-auto my-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            🚜 Gestión de Fincas y Trazabilidad Estricta
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Control integral para Pequeñas y Medianas Empresas (PYMES) del agro.
          </p>
        </div>
        <span className="bg-gray-950 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded font-mono">
          Asistente: Ángel
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL: GESTIÓN PYME / MULTI-LOTE */}
        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              🏢 Control Empresarial PYMES
            </h3>
            <button className="bg-green-600 text-[11px] font-bold px-2 py-1 rounded hover:bg-green-500 text-white transition">
              + Nueva Finca/Hacienda
            </button>
          </div>

          {fincas.map((f) => (
            <div
              key={f.id}
              className="p-3 bg-gray-900 border border-gray-800 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">{f.nombre}</span>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                  {f.tipo}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                <div>
                  🗺️{" "}
                  <span className="text-gray-200 font-semibold">
                    {f.lotes} Lotes
                  </span>{" "}
                  de Terreno
                </div>
                <div>
                  🐂{" "}
                  <span className="text-gray-200 font-semibold">
                    {f.hatos} Hatos
                  </span>{" "}
                  / Crianza
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PANEL: TRAZABILIDAD DE GRANJAS Y CULTIVOS */}
        <div className="space-y-4">
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-2">
              🌾 Trazabilidad Cultivos
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Historial de siembra, podas, aplicaciones fitosanitarias y cosecha
              por cada lote físico.
            </p>
            <button className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-xs font-semibold py-1.5 rounded transition">
              Ver Lotes Agrícolas
            </button>
          </div>

          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-2">
              🐖 Trazabilidad de Granjas
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Cerdos", "Bovinos", "Caballos", "Aves", "Cabras"].map(
                (animal) => (
                  <span
                    key={animal}
                    className="text-[9px] bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800"
                  >
                    {animal}
                  </span>
                ),
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Control individual o por lotes de pesaje, genealogía y movimientos
              de hatos.
            </p>
            <button className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-xs font-semibold py-1.5 rounded transition">
              Monitorear Hatos Livianos/Pesados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
