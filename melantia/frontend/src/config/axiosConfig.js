// src/config/axiosConfig.js
// Compatibilidad: el cliente HTTP único ahora vive en
// shared/api/apiClient.js (FastAPI, VITE_API_URL — no Supabase).

export { default } from "../shared/api/apiClient";
