-- ===========================================================================
-- SESIONES Y DISPOSITIVOS MELANTIA (F7a — custodia de sesión, decisión 21)
--
-- Rol arquitectónico:
--   MELANTIA es la verdad de seguridad de la sesión. Supabase autentica;
--   estas tablas controlan existencia, estado, familia, revocación y
--   custodia del refresh token cifrado (F7a.1 §3-§5, §9).
--
-- Reglas embebidas:
--   - JWT válido = condición necesaria, nunca suficiente: la
--     autorización exige sesiones.estado='activa'.
--   - familia := session_id de Supabase cuando exista (F7a.1 §3);
--     en sesiones locales (auth_proveedor='local') la familia es la
--     propia sesión (familia_id = id).
--   - Sesión absoluta 30 días: expires_at se fija al crear; NO hay
--     ventana deslizante (F7a.1 §8).
--   - Revocada/sospechosa/expirada NO se borra (historial). Los
--     registros de seguridad no admiten DELETE físico.
--   - refresh_token_enc es BYTEA cifrado por la aplicación — jamás
--     tokens en texto plano. NULL hasta la Fase ②.
--   - fingerprint_hash es identificador derivado, no PII; el cálculo
--     real queda para Fase ②/③ (F7a.1 §3, §4).
--   - Eventos de seguridad: se registran en audit_eventos (tabla
--     transversal existente) — no hay tabla paralela de auditoría.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS dispositivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(120),                -- declaración del cliente
                                        -- ("Tablet-Juan-01", modelo+UA)
    fingerprint_hash VARCHAR(128),      -- derivado futuro (Fase ②/③);
                                        -- NULL = no calculado. No PII.
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
                                        -- el historial de sesiones
                                        -- impide borrar el dispositivo
    auth_proveedor VARCHAR(20) NOT NULL DEFAULT 'local'
        CHECK (auth_proveedor IN ('local', 'supabase')),
    auth_session_id UUID UNIQUE,        -- claim session_id de Supabase
                                        -- (Fase ②); NULL en local.
                                        -- UNIQUE permite múltiples NULL.
    familia_id UUID NOT NULL,           -- cadena de rotación; Supabase:
                                        -- = auth_session_id; local: = id
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'sospechosa', 'revocada', 'expirada')),
    rotaciones_observadas INT NOT NULL DEFAULT 0
        CHECK (rotaciones_observadas >= 0),
    ultimo_refresh_at TIMESTAMPTZ,
    refresh_token_enc BYTEA,            -- RT custodiado cifrado (§9);
                                        -- NULL hasta Fase ②; NUNCA texto
    ultimo_ip INET,                     -- señal de detección (§4), no
                                        -- mecanismo de bloqueo
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL     -- tope absoluto 30 d (§8);
        CHECK (expires_at > created_at),
    last_seen_at TIMESTAMPTZ,
    revocado_at TIMESTAMPTZ,
    revocado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_revocacion VARCHAR(200),
    -- coherencia: una sesión revocada siempre tiene marca temporal
    CHECK (estado <> 'revocada' OR revocado_at IS NOT NULL)
);

-- ÍNDICES
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
