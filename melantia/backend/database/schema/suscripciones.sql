-- ===========================================================================
-- MELANTIA — M1: SUSCRIPCIONES Y PERFIL ECONÓMICO DEL PRODUCTOR
-- Tablas requeridas por backend/main.py (incentivo Melantios y worker de
-- score productivo) — DB_AUDIT_PHASE2 P2: usadas por código, sin DDL.
-- Patrón offline-first: UUID, created_at/updated_at, TIMESTAMPTZ.
-- Dependencias: usuarios
-- ===========================================================================

-- Incentivo Melantios: balance por usuario, creado al primer registro.
CREATE TABLE IF NOT EXISTS usuarios_suscripciones (
    usuario_id             UUID PRIMARY KEY
        REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre                 VARCHAR(150) NOT NULL,
    plan_actual            VARCHAR(50)  NOT NULL DEFAULT 'Standard',
    melantios_balance      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ultima_sincronizacion  TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Score productivo: upsert del worker en main.py (ON CONFLICT usuario_id).
CREATE TABLE IF NOT EXISTS perfil_economico_productor (
    usuario_id                UUID PRIMARY KEY
        REFERENCES usuarios(id) ON DELETE CASCADE,
    area_total_cultivos_m2    NUMERIC(14,2) DEFAULT 0,
    cabezas_ganado_total      INT DEFAULT 0,
    score_productivo_melantia INT DEFAULT 0,
    fecha_ultimo_calculo      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
