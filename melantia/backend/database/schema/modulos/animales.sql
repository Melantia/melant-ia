-- ============================================================================
-- ANIMALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS animales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    hato_id UUID NOT NULL
        REFERENCES hatos_ganaderos(id)
        ON DELETE CASCADE,

    identificador VARCHAR(100),

    especie VARCHAR(50) NOT NULL,

    raza VARCHAR(100),

    sexo VARCHAR(20),

    fecha_nacimiento DATE,

    fecha_nacimiento_estimada BOOLEAN
        DEFAULT FALSE,

    estado VARCHAR(30)
        DEFAULT 'activo',

    proposito VARCHAR(100),

    peso_actual NUMERIC(10, 2),

    unidad_peso VARCHAR(20)
        DEFAULT 'kg',

    observaciones TEXT,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT animal_estado_check
        CHECK (
            estado IN (
                'activo',
                'vendido',
                'fallecido',
                'trasladado',
                'inactivo'
            )
        ),

    CONSTRAINT animal_sexo_check
        CHECK (
            sexo IS NULL
            OR sexo IN (
                'macho',
                'hembra',
                'otro'
            )
        ),

    CONSTRAINT animal_peso_check
        CHECK (
            peso_actual IS NULL
            OR peso_actual >= 0
        )
);