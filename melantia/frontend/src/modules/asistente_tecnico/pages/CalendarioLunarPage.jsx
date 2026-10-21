// modules/asistente_tecnico/pages/CalendarioLunarPage.jsx
// Item 3 — Calendario Lunar: fase de una fecha + vista mensual.

import React, { useEffect, useState } from "react";
import * as svc from "../services/calendarioLunar.service";
import { Boton, ErrorBox, CacheBadge } from "../components/ui";

const hoy = new Date();

export default function CalendarioLunarPage() {
  const [fecha, setFecha] = useState(hoy.toISOString().slice(0, 10));
  const [fase, setFase] = useState(null);
  const [mes, setMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const [dias, setDias] = useState([]);
  const [error, setError] = useState(null);

  const consultar = async () => {
    setError(null);
    try {
      setFase(await svc.faseLunar(fecha));
    } catch (err) {
      setError(err);
    }
  };

  const cargarMes = async (anio, m) => {
    setMes({ anio, mes: m });
    setError(null);
    try {
      setDias(await svc.fasesMes(anio, m));
    } catch (err) {
      setError(err);
      setDias([]);
    }
  };

  useEffect(() => {
    // Carga inicial: fase de hoy + mes actual (valores fijos, sin deps).
    svc
      .faseLunar(new Date().toISOString().slice(0, 10))
      .then(setFase)
      .catch(setError);
    svc
      .fasesMes(hoy.getFullYear(), hoy.getMonth() + 1)
      .then(setDias)
      .catch((e) => {
        setError(e);
        setDias([]);
      });
  }, []);

  const cambiarMes = (delta) => {
    const d = new Date(mes.anio, mes.mes - 1 + delta, 1);
    cargarMes(d.getFullYear(), d.getMonth() + 1);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-4">🌙 Calendario Lunar</h3>

      {/* Fase de una fecha */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 font-mono outline-none focus:border-green-600"
            />
          </div>
          <Boton onClick={consultar}>Consultar fase</Boton>
        </div>
        {fase && (
          <div className="mt-4 flex items-start gap-4">
            <span className="text-4xl">{fase.icono}</span>
            <div>
              <p className="text-sm font-bold text-white">
                {fase.fase}{" "}
                <span className="text-[10px] text-gray-400 font-mono">
                  (edad lunar: {fase.edad_lunar_dias} días)
                </span>
              </p>
              <p className="text-xs text-green-300 mt-1">{fase.recomendacion}</p>
              {fase.descripcion && (
                <p className="text-xs text-gray-400 mt-1">{fase.descripcion}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vista mensual */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <Boton onClick={() => cambiarMes(-1)}>←</Boton>
          <p className="text-sm font-bold text-white font-mono">
            {String(mes.mes).padStart(2, "0")} / {mes.anio}
          </p>
          <Boton onClick={() => cambiarMes(1)}>→</Boton>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((d) => (
            <div
              key={d.fecha}
              title={`${d.fecha} — ${d.fase}: ${d.recomendacion}`}
              onClick={() => {
                setFecha(d.fecha);
                setFase(d);
              }}
              className="bg-gray-950 border border-gray-800 rounded p-1.5 text-center cursor-pointer hover:border-green-600 transition"
            >
              <p className="text-[10px] text-gray-500 font-mono">
                {Number(d.fecha.slice(-2))}
              </p>
              <p className="text-base leading-none">{d.icono}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ErrorBox error={error} />
        <CacheBadge data={fase} />
        <CacheBadge data={dias} />
      </div>
    </div>
  );
}
