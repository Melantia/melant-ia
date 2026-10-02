-- ===========================================================================
-- MELANTIA — M11: REGISTRO DE EVIDENCIAS Y DOCUMENTOS (CUSTODIA TOTAL)
-- Extraído de migraciones/migracion_inicial.sql §6 (sin cambios de estructura).
-- NOTA: campos comerciales (monto_total/comision_app/monto_liberado/
-- estado_pago) permanecen por compatibilidad con el controller actual.
-- Su separación hacia M4.transacciones es rediseño posterior (B2).
-- Dependencias: usuarios
-- ===========================================================================

CREATE TABLE IF NOT EXISTS evidencias_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_bien VARCHAR(100) NOT NULL, -- 'Cosecha', 'Bienes Raíces', 'Vehículos', 'Maquinaria'
    nombre_documento VARCHAR(255) NOT NULL,
    monto_total NUMERIC(12,2) NOT NULL,
    comision_app NUMERIC(12,2) NOT NULL, -- 3% Retenido para la App
    monto_liberado NUMERIC(12,2) NOT NULL, -- 97% Restante para el Vendedor
    url_foto_evidencia_firmas VARCHAR(255), -- Foto de contrato / apretón de manos / recibo de pago
    url_foto_soporte_legal VARCHAR(255),   -- FOTO DE LA ESCRITURA PÚBLICA o MATRÍCULA VEHICULAR (Verificación)
    estado_pago VARCHAR(100) DEFAULT 'En Custodia', -- 'En Custodia', 'Fondos Liberados al Vendedor'
    confirmacion_vendedor BOOLEAN DEFAULT FALSE,
    confirmacion_comprador BOOLEAN DEFAULT FALSE,
    hash_transaccion VARCHAR(64) UNIQUE NOT NULL, -- Hash único para el QR inmutable offline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidencias_hash
    ON evidencias_documentos(hash_transaccion);
