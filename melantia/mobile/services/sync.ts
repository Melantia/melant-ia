// Sync engine F1d — push de sync_queue contra POST /api/v1/sync/push.
// Contrato verificado (schemas.py): SyncOpResult{client_operation_id,
// status applied|duplicate|conflict|error, entity_id, server_version,
// code, detail, server_state}. Lotes de ~50 ops (diseño §4.3).
import * as SecureStore from 'expo-secure-store';
import type { Db } from './db';
import { config } from './config';

const K_ACCESS = 'melantia.access_token';
const K_DEVICE = 'melantia.dispositivo_id';
const BATCH = 50;

type FilaCola = {
  client_operation_id: string; entity_type: string; entity_id: string;
  action: string; payload: string; base_version: number | null;
  created_at: string;
};

type ResultadoOp = {
  client_operation_id: string; status: string;
  entity_id?: string; server_version?: number;
  code?: string; detail?: string; server_state?: Record<string, unknown>;
};

// Aplica el resultado de una op dentro de una transacción:
// espejo + cola consistentes (diseño §3 invariante inversa).
async function aplicarResultado(db: Db, r: ResultadoOp): Promise<void> {
  if (r.status === 'applied' || r.status === 'duplicate') {
    const tabla = r.entity_id ? await tablaDe(db, r.client_operation_id) : null;
    if (tabla && r.entity_id) {
      await db.runAsync(
        `UPDATE ${tabla} SET sync_status='synced', server_version=? WHERE id=?`,
        [r.server_version ?? null, r.entity_id],
      );
    }
    await db.runAsync(
      'DELETE FROM sync_queue WHERE client_operation_id=?',
      [r.client_operation_id],
    );
  } else if (r.status === 'conflict') {
    await db.runAsync(
      `UPDATE sync_queue SET estado='conflict', intentos=intentos+1,
         last_error=? WHERE client_operation_id=?`,
      [JSON.stringify({ code: r.code, detail: r.detail, server_state: r.server_state }),
       r.client_operation_id],
    );
  } else {
    await db.runAsync(
      `UPDATE sync_queue SET estado='failed', intentos=intentos+1,
         last_error=? WHERE client_operation_id=?`,
      [`${r.code ?? 'error'}: ${r.detail ?? ''}`, r.client_operation_id],
    );
  }
}

async function tablaDe(db: Db, opId: string): Promise<string | null> {
  const op = await db.getFirstAsync<{ entity_type: string }>(
    'SELECT entity_type FROM sync_queue WHERE client_operation_id=?', [opId]);
  return op?.entity_type === 'finca' ? 'fincas'
       : op?.entity_type === 'lote' ? 'lotes' : null;
}

// Push de un lote de operaciones pendientes. Devuelve contadores.
export async function pushPendientes(
  db: Db,
): Promise<{ aplicadas: number; conflictos: number; fallidas: number }> {
  const [token, deviceId] = await Promise.all([
    SecureStore.getItemAsync(K_ACCESS),
    SecureStore.getItemAsync(K_DEVICE),
  ]);
  if (!token || !deviceId) throw new Error('Sin sesión o dispositivo');

  const filas = await db.getAllAsync<FilaCola>(
    `SELECT * FROM sync_queue WHERE estado IN ('pending','failed')
       ORDER BY created_at LIMIT ?`, [BATCH]);
  if (!filas.length) return { aplicadas: 0, conflictos: 0, fallidas: 0 };

  // pending/failed → syncing (si la app muere, volverán a pending)
  await db.runAsync(
    `UPDATE sync_queue SET estado='syncing' WHERE estado IN ('pending','failed')
       AND client_operation_id IN (${filas.map(() => '?').join(',')})`,
    filas.map((f) => f.client_operation_id),
  );

  const res = await fetch(`${config.apiUrl}/api/v1/sync/push`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_id: deviceId,
      operations: filas.map((f) => ({
        client_operation_id: f.client_operation_id,
        entity_type: f.entity_type,
        entity_id: f.entity_id,
        action: f.action,
        base_version: f.base_version,
        payload: JSON.parse(f.payload),
        client_created_at: f.created_at,
      })),
    }),
  });

  if (!res.ok) {
    // fallo de lote: syncing → pending (reintento seguro, idempotente)
    await db.runAsync(
      `UPDATE sync_queue SET estado='pending' WHERE estado='syncing'`,
    );
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Push falló (${res.status})`);
  }

  const data = await res.json();
  const resultados: ResultadoOp[] = data.results ?? [];
  let aplicadas = 0, conflictos = 0, fallidas = 0;
  for (const r of resultados) {
    await db.withTransactionAsync(async () => { await aplicarResultado(db, r); });
    if (r.status === 'applied' || r.status === 'duplicate') aplicadas++;
    else if (r.status === 'conflict') conflictos++;
    else fallidas++;
  }
  return { aplicadas, conflictos, fallidas };
}

// ==================== PULL (I-4) — descarga incremental ====================
// GET /api/v1/sync/pull?device_id&cursor&limit — pagina seq ASC,
// next_cursor incluye el último seq aplicado (contrato I-4: cursor
// apunta al último recibido, el siguiente pull empieza en él).

type Cambio = {
  seq: number; entity_type: string; entity_id: string;
  op: 'upsert' | 'delete';
  data?: Record<string, unknown>; entity_version?: number;
};

async function cursorActual(db: Db): Promise<number> {
  const r = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM sync_meta WHERE clave='pull_cursor'");
  return r ? Number(r.valor) : 0;
}

async function aplicarCambio(db: Db, c: Cambio): Promise<void> {
  const tabla = c.entity_type === 'finca' ? 'fincas'
              : c.entity_type === 'lote' ? 'lotes' : null;
  if (!tabla) return;  // tipos desconocidos se ignoran, no bloquean
  if (c.op === 'delete') {
    await db.runAsync(
      `UPDATE ${tabla} SET deleted_at=CURRENT_TIMESTAMP,
         sync_status='synced', server_version=? WHERE id=?`,
      [c.entity_version ?? null, c.entity_id],
    );
  } else {
    await db.runAsync(
      `INSERT INTO ${tabla} (id, datos, sync_status, server_version, deleted_at)
       VALUES (?, ?, 'synced', ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
         datos=excluded.datos, sync_status='synced',
         server_version=excluded.server_version, deleted_at=NULL`,
      [c.entity_id, JSON.stringify(c.data ?? {}), c.entity_version ?? null],
    );
  }
}

// Pull de todas las páginas disponibles. Devuelve cuántos cambios
// se aplicaron y el cursor final.
export async function pullCambios(
  db: Db,
): Promise<{ cambios: number; cursor: number }> {
  const [token, deviceId] = await Promise.all([
    SecureStore.getItemAsync(K_ACCESS),
    SecureStore.getItemAsync(K_DEVICE),
  ]);
  if (!token || !deviceId) throw new Error('Sin sesión o dispositivo');

  let cursor = await cursorActual(db);
  let total = 0;
  let hasMore = true;
  while (hasMore) {
    const res = await fetch(
      `${config.apiUrl}/api/v1/sync/pull?device_id=${deviceId}&cursor=${cursor}&limit=500`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Pull falló (${res.status})`);
    }
    const data = await res.json();
    const cambios: Cambio[] = data.changes ?? [];
    await db.withTransactionAsync(async () => {
      for (const c of cambios) await aplicarCambio(db, c);
      cursor = data.next_cursor ?? cursor;
      await db.runAsync(
        "UPDATE sync_meta SET valor=?, updated_at=CURRENT_TIMESTAMP WHERE clave='pull_cursor'",
        [String(cursor)],
      );
    });
    total += cambios.length;
    hasMore = data.has_more === true;
  }
  return { cambios: total, cursor };
}

// Ciclo completo: push de la cola local + pull incremental.
export async function sincronizarTodo(db: Db) {
  const subidas = await pushPendientes(db);
  const bajadas = await pullCambios(db);
  return { subidas, bajadas };
}
