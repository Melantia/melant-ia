import React, { useState } from "react";
import { registrarUsuario } from "../api/suscripcionesApi";

export default function RegistroSuscripcionForm() {
  const [form, setForm] = useState({
    identificador_unico: "",
    nombre: "",
    acepta_politica_privacidad: false,
    provincia: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function manejarCambio(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    try {
      const res = await registrarUsuario(form);
      setMensaje(res.mensaje);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={manejarEnvio} style={{ maxWidth: 400 }}>
      <h3>Registro Suscripción MELANTIA</h3>

      <label>ID único (Cédula o Teléfono):</label>
      <input
        type="text"
        name="identificador_unico"
        value={form.identificador_unico}
        onChange={manejarCambio}
        required
      />

      <label>Nombre Completo:</label>
      <input
        type="text"
        name="nombre"
        value={form.nombre}
        onChange={manejarCambio}
        required
      />

      <label>Provincia:</label>
      <input
        type="text"
        name="provincia"
        value={form.provincia}
        onChange={manejarCambio}
      />

      <label>
        <input
          type="checkbox"
          name="acepta_politica_privacidad"
          checked={form.acepta_politica_privacidad}
          onChange={manejarCambio}
          required
        />
        Acepto la política de privacidad
      </label>

      <button type="submit">Registrar</button>

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
