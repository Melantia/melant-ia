// Sincronización automática F1f — Semana 2 MVP:
// Wi-Fi → sync automática al recuperar conexión.
// Datos móviles → no automática; el usuario confirma (gasto de datos).
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type * as SQLite from 'expo-sqlite';
import { abrirDb, recuperarColaTrasReinicio } from '../services/db';
import { contarPendientes } from '../services/queue';
import { sincronizarTodo } from '../services/sync';

type SyncState = {
  db: SQLite.SQLiteDatabase | null;
  conectado: boolean;
  tipoRed: string | null;          // 'wifi' | 'cellular' | ...
  sincronizando: boolean;
  pendientes: number;
  ultimoError: string | null;
  sincronizar: () => Promise<void>;
};

const Ctx = createContext<SyncState>({
  db: null, conectado: false, tipoRed: null,
  sincronizando: false, pendientes: 0, ultimoError: null,
  sincronizar: async () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [conectado, setConectado] = useState(false);
  const [tipoRed, setTipoRed] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const [ultimoError, setUltimoError] = useState<string | null>(null);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const ocupado = useRef(false);

  const sincronizar = async () => {
    const d = dbRef.current;
    if (!d || ocupado.current) return;
    ocupado.current = true;
    setSincronizando(true);
    setUltimoError(null);
    try {
      await sincronizarTodo(d);
    } catch (e) {
      setUltimoError(e instanceof Error ? e.message : 'Sin conexión');
    } finally {
      ocupado.current = false;
      setSincronizando(false);
      setPendientes(await contarPendientes(d));
    }
  };

  useEffect(() => {
    (async () => {
      const d = await abrirDb();
      await recuperarColaTrasReinicio(d);
      dbRef.current = d;
      setDb(d);
      setPendientes(await contarPendientes(d));
    })();
  }, []);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true;
      setConectado(online);
      setTipoRed(state.type);
      // Auto-sync solo con Wi-Fi al (re)conectar (Semana 2).
      if (online && state.type === 'wifi' && dbRef.current) {
        void sincronizar();
      }
    });
    return () => sub();
  }, []);

  return (
    <Ctx.Provider value={{
      db, conectado, tipoRed, sincronizando,
      pendientes, ultimoError, sincronizar,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSync = () => useContext(Ctx);
