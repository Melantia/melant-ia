import React from "react";

export default function PublicacionCard({ pub, onLike }) {
  const getBadgeStyle = (tipo) => {
    const estilos = {
      social: { bg: "#edf2f7", text: "#4a5568", label: "SOCIAL" },
      oferta: { bg: "#c6f6d5", text: "#22543d", label: "OFERTA COMERCIAL" },
      demanda: { bg: "#bee3f8", text: "#2a4365", label: "DEMANDA" },
      pregunta: { bg: "#feebc8", text: "#744210", label: "PREGUNTA" },
      conocimiento: { bg: "#e9d8fd", text: "#44337a", label: "CONOCIMIENTO" },
    };
    return estilos[tipo] || estilos.social;
  };

  const badge = getBadgeStyle(pub.tipo_publicacion);

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "15px",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div>
          <strong style={{ color: "#2d3748", fontSize: "14px" }}>
            {pub.autor_nombre}
          </strong>
          <span
            style={{ fontSize: "11px", color: "#a0aec0", marginLeft: "8px" }}
          >
            📍 {pub.canton}, {pub.provincia}
          </span>
        </div>
        <span
          style={{
            backgroundColor: badge.bg,
            color: badge.text,
            fontSize: "10px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          {badge.label}
        </span>
      </div>

      <p
        style={{
          color: "#4a5568",
          fontSize: "14px",
          margin: "10px 0",
          lineHeight: "1.4",
        }}
      >
        {pub.contenido}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #f7fafc",
          paddingTop: "10px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={() => onLike(pub.id)}
          style={{
            background: "none",
            border: "none",
            color: "#40916c",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          👍 {pub.likes} Me gusta
        </button>

        {/* ACCIÓN CONTEXTUAL: INTEGRACIÓN DIRECTA CON OPORTUNIDADES COMERCIALES */}
        {(pub.tipo_publicacion === "oferta" ||
          pub.tipo_publicacion === "demanda") && (
          <button
            onClick={() =>
              alert(
                `Fase 2: Convirtiendo entrada de ${pub.autor_nombre} en una entidad comercial estructurada para el Marketplace/Bolsa.`,
              )
            }
            style={{
              backgroundColor: "#e2e8f0",
              border: "none",
              color: "#2d3748",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⚡ Convertir en Oportunidad
          </button>
        )}
      </div>
    </div>
  );
}
