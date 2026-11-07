// Motor SQLite local F1a — esquema según SYNC_OFFLINE_FIRST_DESIGN.md §3.
// Invariantes: WAL, FK on, migraciones versionadas con PRAGMA user_version
// (una tx por migración; un fallo marca reparación, nunca arranca a medias).
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'melantia.db';
const SCHEMA_VERSION = 1;

// user_version -> SQL de la migración correspondiente.
const MIGRACIONES: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS fincas (
      id TEXT PRIMARY KEY,
      datos TEXT NOT NULL,              -- JSON del dominio
      sync_status TEXT NOT NULL DEFAULT 'pending',
      server_version INTEGER,
      client_operation_id TEXT,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS lotes (
      id TEXT PRIMARY KEY,
      finca_id TEXT NOT NULL,
      datos TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      server_version INTEGER,
      client_operation_id TEXT,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      client_operation_id TEXT PRIMARY KEY,  -- UUID al encolar
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,                  -- create|update|delete
      payload TEXT NOT NULL,                 -- JSON del cuerpo
      base_version INTEGER,
      estado TEXT NOT NULL DEFAULT 'pending',-- pending|syncing|failed|conflict
      intentos INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL               -- captura offline del dispositivo
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      clave TEXT PRIMARY KEY,
      valor TEXT,
      updated_at TEXT
    );
    INSERT OR IGNORE INTO sync_meta (clave, valor, updated_at)
      VALUES ('pull_cursor', '0', CURRENT_TIMESTAMP);
  `,
};

export type Db = SQLite.SQLiteDatabase;

export async function abrirDb(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let version = row?.user_version ?? 0;
  while (version < SCHEMA_VERSION) {
    const siguiente = version + 1;
    const sql = MIGRACIONES[siguiente];
    // una tx por migración: aplica DDL + bump de versión o nada
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${siguiente}`);
    });
    version = siguiente;
  }
  return db;
}

// Recuperación tras reinicio: filas 'syncing' (app murió a mitad de
// envío) vuelven a 'pending' — el envío es idempotente (diseño §3).
export async function recuperarColaTrasReinicio(db: Db): Promise<void> {
  await db.runAsync(
    "UPDATE sync_queue SET estado='pending' WHERE estado='syncing'",
  );
}
