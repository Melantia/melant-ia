// modules/asistente_tecnico/services/calculadora.service.js
// Item 2 — Calculadora Agrícola (endpoints públicos, sin JWT).
// Todas las llamadas pasan por caché offline: un cálculo ya
// realizado vuelve a responder sin red.

import { cachedRequest } from "../../../shared/offline/offlineRequest";

const BASE = "/v1/asistente/calculadora";
const get = (url, params) => cachedRequest({ url, params });
const post = (url, payload) => cachedRequest({ method: "post", url, payload });

export const listarCultivos = () => get(`${BASE}/cultivos`);

// {area_ha, distancia_filas_m, distancia_plantas_m, germinacion_pct, pureza_pct, cultivo?}
export const calcularDensidad = (d) => post(`${BASE}/densidad`, d);

// {dosis_por_ha, area_ha, volumen_tanque_l}
export const calcularDosis = (d) => post(`${BASE}/dosis`, d);

// {dosis_bomba_ml} → frasco 500 ml (bomba 20 L)
export const calcularDosisFrasco = (d) => post(`${BASE}/dosis-frasco`, d);

// {vacas, toros, terneros} → unidades ganado mayor
export const calcularUGM = (d) => post(`${BASE}/ugm`, d);

// {peso_inicial_kg, peso_final_kg, dias} → ganancia diaria de peso
export const calcularGDP = (d) => post(`${BASE}/gdp`, d);

// {dap1_cm, dap2_cm, longitud_m, factor_bef, fraccion_carbono} → Smalian + CO₂
export const calcularCarbono = (d) => post(`${BASE}/carbono`, d);

// {agua_util_pct} → nivel y recomendación de riego
export const recomendarRiego = (d) => post(`${BASE}/riego`, d);

// {materia_organica_pct?, nitrogeno_mg_kg?, fosforo_mg_kg?,
//  potasio_cmol_kg?, calcio_cmol_kg?, magnesio_cmol_kg?, ph_suelo?}
export const evaluarFertilidad = (d) => post(`${BASE}/fertilidad`, d);
