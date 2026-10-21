-- ===========================================================================
-- MIGRACIÓN M4 — F7a Fase ①: Sesiones y dispositivos MELANTIA
-- Decisión aprobada: docs/.../21_DECISION_F7A1_SEGURIDAD_SESION.md
-- DDL canónico: backend/database/schema/sesiones.sql
--
-- ⚠️  PROPUESTA — NO EJECUTAR sin autorización explícita.
--     Ejecución autorizada: una sola transacción —
--         psql -1 -f backend/database/migraciones/m4_f7a_sesiones_dispositivos.sql
--     (idempotente ≠ atómica: el wrapper -1 garantiza todo-o-nada;
--      el BEGIN/COMMIT interno es segunda garantía si se corre sin -1).
--
-- ALCANCE (dos objetos nuevos; cero ALTER sobre tablas existentes):
--   dispositivos — registro de dispositivos conocidos por usuario.
--   sesiones     — verdad de seguridad de sesión MELANTIA: estado,
--                  familia, rotación observada, revocación con
--                  historial, custodia cifrada del RT (Fase ②).
--
-- REGLAS EMBEBIDAS (decisiones F7a.1 cerradas):
--   - Sesión absoluta 30 días: expires_at obligatorio, sin ventana
--     deslizante. El CHECK expires_at > created_at lo impide por DDL.
--   - auth_session_id UUID UNIQUE acepta múltiples NULL: las sesiones
--     locales pre-Supabase no tienen claim; la Fase ② poblará el
--     claim session_id de GoTrue sin migración adicional.
--   - refresh_token_enc BYTEA: el RT custodiado viaja SIEMPRE cifrado
--     por la aplicación; la columna existe desde ya pero el servicio
--     que la escribe es Fase ②.
--   - Nada se borra: revocada/expirada/sospechosa conserva historial;
--     coherencia revocada→revocado_at por CHECK.
--   - Eventos de seguridad NO crean tabla nueva: van a audit_eventos
--     (transversal EP-3) con acciones 'sesion.*'/'seguridad.*'.
--   - Eventos = evidencia, nunca bloqueo automático (F7a.1 §4/FASE 5).
--
-- PRE-CHEQUEOS (ejecutar ANTES de aplicar; esperados 0):
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_name IN ('sesiones','dispositivos');             -- 0
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_name = 'usuarios';                               -- 1
-- ===========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS dispositivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(120),
    fingerprint_hash VARCHAR(128),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'revocado')),
    registrado_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ,
    revocado_at TIMESTAMPTZ,
    revocado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_revocacion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    dispositivo_id UUID NOT NULL
        REFERENCES dispositivos(id) ON DELETE RESTRICT,
    auth_proveedor VARCHAR(20) NOT NULL DEFAULT 'local'
        CHECK (auth_proveedor IN ('local', 'supabase')),
    auth_session_id UUID UNIQUE,
    familia_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'sospechosa', 'revocada', 'expirada')),
    rotaciones_observadas INT NOT NULL DEFAULT 0
        CHECK (rotaciones_observadas >= 0),
    ultimo_refresh_at TIMESTAMPTZ,
    refresh_token_enc BYTEA,
    ultimo_ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
        CHECK (expires_at > created_at),
    last_seen_at TIMESTAMPTZ,
    revocado_at TIMESTAMPTZ,
    revocado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_revocacion VARCHAR(200),
    CHECK (estado <> 'revocada' OR revocado_at IS NOT NULL)
);

-- Un mismo dispositivo físico no se duplica por usuario una vez
-- calculado su fingerprint (Fase ②/③); NULL no colisiona.
CREATE UNIQUE INDEX IF NOT EXISTS uq_dispositivos_usuario_fingerprint
    ON dispositivos(usuario_id, fingerprint_hash)
    WHERE fingerprint_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dispositivos_usuario_estado
    ON dispositivos(usuario_id, estado);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_estado
    ON sesiones(usuario_id, estado);
CREATE INDEX IF NOT EXISTS idx_sesiones_dispositivo
    ON sesiones(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_familia
    ON sesiones(familia_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira_activas
    ON sesiones(expires_at) WHERE estado IN ('activa', 'sospechosa');

COMMIT;

-- ===========================================================================
-- VERIFICACIÓN POST-EJECUCIÓN:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('sesiones','dispositivos');         -- 2 filas
--   SELECT indexname FROM pg_indexes
--   WHERE tablename IN ('sesiones','dispositivos')
--   ORDER BY 1;                                            -- 6 índices
--   pytest backend/tests — suite completa verde.
-- ===========================================================================
