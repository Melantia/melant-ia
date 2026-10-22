-- ===========================================================================
-- MIGRACIÓN M8 — Infraestructura de sincronización offline-first
-- Diseño aprobado: docs/SYNC_OFFLINE_FIRST_DESIGN.md §4, §5, §9.2
-- Versión 2026-10-21 · corregida 2026-10-22 (FAIL-01 auditoría:
-- payload_hash en sync_operaciones — aún sin commit ni aplicación a
-- melantia_db, la corrección edita la propuesta original) ·
-- ⚠️  PROPUESTA — NO EJECUTAR sin autorización del propietario.
--
-- EJECUCIÓN (cuando se autorice): en una única transacción —
--
--     psql -1 -f backend/database/migraciones/m8_sync_infraestructura.sql
--
--   (psql -1 envuelve el archivo en una transacción; el BEGIN/COMMIT
--    interno es segunda garantía. Un fallo a mitad revierte todo.)
--
-- ALCANCE — tres tablas nuevas + una función, CERO ALTER/DROP sobre
-- objetos existentes. Migración aditiva; rollback =
-- DROP FUNCTION sync_next_seq + DROP TABLE sync_operaciones,
-- sync_cambios, sync_cursors.
--
--   1. sync_cursors — contador transaccional por ámbito.
--      NO es una secuencia: BIGSERIAL asigna en el INSERT, no en el
--      COMMIT; dos transacciones podrían confirmar seq=2 antes que
--      seq=1 y un pull perdería el 1 para siempre. Aquí el UPDATE de
--      la fila del scope toma un row lock retenido hasta el COMMIT:
--      seq=N+1 solo se asigna cuando la tx dueña de seq=N terminó.
--      Ver seq confirmado ⇒ todos los seq anteriores del scope
--      confirmados. (§4.6 del diseño.)
--
--   2. sync_cambios — changelog incremental por ámbito, escrito EN LA
--      MISMA TRANSACCIÓN que el cambio de negocio (atomicidad
--      obligatoria: dominio + changelog + cursor confirman o
--      revierten juntos).
--
--   3. sync_operaciones — ledger de idempotencia del push. Un
--      reintento con el mismo (usuario_id, client_operation_id)
--      devuelve el `resultado` almacenado SIN re-ejecutar el cambio
--      de negocio. Patrón heredado de m2/B1 (UNIQUE parcial) pero
--      aquí client_operation_id es NOT NULL: una fila del ledger sin
--      clave de operación no sería recuperable por reintento.
--
--      payload_hash (corrección FAIL-01 de auditoría 2026-10-22):
--      SHA-256 hex de la SOLICITUD canónica (abajo). Sin ella, el
--      mismo client_operation_id con contenido distinto recibiría el
--      resultado previo y la operación nueva se descartaría en
--      silencio. Es distinto de hash_transaccion (m6 = dedup por
--      contenido de NEGOCIO): esto es huella de la SOLICITUD de sync
--      para detectar reutilización de clave.
--
--      Serialización canónica de la solicitud (obligatoria, ambos
--      lados la calculan idéntica):
--        sha256_hex( json_canon( op_canonica ) )
--        op_canonica = {
--          "scope": <texto>, "entity_type": <texto>,
--          "entity_id": <uuid|null>, "accion": "create|update|delete",
--          "base_version": <int|null>, "payload": <json normalizado>
--        }
--        json_canon = JSON con: claves ordenadas (sort_keys),
--        separadores mínimos (",": ":"), Unicode literal
--        (ensure_ascii=False), UTF-8, null explícito para ausentes.
--        Números: se serializan tal cual llegan del cliente (1 ≠ 1.0);
--        el cliente normaliza antes de enviar. Los dos lados usan el
--        mismo algoritmo: dos solicitudes semánticamente idénticas →
--        mismo hash; cualquier cambio de significado → hash distinto.
--
--      Semántica obligatoria al reintentar (la aplica el servicio de
--      sync cuando exista; el esquema la hace posible):
--        A misma clave + mismo hash  → 'duplicate': devolver
--          `resultado` guardado, sin re-ejecutar nada.
--        B misma clave + hash distinto → error explícito
--          'idempotency_key_reuse' (HTTP 409); cero cambio de negocio;
--          el resultado previo NO se devuelve como si correspondiera.
--        C concurrentes con misma clave → la inserción especulativa
--          del UNIQUE bloquea a la segunda hasta que la primera
--          confirme o revierta; luego se comparan hashes (casos A/B).
--          Imposible ejecutar dos operaciones de negocio con la misma
--          clave.
--        D rollback de la operación de negocio → la fila del ledger
--          revierte con la misma transacción: jamás queda éxito
--          registrado de una operación no confirmada.
--
--   4. sync_next_seq(scope) — única vía prevista de asignar seq.
--      Concentrar el bump en una función garantiza el orden de
--      adquisición de bloqueos (siempre DESPUÉS de las escrituras de
--      dominio, último paso antes del COMMIT) y deja el mecanismo
--      documentado y probable.
--
-- ÁMBITOS (scope): espacio de nombres por texto con prefijo.
--   - 'usr:<usuario_uuid>'  → datos personales; único ámbito que esta
--                             infraestructura habilita hoy (la
--                             autorización existente es por
--                             usuario_id). El servicio de sync
--                             validará scope == usuario del token;
--                             la existencia de una fila en
--                             sync_cursors NO concede acceso.
--   - 'wks:<uuid>'/'prj:<uuid>' → reservados para workspaces/proyectos
--                             EP cuando exista autorización por scope.
--   Orden de bloqueos: si una operación tocara varios scopes (futuro
--   compartido), bump siempre en ORDER BY scope — mismo orden en
--   todos los writers = sin interbloqueo entre cursors.
--
-- EXCLUIDO EXPRESAMENTE:
--   - Catálogo geográfico (versionado por endpoint/ETag, no changelog).
--   - Purga de tombstones/changelog (requiere cursores de dispositivo
--     activos — §5.1 del diseño; no hay proceso automático).
--   - Metadatos de entidades (version/deleted_at/...): migración m9.
--
-- PRE-CHEQUEOS (todo debe ser 0):
--   SELECT count(*) FROM pg_tables WHERE schemaname='public'
--     AND tablename IN ('sync_cursors','sync_cambios','sync_operaciones');
--   SELECT count(*) FROM pg_proc WHERE proname='sync_next_seq';
--
-- VERIFICACIÓN POST-APLICACIÓN:
--   SELECT tablename FROM pg_tables WHERE tablename LIKE 'sync_%';
--   -- → sync_cambios, sync_cursors, sync_operaciones
--   SELECT sync_next_seq('usr:00000000-0000-0000-0000-000000000000');  -- 1
--   SELECT sync_next_seq('usr:00000000-0000-0000-0000-000000000000');  -- 2
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Contador transaccional por ámbito
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_cursors (
    scope TEXT PRIMARY KEY,
    last_seq BIGINT NOT NULL DEFAULT 0
        CHECK (last_seq >= 0)
);

-- ---------------------------------------------------------------------------
-- 2. Changelog incremental por ámbito
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_cambios (
    scope TEXT NOT NULL,
    seq BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,      -- 'finca','lote','hato',...
    entity_id UUID NOT NULL,
    op VARCHAR(10) NOT NULL
        CHECK (op IN ('upsert', 'delete')),
    data JSONB,                            -- snapshot completo (upsert);
                                           -- NULL en delete (tombstone)
    entity_version INT,                    -- version resultante servidor
    actor_id UUID                          -- quién originó el cambio;
        REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scope, seq)
);

-- Resolución de estado actual de una entidad y depuración de conflictos.
CREATE INDEX IF NOT EXISTS idx_sync_cambios_entidad
    ON sync_cambios (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 3. Ledger de operaciones de push (idempotencia)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    dispositivo_id UUID
        REFERENCES dispositivos(id) ON DELETE SET NULL,
    client_operation_id UUID NOT NULL,     -- clave de idempotencia del
                                           -- cliente: identifica LA
                                           -- OPERACIÓN (m2/B1). Distinto
                                           -- de hash_transaccion (dedup
                                           -- por contenido, m6) — ambos
                                           -- coexisten.
    payload_hash VARCHAR(64) NOT NULL,     -- SHA-256 hex de la solicitud
                                           -- canónica (ver header):
                                           -- detecta reutilización de
                                           -- clave con contenido
                                           -- distinto (FAIL-01)
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,                        -- NULL si falló antes de tocar
                                           -- la entidad
    accion VARCHAR(10) NOT NULL
        CHECK (accion IN ('create', 'update', 'delete')),
    estado VARCHAR(20) NOT NULL
        CHECK (estado IN ('applied', 'duplicate', 'conflict', 'error')),
    resultado JSONB,                       -- respuesta almacenada: el
                                           -- reintento la devuelve sin
                                           -- re-ejecutar nada
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotencia por (usuario, operación): colisión inter-usuario
-- imposible por construcción — el scope autorizado es el del token.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sync_operaciones_client_op
    ON sync_operaciones (usuario_id, client_operation_id);

CREATE INDEX IF NOT EXISTS idx_sync_operaciones_usuario
    ON sync_operaciones (usuario_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. Asignación de seq — única vía autorizada
--    Toma el row lock de la fila del scope hasta COMMIT/ROLLBACK:
--    serializa writers del MISMO scope; scopes distintos nunca
--    compiten. Llamar como último paso de la tx de negocio.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_next_seq(p_scope TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_seq BIGINT;
BEGIN
    INSERT INTO sync_cursors (scope, last_seq)
    VALUES (p_scope, 1)
    ON CONFLICT (scope) DO UPDATE
        SET last_seq = sync_cursors.last_seq + 1
    RETURNING last_seq INTO v_seq;
    RETURN v_seq;
END;
$$ LANGUAGE plpgsql;

COMMIT;
