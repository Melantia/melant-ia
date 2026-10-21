import React, { useState } from "react";
import RedSocialComercial from "./red_social/RedSocialComercial";

export default function NegociosRurales() {
  const [subSeccion, setSubSeccion] = useState("red_social");

  const pestañas = [
    { id: "red_social", nombre: "📱 Red Social Rural", activa: true },
    { id: "marketplace", nombre: "🌾 Marketplace", activa: false },
    { id: "bolsa", nombre: "📊 Bolsa Agropecuaria", activa: false },
    { id: "oportunidades", nombre: "💡 Oportunidades", activa: false },
    { id: "ferias", nombre: "🎪 Ferias Virtuales", activa: false },
  ];

  return (
    <div>
      {/* MENÚ SUB-MODULAR */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        {pestañas.map((p) => (
          <button
            key={p.id}
            onClick={() =>
              p.activa || p.id === "red_social" ? setSubSeccion(p.id) : null
            }
            style={{
              padding: "10px 15px",
              border: "none",
              backgroundColor: subSeccion === p.id ? "#1b4332" : "transparent",
              color:
                subSeccion === p.id
                  ? "#fff"
                  : p.activa || p.id === "red_social"
                    ? "#4a5568"
                    : "#a0aec0",
              cursor:
                p.activa || p.id === "red_social" ? "pointer" : "not-allowed",
              borderRadius: "6px 6px 0 0",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {p.nombre}{" "}
            {!p.activa && p.id !== "red_social" && (
              <span
                style={{
                  fontSize: "9px",
                  backgroundColor: "#edf2f7",
                  color: "#718096",
                  padding: "2px 5px",
                  borderRadius: "4px",
                }}
              >
                Fase 2+
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div>{subSeccion === "red_social" && <RedSocialComercial />}</div>
    </div>
  );
}
