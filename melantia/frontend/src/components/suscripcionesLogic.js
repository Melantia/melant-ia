// src/modules/suscripciones/logic/suscripcionesLogic.js

const planesMock = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 10,
    descripcion: 'Plan básico con funciones limitadas',
  },
  {
    id: 'standard',
    nombre: 'Standard',
    precio: 20,
    descripcion: 'Plan estándar para usuarios promedio',
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 30,
    descripcion: 'Plan completo con todas las funciones',
  },
];

export function obtenerPlanes() {
  // Simulamos obtener planes, podría ser llamada a backend en futuro
  return planesMock;
}

export function calcularCostoTotal(selectedPlanId, meses) {
  const plan = planesMock.find((p) => p.id === selectedPlanId);
  if (!plan) return 0;
  return plan.precio * meses;
}
