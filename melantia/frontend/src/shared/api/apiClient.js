// src/shared/api/apiClient.js
// Cliente HTTP único de MELANTIA. Apunta al backend FastAPI
// (VITE_API_URL), no a Supabase. El token se lee de auth.storage
// — la ÚNICA fuente de sesión de la app.

import axios from "axios";
import { getToken, clearSession } from "../auth/auth.storage";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 en cualquier endpoint autenticado → la sesión ya no es válida.
    if (error.response?.status === 401) clearSession();
    return Promise.reject(error);
  },
);

export default apiClient;
