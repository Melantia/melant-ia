// modules/asistente_tecnico/pages/CronogramaSiembraPage.jsx
// Item 4 — Cronograma de Siembra: cultivo + fecha → calendario de labores.

import React, { useEffect, useState } from "react";
import * as svc from "../services/cronogramaSiembra.service";
import { Boton, ErrorBox, CacheBadge } from "../components/ui";

export default function CronogramaSiembraPage() {
  const [cultivos, setCultivos] = useState([]);
  const [cultivo, setCultivo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cronograma, setCronograma] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    svc
      .listarCultivos()
      .then(setCultivos)
      .catch(setError);
  }, []);

  const generar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      setCronograma(await svc.generarCronograma(cultivo, fecha));
    } catch (err) {
      setError(err);
      setCronograma(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-1">📅 Cronograma de Siembra</h3>
      <p className="text-xs text-gray-400 mb-4">
        Calendario de labores del cultivo desde la fecha de siembra.
      </p>

      <form onSubmit={generar} className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Cultivo
          </label>
          <select
            value={cultivo}
            onChange={(e) => setCultivo(e.target.value)}
            required
            className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-green-600 font-mono"
          >
            <option value="">— seleccionar —</option>
            {cultivos.map((c) => (
              <option key={c.cultivo} value={c.cultivo}>
                {c.cultivo}
                {c.ciclo_total_dias ? ` (${c.ciclo_total_dias}d)` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Fecha de siembra
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 font-mono outline-none focus:border-green-600"
          />
        </div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Generando..." : "Generar cronograma"}
        </Boton>
      </form>

      <ErrorBox error={error} />
      <CacheBadge data={cultivos} />
      <CacheBadge data={cronograma} />

      {cronograma && (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm font-bold text-white">
              {cronograma.cultivo}
              {cronograma.categoria && (
                <span className="text-[10px] text-gray-400 font-mono ml-2">
                  {cronograma.categoria}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-gray-400">
              <span>Siembra: {cronograma.fecha_siembra}</span>
              {cronograma.ciclo_total_dias && (
                <span>Ciclo: {cronograma.ciclo_total_dias} días</span>
              )}
              {cronograma.siembra_directa !== null && (
                <span>
                  {cronograma.siembra_directa
                    ? "Siembra directa"
                    : "Requiere trasplante"}
                </span>
              )}
              {cronograma.fase_lunar_ideal && (
                <span>Fase ideal: {cronograma.fase_lunar_ideal}</span>
              )}
            </div>
            <p className="text-xs text-green-300 mt-2">
              {cronograma.recomendacion_lunar}
            </p>
          </div>

          <div className="space-y-2">
            {cronograma.eventos.map((ev, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex gap-4"
              >
                <div className="text-[10px] font-mono text-gray-400 w-36 shrink-0">
                  {ev.fecha_inicio} → {ev.fecha_fin}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{ev.tarea}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ev.instruccion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
