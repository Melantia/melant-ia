// src/shared/auth/auth.context.jsx
// Contexto de autenticación. Al montar: si hay token persistido,
// se verifica contra GET /api/auth/me (sesión stale → limpia).

import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "./auth.service";
import { loadSession, loadUser, getToken } from "./auth.storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCargando(false);
      return;
    }
    authService
      .me()
      .then((u) => setUsuario(u))
      .catch((err) => {
        if (err?.status === 401) {
          setUsuario(null);
        } else {
          setUsuario(loadUser());
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (cedula_ruc, password) => {
    const { usuario } = await authService.login(cedula_ruc, password);
    setUsuario(usuario);
  };

  const registrar = async (datos) => {
    const { usuario } = await authService.registrar(datos);
    setUsuario(usuario);
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
  };

  const value = {
    usuario,
    autenticado: usuario !== null,
    cargando,
    login,
    registrar,
    logout,
    session: loadSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
