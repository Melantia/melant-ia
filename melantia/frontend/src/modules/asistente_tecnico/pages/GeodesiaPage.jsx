// modules/asistente_tecnico/pages/GeodesiaPage.jsx
// Items 13/14 — Levantamiento de Lote y GPS:
// distancia Haversine, área/perímetro de polígono, Lat/Lon → UTM 17S.

import React, { useState } from "react";
import * as svc from "../services/geodesia.service";
import { Boton, ErrorBox, ResultadoKV, CacheBadge } from "../components/ui";

const inputCls =
  "w-24 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 font-mono outline-none focus:border-green-600";

// Par lat/lon con botón "📍 GPS" (Geolocation API del dispositivo).
function PuntoInput({ label, punto, onChange }) {
  const capturarGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        onChange({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
    );
  };
  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </label>
        <div className="flex gap-1.5">
          <input
            type="number"
            step="any"
            placeholder="lat"
            value={punto.lat}
            onChange={(e) => onChange({ ...punto, lat: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            placeholder="lon"
            value={punto.lon}
            onChange={(e) => onChange({ ...punto, lon: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={capturarGPS}
        title="Usar ubicación del dispositivo"
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs hover:border-green-600"
      >
        📍
      </button>
    </div>
  );
}

const toPunto = (p) => ({ lat: Number(p.lat), lon: Number(p.lon) });

export default function GeodesiaPage() {
  const [herramienta, setHerramienta] = useState("distancia");
  const [origen, setOrigen] = useState({ lat: "", lon: "" });
  const [destino, setDestino] = useState({ lat: "", lon: "" });
  const [vertices, setVertices] = useState([
    { lat: "", lon: "" },
    { lat: "", lon: "" },
    { lat: "", lon: "" },
  ]);
  const [puntoUTM, setPuntoUTM] = useState({ lat: "", lon: "" });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const ejecutar = async (fn) => {
    setError(null);
    setEnviando(true);
    try {
      setResultado(await fn());
    } catch (err) {
      setError(err);
      setResultado(null);
    } finally {
      setEnviando(false);
    }
  };

  const setVertice = (i, v) =>
    setVertices((vs) => vs.map((x, j) => (j === i ? v : x)));

  const TABS = [
    { id: "distancia", nombre: "📏 Distancia" },
    { id: "poligono", nombre: "⬠ Área de lote" },
    { id: "utm", nombre: "🗺️ Lat/Lon → UTM" },
  ];

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-4">🗺️ Geodesia y GPS</h3>

      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setHerramienta(t.id);
              setResultado(null);
              setError(null);
            }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
              herramienta === t.id
                ? "bg-green-600 border-green-500 text-white"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {herramienta === "distancia" && (
        <div className="flex flex-wrap gap-4 items-end">
          <PuntoInput label="Origen" punto={origen} onChange={setOrigen} />
          <PuntoInput label="Destino" punto={destino} onChange={setDestino} />
          <Boton
            disabled={enviando}
            onClick={() => ejecutar(() => svc.distancia(toPunto(origen), toPunto(destino)))}
          >
            Medir distancia
          </Boton>
        </div>
      )}

      {herramienta === "poligono" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4">
            {vertices.map((v, i) => (
              <PuntoInput
                key={i}
                label={`Vértice ${i + 1}`}
                punto={v}
                onChange={(p) => setVertice(i, p)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVertices((vs) => [...vs, { lat: "", lon: "" }])}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-600"
            >
              + Vértice
            </button>
            {vertices.length > 3 && (
              <button
                type="button"
                onClick={() => setVertices((vs) => vs.slice(0, -1))}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-red-400 hover:border-red-700"
              >
                − Vértice
              </button>
            )}
            <Boton
              disabled={enviando}
              onClick={() =>
                ejecutar(() => svc.areaPoligono(vertices.map(toPunto)))
              }
            >
              Calcular área y perímetro
            </Boton>
          </div>
        </div>
      )}

      {herramienta === "utm" && (
        <div className="flex flex-wrap gap-4 items-end">
          <PuntoInput label="Punto" punto={puntoUTM} onChange={setPuntoUTM} />
          <Boton
            disabled={enviando}
            onClick={() => ejecutar(() => svc.aUTM(toPunto(puntoUTM)))}
          >
            Convertir a UTM
          </Boton>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <ErrorBox error={error} />
        <CacheBadge data={resultado} />
        <ResultadoKV data={resultado} />
      </div>
    </div>
  );
}
