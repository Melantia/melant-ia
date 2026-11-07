// Cola de sincronización F1c — invariante del diseño §3:
// captura de entidad + encolado de su op = UNA sola transacción.
// El id de entidad lo genera el cliente en el momento de captura.
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { Db } from './db';

export type FincaDatos = {
  nombre: string;
  provincia_id?: number; canton_id?: number; parroquia_id?: number;
  coordenadas_gps?: string; ciiu_id?: number; tipo_pyme?: string;
};

export type LoteDatos = {
  nombre_lote: string;
  cultivo_principal?: string; variedad?: string;
  fecha_siembra?: string;                      // ISO 'YYYY-MM-DD'
  area_metros_cuadrados?: number; estado_salud_lote?: string;
};

function limpiar<T extends object>(datos: T): Partial<T> {
  // payload = solo campos informados (los opcionales ausentes = null)
  return Object.fromEntries(
    Object.entries(datos).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}

export async function capturarFinca(
  db: Db, datos: FincaDatos,
): Promise<{ fincaId: string; opId: string }> {
  const fincaId = uuidv4();                     // UUID local = servidor
  const opId = uuidv4();
  const body = { nombre: datos.nombre, ...limpiar({ ...datos, nombre: undefined }) };
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO fincas (id, datos, sync_status, client_operation_id)
       VALUES (?, ?, 'pending', ?)`,
      [fincaId, JSON.stringify(body), opId],
    );
    await db.runAsync(
      `INSERT INTO sync_queue
         (client_operation_id, entity_type, entity_id, action,
          payload, base_version, estado, intentos, created_at)
       VALUES (?, 'finca', ?, 'create', ?, NULL, 'pending', 0, ?)`,
      [opId, fincaId, JSON.stringify(body), new Date().toISOString()],
    );
  });
  return { fincaId, opId };
}

export async function capturarLote(
  db: Db, fincaId: string, datos: LoteDatos,
): Promise<{ loteId: string; opId: string }> {
  const loteId = uuidv4();
  const opId = uuidv4();
  const body = {
    finca_id: fincaId,                          // requerido por _LoteSyncPayload
    nombre_lote: datos.nombre_lote,
    ...limpiar({ ...datos, nombre_lote: undefined }),
  };
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO lotes (id, finca_id, datos, sync_status, client_operation_id)
       VALUES (?, ?, ?, 'pending', ?)`,
      [loteId, fincaId, JSON.stringify(body), opId],
    );
    await db.runAsync(
      `INSERT INTO sync_queue
         (client_operation_id, entity_type, entity_id, action,
          payload, base_version, estado, intentos, created_at)
       VALUES (?, 'lote', ?, 'create', ?, NULL, 'pending', 0, ?)`,
      [opId, loteId, JSON.stringify(body), new Date().toISOString()],
    );
  });
  return { loteId, opId };
}

export type FincaLocal = {
  id: string; datos: string; sync_status: string;
  server_version: number | null; deleted_at: string | null;
};

export async function listarFincas(db: Db): Promise<FincaLocal[]> {
  return db.getAllAsync<FincaLocal>(
    `SELECT id, datos, sync_status, server_version, deleted_at
       FROM fincas WHERE deleted_at IS NULL ORDER BY datos`,
  );
}

export async function contarPendientes(db: Db): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM sync_queue WHERE estado IN ('pending','syncing','failed','conflict')",
  );
  return r?.n ?? 0;
}
