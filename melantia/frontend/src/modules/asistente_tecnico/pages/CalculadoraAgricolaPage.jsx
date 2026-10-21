// modules/asistente_tecnico/pages/CalculadoraAgricolaPage.jsx
// Item 2 — Calculadora Agrícola conectada a
// /api/v1/asistente/calculadora/* (9 operaciones reales).

import React, { useEffect, useState } from "react";
import * as svc from "../services/calculadora.service";
import { Campo, Boton, ErrorBox, ResultadoKV, CacheBadge } from "../components/ui";

const NUM = { type: "number", step: "any", required: true };

// Definición por endpoint: campos y función del servicio.
const CALCULADORAS = [
  {
    id: "densidad",
    nombre: "🌱 Densidad de siembra",
    campos: [
      { key: "area_ha", label: "Área (ha)", ...NUM },
      { key: "distancia_filas_m", label: "Dist. filas (m)", ...NUM },
      { key: "distancia_plantas_m", label: "Dist. plantas (m)", ...NUM },
      { key: "germinacion_pct", label: "Germinación (%)", ...NUM, defaultValue: 100 },
      { key: "pureza_pct", label: "Pureza (%)", ...NUM, defaultValue: 100 },
    ],
    run: (f) => svc.calcularDensidad(f),
  },
  {
    id: "dosis",
    nombre: "🧪 Dosis por hectárea",
    campos: [
      { key: "dosis_por_ha", label: "Dosis/ha (L o kg)", ...NUM },
      { key: "area_ha", label: "Área (ha)", ...NUM },
      { key: "volumen_tanque_l", label: "Volumen tanque (L)", ...NUM },
    ],
    run: (f) => svc.calcularDosis(f),
  },
  {
    id: "dosis-frasco",
    nombre: "🧴 Bomba → frasco 500 ml",
    campos: [{ key: "dosis_bomba_ml", label: "Dosis bomba 20L (ml)", ...NUM }],
    run: (f) => svc.calcularDosisFrasco(f),
  },
  {
    id: "ugm",
    nombre: "🐄 UGM",
    campos: [
      { key: "vacas", label: "Vacas", ...NUM, defaultValue: 0 },
      { key: "toros", label: "Toros", ...NUM, defaultValue: 0 },
      { key: "terneros", label: "Terneros", ...NUM, defaultValue: 0 },
    ],
    run: (f) => svc.calcularUGM(f),
  },
  {
    id: "gdp",
    nombre: "⚖️ Ganancia diaria de peso",
    campos: [
      { key: "peso_inicial_kg", label: "Peso inicial (kg)", ...NUM },
      { key: "peso_final_kg", label: "Peso final (kg)", ...NUM },
      { key: "dias", label: "Días", ...NUM },
    ],
    run: (f) => svc.calcularGDP(f),
  },
  {
    id: "carbono",
    nombre: "🌳 Carbono (Smalian + CO₂)",
    campos: [
      { key: "dap1_cm", label: "DAP 1 (cm)", ...NUM },
      { key: "dap2_cm", label: "DAP 2 (cm)", ...NUM },
      { key: "longitud_m", label: "Longitud fuste (m)", ...NUM },
      { key: "factor_bef", label: "Factor BEF", ...NUM, defaultValue: 1.3 },
      { key: "fraccion_carbono", label: "Fracción C", ...NUM, defaultValue: 0.5 },
    ],
    run: (f) => svc.calcularCarbono(f),
  },
  {
    id: "riego",
    nombre: "💧 Recomendación de riego",
    campos: [{ key: "agua_util_pct", label: "Agua útil suelo (%)", ...NUM }],
    run: (f) => svc.recomendarRiego(f),
  },
  {
    id: "fertilidad",
    nombre: "🪱 Fertilidad de suelo (INIAP)",
    campos: [
      { key: "materia_organica_pct", label: "Materia orgánica (%)", ...NUM, required: false },
      { key: "nitrogeno_mg_kg", label: "N (mg/kg)", ...NUM, required: false },
      { key: "fosforo_mg_kg", label: "P (mg/kg)", ...NUM, required: false },
      { key: "potasio_cmol_kg", label: "K (cmol/kg)", ...NUM, required: false },
      { key: "calcio_cmol_kg", label: "Ca (cmol/kg)", ...NUM, required: false },
      { key: "magnesio_cmol_kg", label: "Mg (cmol/kg)", ...NUM, required: false },
      { key: "ph_suelo", label: "pH suelo", ...NUM, required: false },
    ],
    run: (f) => svc.evaluarFertilidad(f),
  },
];

export default function CalculadoraAgricolaPage() {
  const [calcId, setCalcId] = useState("densidad");
  const [cultivos, setCultivos] = useState([]);
  const [form, setForm] = useState({});
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const calc = CALCULADORAS.find((c) => c.id === calcId);

  useEffect(() => {
    svc
      .listarCultivos()
      .then(setCultivos)
      .catch(() => setCultivos([])); // el listado es auxiliar, no bloquea
  }, []);

  const cambiarCalc = (id) => {
    setCalcId(id);
    setForm({});
    setResultado(null);
    setError(null);
  };

  const setCampo = (key, valor) =>
    setForm((f) => ({ ...f, [key]: valor === "" ? "" : Number(valor) }));

  // Selector de cultivo: precarga el marco de siembra (densidad).
  const elegirCultivo = (id) => {
    const c = cultivos.find((x) => x.id === id);
    if (c && calcId === "densidad") {
      setForm((f) => ({
        ...f,
        cultivo: c.id,
        distancia_filas_m: c.distancia_filas_m,
        distancia_plantas_m: c.distancia_plantas_m,
      }));
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      // Campos opcionales vacíos → undefined (el backend los omite).
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      );
      setResultado(await calc.run(payload));
    } catch (err) {
      setError(err);
      setResultado(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-1">🧮 Calculadora Agrícola</h3>
      <p className="text-xs text-gray-400 mb-4">
        Dosificación, densidad y aforos — backend MELANTIA.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {CALCULADORAS.map((c) => (
          <button
            key={c.id}
            onClick={() => cambiarCalc(c.id)}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
              calcId === c.id
                ? "bg-green-600 border-green-500 text-white"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {calcId === "densidad" && cultivos.length > 0 && (
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Cultivo (precarga marco de siembra)
          </label>
          <select
            onChange={(e) => elegirCultivo(e.target.value)}
            defaultValue=""
            className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-green-600 font-mono"
          >
            <option value="">— seleccionar —</option>
            {cultivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {calc.campos.map((c) => (
            <Campo
              key={c.key}
              label={c.label}
              value={form[c.key] ?? c.defaultValue ?? ""}
              onChange={(e) => setCampo(c.key, e.target.value)}
              type={c.type}
              step={c.step}
              required={c.required !== false}
            />
          ))}
        </div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Calculando..." : "Calcular"}
        </Boton>
      </form>

      <div className="mt-4 space-y-3">
        <ErrorBox error={error} />
        <CacheBadge data={resultado} />
        <ResultadoKV data={resultado} />
      </div>
    </div>
  );
}
