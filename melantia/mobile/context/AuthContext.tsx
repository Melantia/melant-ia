// Proveedor de sesión F1b — envuelve la app en el root layout.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login, logout, sesionGuardada, Sesion } from '../services/auth';

type AuthState = {
  sesion: Sesion | null;
  cargando: boolean;
  entrar: (cedula: string, pass: string) => Promise<void>;
  salir: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  sesion: null, cargando: true,
  entrar: async () => {}, salir: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    sesionGuardada().then((s) => { setSesion(s); setCargando(false); });
  }, []);

  const entrar = async (cedula: string, pass: string) => {
    setSesion(await login(cedula, pass));
  };
  const salir = async () => { await logout(); setSesion(null); };

  return (
    <Ctx.Provider value={{ sesion, cargando, entrar, salir }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
