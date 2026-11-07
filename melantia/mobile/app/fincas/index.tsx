// Mis Fincas F1c — lista local (tabla espejo) + pendientes de sync.
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import type * as SQLite from 'expo-sqlite';
import { abrirDb, recuperarColaTrasReinicio } from '../../services/db';
import { contarPendientes, FincaLocal, listarFincas } from '../../services/queue';
import { pullCambios, pushPendientes } from '../../services/sync';

export default function FincasScreen() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [fincas, setFincas] = useState<FincaLocal[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = async (d: SQLite.SQLiteDatabase) => {
    setFincas(await listarFincas(d));
    setPendientes(await contarPendientes(d));
  };

  useEffect(() => {
    (async () => {
      const d = await abrirDb();
      await recuperarColaTrasReinicio(d);
      setDb(d);
      await cargar(d);
    })();
  }, []);

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-4">
      <View className="mb-4 rounded-xl bg-emerald-700 p-4">
        <Text className="text-sm font-semibold text-emerald-100">
          COLA DE SINCRONIZACIÓN
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          {pendientes} pendientes
        </Text>
        {mensaje && (
          <Text className="mt-1 text-xs text-emerald-100">{mensaje}</Text>
        )}
        <TouchableOpacity
          className={`mt-3 items-center rounded-lg py-3 ${sincronizando ? 'bg-emerald-600' : 'bg-white'}`}
          disabled={sincronizando}
          onPress={async () => {
            if (!db) return;
            setSincronizando(true);
            setMensaje(null);
            try {
              const r = await pushPendientes(db);
              const p = await pullCambios(db);
              setMensaje(
                `↑ ${r.aplicadas} enviadas · ↓ ${p.cambios} recibidas · conflictos ${r.conflictos} · fallos ${r.fallidas}`,
              );
            } catch (e) {
              setMensaje(e instanceof Error ? e.message : 'Sin conexión');
            } finally {
              setSincronizando(false);
              await cargar(db);
            }
          }}>
          <Text className="text-sm font-bold text-emerald-800">
            {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={fincas}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => {
          const d = JSON.parse(item.datos);
          return (
            <View className="mb-3 rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-base font-semibold text-slate-800">
                {d.nombre}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {item.sync_status === 'pending'
                  ? '⏳ Pendiente de sincronizar'
                  : '✓ Sincronizada'}
              </Text>
              <TouchableOpacity
                className="mt-3 self-start rounded-lg bg-emerald-100 px-3 py-2"
                onPress={() =>
                  router.push({ pathname: '/fincas/lote', params: { fincaId: item.id } })
                }>
                <Text className="text-sm font-semibold text-emerald-800">
                  + Lote
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-slate-400">
            Aún no registras fincas en este dispositivo.
          </Text>
        }
      />
      <TouchableOpacity
        className="mb-6 items-center rounded-xl bg-emerald-700 py-4"
        onPress={() => router.push('/fincas/nueva')}>
        <Text className="text-base font-bold text-white">+ Nueva finca</Text>
      </TouchableOpacity>
    </View>
  );
}
