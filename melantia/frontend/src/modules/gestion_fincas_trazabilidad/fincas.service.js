// frontend/src/modules/gestion_fincas_trazabilidad/fincas.service.js
// Servicio del Módulo 3 contra la API real:
//   /api/v1/fincas (CRUD fincas + lotes)
//   /api/v1/geografia (catálogo DPA/INEC para los selects)
// La sesión viaja en el Bearer que apiClient inyecta desde
// auth.storage — el backend jamás acepta usuario_id por body.

import apiClient from "../../shared/api/apiClient";
import { toApiError } from "../../shared/api/errors";

// ---------- Fincas ----------

export async function listarFincas() {
  try {
    const { data } = await apiClient.get("/v1/fincas");
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// datos = {nombre, provincia_id?, canton_id?, parroquia_id?,
//          coordenadas_gps?, ciiu_id?, tipo_pyme?}
export async function crearFinca(datos) {
  try {
    const { data } = await apiClient.post("/v1/fincas", datos);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function obtenerFinca(fincaId) {
  try {
    const { data } = await apiClient.get(`/v1/fincas/${fincaId}`);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// Solo campos permitidos; el backend ignora el resto (extra=forbid → 422)
export async function actualizarFinca(fincaId, cambios) {
  try {
    const { data } = await apiClient.patch(`/v1/fincas/${fincaId}`, cambios);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------- Lotes ----------

export async function listarLotes(fincaId) {
  try {
    const { data } = await apiClient.get(`/v1/fincas/${fincaId}/lotes`);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// datos = {nombre_lote, cultivo_principal?, variedad?, fecha_siembra?,
//          area_metros_cuadrados?, estado_salud_lote?}
export async function crearLote(fincaId, datos) {
  try {
    const { data } = await apiClient.post(
      `/v1/fincas/${fincaId}/lotes`,
      datos,
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function actualizarLote(fincaId, loteId, cambios) {
  try {
    const { data } = await apiClient.patch(
      `/v1/fincas/${fincaId}/lotes/${loteId}`,
      cambios,
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------- Catálogo geográfico (DPA/INEC) ----------

export async function listarProvincias() {
  try {
    const { data } = await apiClient.get("/v1/geografia/provincias");
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function listarCantones(provinciaId) {
  try {
    const { data } = await apiClient.get("/v1/geografia/cantones", {
      params: { provincia_id: provinciaId },
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function listarParroquias(cantonId) {
  try {
    const { data } = await apiClient.get("/v1/geografia/parroquias", {
      params: { canton_id: cantonId },
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}
