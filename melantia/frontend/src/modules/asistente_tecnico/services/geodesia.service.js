// modules/asistente_tecnico/services/geodesia.service.js
// Items 13/14 — Levantamiento de Lote y GPS (con caché offline:
// un levantamiento ya calculado se reusa sin red).

import { cachedRequest } from "../../../shared/offline/offlineRequest";

const BASE = "/v1/asistente/geodesia";
const post = (url, payload) => cachedRequest({ method: "post", url, payload });

// PuntoGeo = {lat, lon} — WGS84 grados decimales.
// {origen, destino} → {distancia_m, distancia_km} (Haversine)
export const distancia = (origen, destino) =>
  post(`${BASE}/distancia`, { origen, destino });

// puntos: [PuntoGeo] mínimo 3 → {area_m2, area_ha, perimetro_m}
export const areaPoligono = (puntos) =>
  post(`${BASE}/poligono`, { puntos });

// {punto: {lat, lon}} → {este_m, norte_m, zona_utm} (zona 17S Ecuador)
export const aUTM = (punto) => post(`${BASE}/utm`, { punto });
