// modules/asistente_tecnico/services/calendarioLunar.service.js
// Item 3 — Calendario Lunar (endpoints públicos, con caché offline).

import { cachedRequest } from "../../../shared/offline/offlineRequest";

const BASE = "/v1/asistente/lunar";

// Fase lunar de una fecha ("YYYY-MM-DD"); sin fecha → hoy.
export const faseLunar = (fecha = null) =>
  cachedRequest({ url: BASE, params: fecha ? { fecha } : undefined });

// Fase lunar de cada día del mes → [FaseLunarResponse]
export const fasesMes = (anio, mes) =>
  cachedRequest({ url: `${BASE}/mes`, params: { anio, mes } });
