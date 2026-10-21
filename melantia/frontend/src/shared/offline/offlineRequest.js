// src/shared/offline/offlineRequest.js
// Envoltura de apiClient con caché offline.
//
//   online  → respuesta fresca (se guarda en caché)
//   offline → última respuesta conocida de ese endpoint+payload
//             (marcada con `_fromCache` no enumerable)
//   error HTTP real (4xx/5xx) → ApiError normal, sin servir caché

import apiClient from "../api/apiClient";
import { toApiError } from "../api/errors";
import { cacheKey, getCached, setCached } from "./cache";

function marcarCache(data) {
  // No enumerable: no aparece al iterar/renderizar el resultado.
  Object.defineProperty(data, "_fromCache", {
    value: true,
    enumerable: false,
  });
  return data;
}

export async function cachedRequest({ method = "get", url, params, payload }) {
  const key = cacheKey(url + (params ? "?" + new URLSearchParams(params) : ""), payload);
  try {
    const { data } = await apiClient.request({
      method,
      url,
      params,
      data: payload,
    });
    setCached(key, data);
    return data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.offline) {
      const cached = getCached(key);
      if (cached) return marcarCache(cached.data);
    }
    throw apiErr;
  }
}
