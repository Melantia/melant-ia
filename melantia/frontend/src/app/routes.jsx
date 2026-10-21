// src/app/routes.jsx
// Árbol de rutas global. Hoy levanta la infraestructura Core;
// los módulos de fases futuras se acoplan como sub-rutas bajo '/'.

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";

import LoginScreen from "../shared/auth/LoginScreen";
import AppShell from "./AppShell.jsx";

// Chasis protegido: exige sesión válida antes de montar contenido.
const AppLayout = () => {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex h-screen bg-gray-950 text-gray-500 items-center justify-center font-mono text-sm">
        Verificando sesión...
      </div>
    );
  }

  // Sin sesión → redirección forzada al login.
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // El layout real de la app (sidebar + módulos) es <AppShell/>;
  // aquí queda el punto de inyección <Outlet/> para las
  // sub-rutas de próximas fases (fincas, clima, TFLite...).
  return <Outlet />;
};

export const routesConfig = [
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <AppShell /> },
      // Ejemplo futuro: { path: 'fincas', element: <FincasModule /> }
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
