// modules/asistente_tecnico/components/ui.jsx
// Componentes pequeños reutilizables del módulo.

import React from "react";

export function Campo({ label, ...props }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-green-600 font-mono"
      />
    </div>
  );
}

export function Boton({ children, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
    >
      {children}
    </button>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2 font-mono">
      {error.offline
        ? "Sin conexión con el servidor MELANTIA."
        : `${error.code ? `[${error.code}] ` : ""}${error.message}`}
    </div>
  );
}

// Indicador visible cuando la respuesta proviene de la caché
// offline (marca `_fromCache` puesta por offlineRequest).
export function CacheBadge({ data }) {
  if (!data?._fromCache) return null;
  return (
    <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
      <span>📦</span> Sin conexión — última respuesta guardada en caché
    </p>
  );
}

// Renderiza el resultado del API como pares clave/valor,
// sin asumir una forma concreta del response.
export function ResultadoKV({ data }) {
  if (!data) return null;
  return (
    <div className="bg-green-950/40 border border-green-800 rounded-lg p-3 space-y-1">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 text-xs">
          <span className="text-gray-400 font-mono">{k}</span>
          <span className="text-green-300 font-bold font-mono text-right">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}
