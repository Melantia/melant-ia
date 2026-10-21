// src/shared/api/errors.js
// Normaliza errores de la API a un único ApiError.
//
// El backend devuelve DOS formas de error:
//   - HTTPException de FastAPI → { "detail": "mensaje" | [{msg,loc,...}] }
//   - MelantiaException → { "error": code, "message": msg, "status_code", "details" }
//   - fallo de red → sin response

import axios from "axios";

export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 si no hubo respuesta (offline)
    this.code = code;
    this.details = details;
    this.offline = status === 0;
  }
}

export function toApiError(err) {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new ApiError(0, "NETWORK_ERROR", "Sin conexión con el servidor MELANTIA.");
    }
    const status = err.response.status;
    const body = err.response.data;

    if (body && typeof body === "object") {
      if (typeof body.detail === "string") {
        return new ApiError(status, "HTTP_ERROR", body.detail);
      }
      if (Array.isArray(body.detail)) {
        const msg = body.detail
          .map((d) => `${(d.loc || []).join(".")}: ${d.msg}`)
          .join("; ");
        return new ApiError(status, "VALIDATION_ERROR", msg, body.detail);
      }
      if (body.error) {
        return new ApiError(status, body.error, body.message || body.error, body.details);
      }
    }
    return new ApiError(status, "HTTP_ERROR", err.message);
  }
  return new ApiError(0, "UNKNOWN_ERROR", String(err));
}
