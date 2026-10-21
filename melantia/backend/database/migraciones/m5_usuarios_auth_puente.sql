-- ===========================================================================
-- MIGRACIÓN M5 — Puente de identidad auth.users ↔ usuarios (D4.2 M1)
-- Diseño cerrado: docs/.../15_DISENO_TECNICO_IDENTIDAD_AUTH.md §5.1, §16
-- DDL canónico: backend/database/schema/auth_puente.sql
--
-- ⚠️  PROPUESTA — NO EJECUTAR sin autorización explícita.
--     Ejecución autorizada: una sola transacción —
--         psql -1 -f backend/database/migraciones/m5_usuarios_auth_puente.sql
--     (idempotente ≠ atómica: -1 garantiza todo-o-nada; el
--      BEGIN/COMMIT interno es segunda garantía si se corre sin -1).
--
-- ALCANCE (un objeto nuevo + función/trigger; cero ALTER sobre
-- tablas existentes — migración aditiva, rollback = DROP TABLE):
--   usuarios_auth_puente — vínculo 1:1 entre la identidad de
--     autenticación (Supabase auth.users.id) y la identidad de
--     negocio (usuarios.id). Es la ÚNICA soldadura entre ambos
--     planos: todo el backend sigue recibiendo usuarios.id.
--
-- DESVIACIÓN DOCUMENTADA de D4.2 §5.1:
--   rol_id UUID SIN FK física — la tabla `roles` es migración
--   opcional M2 ("si se adopta de 0001") y aún no existe en el
--   esquema canónico local. Referencia lógica conforme al
--   precedente D9 (contexto_*/recurso_id suaves). Cuando M2 se
--   adopte, añadir la FK no toca datos.
--
-- REGLAS EMBEBIDAS:
--   - id = auth.users.id: PK sin default — el valor lo decide
--     Supabase; jamás se genera localmente (1:1 externo).
--   - Jamás auto-provisionar: un sub sin puente → 401 (ADR §12.2).
--   - estado suspendido/revocado mantiene el vínculo (historial).
--   - updated_at por trigger genérico set_updated_at() — la función
--     queda disponible para futuras tablas con updated_at.
--
-- PRE-CHEQUEOS (ejecutar ANTES de aplicar):
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_name='usuarios_auth_puente';                   -- 0
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_name='usuarios';                               -- 1
-- ===========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios_auth_puente (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL UNIQUE
        REFERENCES usuarios(id) ON DELETE CASCADE,
    cedula_ruc VARCHAR(20) NOT NULL UNIQUE,
    rol_id UUID,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'suspendido', 'revocado')),
    vinculado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vinculado_por VARCHAR(40) NOT NULL DEFAULT 'registro'
        CHECK (vinculado_por IN ('registro', 'asistido', 'admin',
                                 'migracion')),
    ultimo_acceso_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_puente_estado
    ON usuarios_auth_puente(estado);

-- Trigger updated_at (D4.2 §16 M1: usuarios_auth_puente_updated_at)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_auth_puente_updated_at
    ON usuarios_auth_puente;
CREATE TRIGGER usuarios_auth_puente_updated_at
BEFORE UPDATE ON usuarios_auth_puente
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- ===========================================================================
-- VERIFICACIÓN POST-EJECUCIÓN:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name='usuarios_auth_puente';                   -- 1 fila
--   SELECT indexname FROM pg_indexes
--   WHERE tablename='usuarios_auth_puente';                    -- PK +
--                                               -- 2 UNIQUE + 1 idx
--   SELECT tgname FROM pg_trigger WHERE tgname=
--       'usuarios_auth_puente_updated_at';                     -- 1
-- ===========================================================================
