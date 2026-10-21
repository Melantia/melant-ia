import React from 'react';

export default function PlanCard({ plan, seleccionado, onSelect }) {
  return (
    <div
      onClick={() => onSelect(plan.id)}
      style={{
        border: seleccionado ? '2px solid #4CAF50' : '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        cursor: 'pointer',
        backgroundColor: seleccionado ? '#e8f5e9' : 'white',
      }}
    >
      <h3>{plan.nombre}</h3>
      <p>{plan.descripcion}</p>
      <p>
        <strong>Precio mensual: </strong>${plan.precio}
      </p>
    </div>
  );
}
