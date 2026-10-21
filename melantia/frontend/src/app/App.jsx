// src/app/App.jsx
// Punto de entrada central: proveedor de sesión + enrutador.

import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { routesConfig } from "./routes";

const router = createBrowserRouter(routesConfig);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
