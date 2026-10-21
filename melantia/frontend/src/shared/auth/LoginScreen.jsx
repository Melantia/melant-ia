// src/shared/auth/LoginScreen.jsx
// Pantalla de acceso mínima: cédula/RUC + contraseña contra
// POST /api/auth/login del backend MELANTIA.

import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth.context";

export default function LoginScreen() {
  const { login, autenticado } = useAuth();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(cedula.trim(), password);
    } catch (err) {
      setError(err.offline ? "Sin conexión con el servidor." : err.message);
    } finally {
      setEnviando(false);
    }
  };

  // Sesión ya activa (login exitoso o recarga autenticada) → al panel.
  if (autenticado) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 items-center justify-center">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-black text-green-500 tracking-wider font-mono text-center">
          MELANTIA
        </h1>
        <p className="text-[10px] text-gray-400 font-semibold tracking-tight uppercase text-center mt-1 mb-8">
          Acceso con cédula/RUC del productor
        </p>

        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Cédula / RUC
        </label>
        <input
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          autoComplete="username"
          required
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-green-600 mb-4 font-mono"
          placeholder="1712345678"
        />

        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-green-600 mb-6"
        />

        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2 mb-4 font-mono">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold text-sm py-2.5 rounded-lg transition"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-[10px] text-gray-500 font-mono text-center mt-6 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Modo Local-First — backend FastAPI
        </p>
      </form>
    </div>
  );
}
