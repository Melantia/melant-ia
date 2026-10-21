// src/shared/auth/auth.storage.js
// Único punto de persistencia de la sesión MELANTIA.
// Token y usuario viven bajo una sola clave; ningún módulo
// debe tocar localStorage/sessionStorage para autenticación.

const STORAGE_KEY = "melantia.auth";

// session = { token, usuario } — usuario se rellena tras GET /api/auth/me
export function saveSession(token, usuario = null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, usuario }));
}

export function saveUser(usuario) {
  const session = loadSession() || { token: null };
  session.usuario = usuario;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function loadUser() {
  return loadSession()?.usuario ?? null;
}

export function getToken() {
  return loadSession()?.token || null;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
