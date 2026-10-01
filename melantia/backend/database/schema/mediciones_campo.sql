-- ===========================================================================
-- MELANTIA — MEDICIONES DE CAMPO / PUNTOS GPS (M2 geoespacial, decisión A5)
-- Extraído de migraciones/migracion_inicial.sql §4 — solo mediciones_campo.
-- Tabla aprobada como destino de puntos GPS de levantamiento
-- (latitud, longitud, precision_gps_metros).
-- inventario_hardware_digital y diagnostico_rutas_modulos quedan fuera:
-- sin uso en el backend actual.
-- Dependencias: usuarios, lotes
-- ===========================================================================

CREATE TABLE IF NOT EXISTS mediciones_campo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    sensor_tipo VARCHAR(50) NOT NULL, -- 'GPS','Humedad','Temperatura','NPK','pH','EC'
    valor_lectura NUMERIC(12, 4) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL, -- 'Hectáreas', '% Humedad', 'pH', '°C'
    actividad_guiada VARCHAR(150), -- Nombre de la guía interactiva usada por Ángel
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    precision_gps_metros DOUBLE PRECISION,
    notas TEXT,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mediciones_usuario
    ON mediciones_campo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_sensor
    ON mediciones_campo(sensor_tipo);
