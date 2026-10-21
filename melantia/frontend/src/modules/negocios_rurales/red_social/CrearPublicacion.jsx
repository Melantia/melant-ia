import React, { useState } from "react";

export default function CrearPublicacion({ onPublicar }) {
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState("social");

  const tiposDisponibles = [
    { id: "social", label: "🌱 Social", color: "#4a5568" },
    { id: "oferta", label: "💰 Oferta Comercial", color: "#2f855a" },
    { id: "demanda", label: "🔍 Demanda Compra", color: "#2b6cb0" },
    { id: "pregunta", label: "❓ Pregunta Técnica", color: "#b7791f" },
    { id: "conocimiento", label: "💡 Conocimiento", color: "#6b46c1" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    onPublicar({
      id: Date.now(),
      autor_id: 999,
      autor_nombre: "Productor Local (Tú)",
      tipo_publicacion: tipo,
      contenido: contenido,
      provincia: "Manabí",
      canton: "Portoviejo",
      fecha_creacion: new Date().toISOString(),
      likes: 0,
    });
    setContenido("");
  };

  return (
    <div
      style={{
        backgroundColor: "#f7fafc",
        padding: "15px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        marginBottom: "20px",
      }}
    >
      <form onSubmit={handleSubmit}>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="¿Qué está pasando en tu finca hoy?..."
          style={{
            width: "100%",
            height: "80px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e0",
            resize: "none",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#4a5568",
                marginRight: "10px",
              }}
            >
              Tipo:
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                padding: "5px",
                borderRadius: "4px",
                border: "1px solid #cbd5e0",
                fontSize: "12px",
              }}
            >
              {tiposDisponibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "#1b4332",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Publicar
          </button>
        </div>
      </form>
    </div>
  );
}
