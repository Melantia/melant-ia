CREATE TABLE IF NOT EXISTS eventos_animales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    animal_id UUID NOT NULL
        REFERENCES animales(id)
        ON DELETE CASCADE,

    usuario_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    tipo_evento VARCHAR(50) NOT NULL,

    fecha_evento TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    descripcion TEXT,

    cantidad NUMERIC(12, 3),

    unidad VARCHAR(30),

    datos JSONB,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);