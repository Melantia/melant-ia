-- ============================================================
-- MELANT IA · Esquema base · 03_usuarios
-- Identidad, roles y sesiones. Las contraseñas se almacenan
-- con hash bcrypt generado por backend/core/security.py.
-- Depende de: extensions.sql, geografia.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id            SERIAL PRIMARY KEY,
    codigo        TEXT NOT NULL UNIQUE,   -- admin, tecnico, productor
    descripcion   TEXT NOT NULL
);

INSERT INTO roles (codigo, descripcion) VALUES
    ('admin',     'Administrador de la plataforma'),
    ('tecnico',   'Técnico de campo'),
    ('productor', 'Productor agropecuario')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo   TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    cedula_ruc        TEXT UNIQUE,
    telefono          TEXT,
    hashed_password   TEXT NOT NULL,
    rol_id            INTEGER NOT NULL REFERENCES roles(id),
    plan              TEXT NOT NULL DEFAULT 'free'
                      CHECK (plan IN ('free', 'pro', 'premium', 'empresarial')),
    provincia_id      INTEGER REFERENCES provincias(id),
    canton_id         INTEGER REFERENCES cantones(id),
    parroquia_id      INTEGER REFERENCES parroquias(id),
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso     TIMESTAMPTZ,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens emitidos por el flujo JWT (revocables).
CREATE TABLE IF NOT EXISTS sesiones (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash    TEXT NOT NULL UNIQUE,
    user_agent    TEXT,
    ip            INET,
    expira_en     TIMESTAMPTZ NOT NULL,
    revocada_en   TIMESTAMPTZ,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion        TEXT NOT NULL,
    entidad       TEXT,
    entidad_id    TEXT,
    ip            INET,
    detalles      JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol        ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo     ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario    ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira     ON sesiones(expira_en);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario   ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha     ON logs_auditoria(creado_en);

DROP TRIGGER IF EXISTS trg_usuarios_actualizado_en ON usuarios;
CREATE TRIGGER trg_usuarios_actualizado_en
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
