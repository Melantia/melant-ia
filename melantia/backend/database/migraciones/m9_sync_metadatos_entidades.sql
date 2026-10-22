-- ===========================================================================
-- MIGRACIÓN M9 — Metadatos de sincronización en entidades de Gestión de
-- Fincas (fincas, lotes, hatos_ganaderos) + cursor de pull en dispositivos
-- Diseño aprobado: docs/SYNC_OFFLINE_FIRST_DESIGN.md §5.1, §6, §9.2
-- Versión 2026-10-21 · ⚠️  PROPUESTA — NO EJECUTAR sin autorización
--                        explícita del propietario.
--
-- EJECUCIÓN (cuando se autorice): en una única transacción —
--
--     psql -1 -f backend/database/migraciones/m9_sync_metadatos_entidades.sql
--
-- DEPENDENCIA: requiere m8 aplicada (dispositivos ya existe desde m4;
-- sync_* no se toca aquí).
--
-- ALCANCE — solo ADD COLUMN IF NOT EXISTS + índices parciales nuevos.
-- Cero UPDATE/DELETE/DROP. Rollback = DROP COLUMN / DROP INDEX.
--
-- COLUMNAS AÑADIDAS (fincas, lotes, hatos_ganaderos):
--   version              INT NOT NULL DEFAULT 1 CHECK (version > 0)
--     → concurrencia optimista: el push declara base_version; si difiere
--       de la versión del servidor → conflict (§6 del diseño). El writer
--       incrementa version en cada UPDATE aceptado.
--   deleted_at           TIMESTAMPTZ NULL
--     → tombstone (eliminación lógica). NULL = activo; la regla "el
--       registro original no desaparece" (§3.2) prohíbe DELETE físico.
--   dispositivo_origen_id UUID NULL REFERENCES dispositivos ON DELETE SET NULL
--     → procedencia de captura (qué dispositivo la creó); auditoría y
--       depuración de conflictos. SET NULL: revocar/eliminar el
--       dispositivo no arrastra la finca.
--
-- DECISIONES (por qué NO se añade más):
--   - client_operation_id NO va en la entidad: es la clave de LA
--     OPERACIÓN, y vive en el ledger sync_operaciones (m8), que ya
--     resuelve reintentos por (usuario_id, client_operation_id) →
--     entity_id. Ponerla en cada entidad duplicaría la clave sin uso.
--   - sync_status NO se copia a entidades: es estado del CLIENTE; en el
--     servidor toda fila confirmada está "synced" por definición.
--   - hash_transaccion NO se añade: conserva su semántica de dedup por
--     contenido donde ya existe (m6); la idempotencia del sync la da
--     el ledger, no huellas de contenido.
--   - updated_at ya existe y lo mantiene el repo; no se toca.
--
-- DISPOSITIVOS:
--   ultimo_pull_seq BIGINT NULL — último seq de changelog que el
--   dispositivo confirmó haber aplicado. Necesario para el suelo de
--   purga de §5.1 (solo se puede purgar lo anterior al cursor mínimo
--   de los dispositivos activos) sin otra migración futura. El
--   endpoint de pull lo escribirá; NULL = nunca sincronizó.
--
-- ÍNDICES (parciales sobre filas activas): los listados filtrarán
--   WHERE deleted_at IS NULL — patrón de acceso dominante tras
--   introducir tombstones.
--
-- COMPATIBILIDAD CON DATOS EXISTENTES: version rellena 1 por DEFAULT,
-- deleted_at/dispositivo_origen_id quedan NULL = toda fila actual es
-- "activa versión 1 de origen desconocido". Ninguna regla de aislamiento
-- por usuario_id se modifica.
--
-- PRE-CHEQUEOS (ejecutar antes de aplicar; ambos deben ser 0):
--   SELECT count(*) FROM information_schema.columns
--   WHERE table_name IN ('fincas','lotes','hatos_ganaderos')
--     AND column_name IN ('version','deleted_at','dispositivo_origen_id');
--   SELECT count(*) FROM information_schema.columns
--   WHERE table_name='dispositivos' AND column_name='ultimo_pull_seq';
--
-- VERIFICACIÓN POST-APLICACIÓN:
--   SELECT table_name, column_name FROM information_schema.columns
--   WHERE column_name IN ('version','deleted_at','dispositivo_origen_id')
--   ORDER BY 1,2;
--   -- → 3 tablas × 3 columnas = 9 filas
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name='dispositivos' AND column_name='ultimo_pull_seq';
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- fincas
-- ---------------------------------------------------------------------------
ALTER TABLE fincas
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1
        CHECK (version > 0),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dispositivo_origen_id UUID
        REFERENCES dispositivos(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- lotes
-- ---------------------------------------------------------------------------
ALTER TABLE lotes
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1
        CHECK (version > 0),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dispositivo_origen_id UUID
        REFERENCES dispositivos(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- hatos_ganaderos (DDL existe; sin API aún — se incluye ahora para no
-- requerir otra migración cuando se exponga)
-- ---------------------------------------------------------------------------
ALTER TABLE hatos_ganaderos
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1
        CHECK (version > 0),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dispositivo_origen_id UUID
        REFERENCES dispositivos(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- dispositivos — progreso de pull para el suelo de purga (§5.1)
-- ---------------------------------------------------------------------------
ALTER TABLE dispositivos
    ADD COLUMN IF NOT EXISTS ultimo_pull_seq BIGINT
        CHECK (ultimo_pull_seq IS NULL OR ultimo_pull_seq >= 0);

-- ---------------------------------------------------------------------------
-- Índices parciales sobre filas activas (listados dominantes)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fincas_usuario_activas
    ON fincas (usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lotes_finca_activos
    ON lotes (finca_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_hatos_finca_activos
    ON hatos_ganaderos (finca_id) WHERE deleted_at IS NULL;

COMMIT;
