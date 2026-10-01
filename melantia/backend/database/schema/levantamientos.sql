-- ===========================================================================
-- MELANTIA — LEVANTAMIENTOS GPS / ETAPA 2-B1 (auditoría y diseño aprobados)
-- Sesión de captura de puntos GPS que forman un polígono de lote/finca.
-- mediciones_campo conserva cada vértice con orden y precision_gps_metros.
-- Dependencias: usuarios, lotes, mediciones_campo, uuid-ossp
--
-- Endurecimiento de integridad (auditoría M2 — decisiones B1/B2/B3/B4):
--   B3: usuario_id NOT NULL + CHECK de estado.
--   B1: client_operation_id = clave de idempotencia de la operación
--       de creación (la genera el cliente; identifica la operación,
--       no al usuario ni al dispositivo).
--   B2: UNIQUE parcial (levantamiento_id, orden) en mediciones_campo.
--   B4: coordenadas GPS en DOUBLE PRECISION (REAL pierde ~1–2 m).
-- En bases existentes estos cambios se aplican con
-- migraciones/m2_levantamientos_integridad.sql — NO se ejecuta aquí.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS levantamientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    nombre VARCHAR(150),
    observaciones TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador',
    area_m2 NUMERIC(14, 2),
    perimetro_m NUMERIC(14, 2),
    client_operation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_levantamientos_estado
        CHECK (estado IN ('borrador', 'cerrado', 'aplicado'))
);

ALTER TABLE mediciones_campo
    ADD COLUMN IF NOT EXISTS levantamiento_id UUID
        REFERENCES levantamientos(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS orden INTEGER,
    ALTER COLUMN latitud TYPE DOUBLE PRECISION,
    ALTER COLUMN longitud TYPE DOUBLE PRECISION,
    ALTER COLUMN precision_gps_metros TYPE DOUBLE PRECISION;

-- Idempotencia offline: una operación de creación por usuario.
CREATE UNIQUE INDEX IF NOT EXISTS uq_levantamientos_client_operation_id
    ON levantamientos(usuario_id, client_operation_id)
    WHERE client_operation_id IS NOT NULL;

-- Un vértice por (levantamiento, orden): deduplicación de reintentos.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mediciones_levantamiento_orden
    ON mediciones_campo(levantamiento_id, orden)
    WHERE levantamiento_id IS NOT NULL AND orden IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_levantamientos_usuario
    ON levantamientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_levantamientos_lote
    ON levantamientos(lote_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_levantamiento
    ON mediciones_campo(levantamiento_id);
