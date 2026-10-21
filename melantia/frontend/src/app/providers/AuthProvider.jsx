// src/app/providers/AuthProvider.jsx
// Punto de entrada del provider de autenticación para el árbol de app.
// La implementación real vive en shared/auth/auth.context.jsx — este
// archivo solo lo reexporta (una sola fuente de sesión/token).

export { AuthProvider, useAuth } from "../../shared/auth/auth.context";
