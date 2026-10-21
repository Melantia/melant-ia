// src/shared/auth/auth.service.js
// Servicio de autenticación contra el backend FastAPI real.
// Rutas verificadas: POST /api/auth/login, POST /api/auth/registro,
// GET /api/auth/me.

import apiClient from "../api/apiClient";
import { toApiError } from "../api/errors";
import { saveSession, saveUser, clearSession } from "./auth.storage";

// login → TokenResponse → guardar sesión → GET /me → usuario
export async function login(cedula_ruc, password) {
  try {
    const { data } = await apiClient.post("/auth/login", {
      cedula_ruc,
      password,
    });
    saveSession(data.access_token);
    const usuario = await me();
    return { token: data.access_token, usuario };
  } catch (err) {
    throw toApiError(err);
  }
}

// datos = {nombre, cedula_ruc, password, sector_comunidad,
//          contacto?, provincia_id?, canton_id?, parroquia_id?}
export async function registrar(datos) {
  try {
    const { data } = await apiClient.post("/auth/registro", datos);
    saveSession(data.access_token);
    const usuario = await me();
    return { token: data.access_token, usuario };
  } catch (err) {
    throw toApiError(err);
  }
}

// GET /api/auth/me → UsuarioResponse; 401 → sesión inválida
export async function me() {
  try {
    const { data } = await apiClient.get("/auth/me");
    saveUser(data);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export function logout() {
  clearSession();
}
