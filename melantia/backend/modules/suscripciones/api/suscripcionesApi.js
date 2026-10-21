const API_BASE_URL = "http://localhost:8000/suscripciones";

export async function registrarUsuario(datos) {
  const res = await fetch(`${API_BASE_URL}/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error en registro");
  }
  return res.json();
}

export async function renovarSuscripcion(datos) {
  const res = await fetch(`${API_BASE_URL}/renovacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error en renovación");
  }
  return res.json();
}
