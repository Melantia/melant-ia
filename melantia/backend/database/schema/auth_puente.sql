-- ===========================================================================
-- PUENTE DE IDENTIDAD: auth.users (Supabase) ↔ usuarios (MELANTIA)
-- Diseño cerrado D4.2 §5.1 — doc 15_DISENO_TECNICO_IDENTIDAD_AUTH.md
--
-- Reglas embebidas:
--   - id = auth.users.id: 1:1 estricto con la identidad de
--     autenticación externa. La FK a auth.users es LÓGICA (no existe
--     schema auth en PG local — D4.2 §5.1/§16).
--   - usuario_id UNIQUE NOT NULL → usuarios.id CASCADE: 1:1 estricto
--     con la identidad de negocio; borrar el usuario arrastra el
--     vínculo. Jamás auto-provisionar (invariante ADR §12.2).
--   - cedula_ruc UNIQUE: dedup de registro; es caché — la canónica
--     es usuarios.cedula_ruc.
--   - rol_id: referencia LÓGICA a roles(id) — la tabla `roles` de la
--     plataforma es migración opcional M2 (D4.2 §16, "si se adopta de
--     0001"); sin FK física hasta entonces (precedente D9:
--     contexto_*/recurso_id suaves). NULL = sin rol de plataforma.
--   - estado 'activo|suspendido|revocado': soporte a suspensión sin
--     borrar el vínculo (F7a.1 §5 — emergencia global).
--   - El puente NO duplica email/nombre/password/teléfono (viven en
--     auth.users/usuarios — §5.1).
--   - updated_at mantenido por trigger (§16 M1).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS usuarios_auth_puente (
    id UUID PRIMARY KEY,                 -- = auth.users.id (FK lógica)
    usuario_id UUID NOT NULL UNIQUE
        REFERENCES usuarios(id) ON DELETE CASCADE,
    cedula_ruc VARCHAR(20) NOT NULL UNIQUE,
    rol_id UUID,                         -- → roles(id) lógico; sin FK
                                         -- hasta M2 (roles no adoptado)
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

-- Los 3 lookups del diseño ya están indexados: PK(id), UNIQUE
-- (usuario_id), UNIQUE (cedula_ruc) — §5.1. Índice adicional solo
-- para el barrido por estado (suspensiones/revocaciones admin).
CREATE INDEX IF NOT EXISTS idx_auth_puente_estado
    ON usuarios_auth_puente(estado);
