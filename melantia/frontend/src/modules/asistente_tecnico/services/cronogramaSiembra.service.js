// modules/asistente_tecnico/services/cronogramaSiembra.service.js
// Item 4 — Cronograma de Siembra (endpoints públicos, con caché offline).
// El backend normaliza tildes: "maiz" encuentra "Maíz".

import { cachedRequest } from "../../../shared/offline/offlineRequest";

const BASE = "/v1/asistente/cronograma";

// Cultivos con cronograma disponible → [CultivoCronogramaInfo]
export const listarCultivos = () =>
  cachedRequest({ url: `${BASE}/cultivos` });

// {cultivo, fecha_siembra: "YYYY-MM-DD"} → CronogramaResponse
// 404 → el cultivo no existe en el conocimiento legacy.
export const generarCronograma = (cultivo, fecha_siembra) =>
  cachedRequest({
    method: "post",
    url: BASE,
    payload: { cultivo, fecha_siembra },
  });
