-- ============================================================================
-- MELANTIA
-- GESTIÓN DE FINCAS
-- ============================================================================
-- Este archivo contiene las entidades productivas principales.
--
-- Relaciones:
--
-- usuarios
--    │
--    └── fincas
--          ├── lotes
--          ├── hatos_ganaderos
--          └── practicas_regenerativas
--
-- La trazabilidad se encuentra en trazabilidad.sql
-- ============================================================================


-- ============================================================================
-- FINCAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fincas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    nombre VARCHAR(150) NOT NULL,

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    -- Punto central o geometría de la finca.
    -- Se mantiene TEXT en esta etapa para conservar compatibilidad
    -- con la estructura actual. Posteriormente puede migrarse a PostGIS.
    coordenadas_gps TEXT,

    ciiu_id INT
        REFERENCES ciiu(id),

    tipo_pyme VARCHAR(100)
        DEFAULT 'PYME Agropecuaria',

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- LOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    finca_id UUID NOT NULL
        REFERENCES fincas(id)
        ON DELETE CASCADE,

    nombre_lote VARCHAR(100) NOT NULL,

    cultivo_principal VARCHAR(100),

    variedad VARCHAR(100),

    fecha_siembra DATE,

    area_metros_cuadrados NUMERIC(12, 2),

    estado_salud_lote VARCHAR(100),

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lotes_area_no_negativa
        CHECK (
            area_metros_cuadrados IS NULL
            OR area_metros_cuadrados >= 0
        )
);


-- ============================================================================
-- HATOS GANADEROS
-- ============================================================================
-- Representa grupos/unidades ganaderas dentro de una finca.
--
-- La trazabilidad individual de animales podrá ampliarse posteriormente
-- sin romper esta estructura.
-- ============================================================================

CREATE TABLE IF NOT EXISTS hatos_ganaderos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    finca_id UUID NOT NULL
        REFERENCES fincas(id)
        ON DELETE CASCADE,

    especie VARCHAR(50) NOT NULL,

    raza VARCHAR(100),

    proposito VARCHAR(100),

    arete_identificador VARCHAR(50),

    cantidad_cabezas INT
        DEFAULT 0,

    fecha_nacimiento_estimada DATE,

    estado_sanitario VARCHAR(100),

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT hatos_cantidad_no_negativa
        CHECK (cantidad_cabezas >= 0)
);


-- ============================================================================
-- PRÁCTICAS REGENERATIVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS practicas_regenerativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    finca_id UUID NOT NULL
        REFERENCES fincas(id)
        ON DELETE CASCADE,

    tipo_practica VARCHAR(150) NOT NULL,

    fecha_aplicacion DATE NOT NULL,

    evidencia_notas TEXT,

    responsable_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fincas_usuario
    ON fincas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_fincas_provincia
    ON fincas(provincia_id);

CREATE INDEX IF NOT EXISTS idx_fincas_canton
    ON fincas(canton_id);

CREATE INDEX IF NOT EXISTS idx_fincas_parroquia
    ON fincas(parroquia_id);

CREATE INDEX IF NOT EXISTS idx_lotes_finca
    ON lotes(finca_id);

CREATE INDEX IF NOT EXISTS idx_lotes_cultivo
    ON lotes(cultivo_principal);

CREATE INDEX IF NOT EXISTS idx_hatos_finca
    ON hatos_ganaderos(finca_id);

CREATE INDEX IF NOT EXISTS idx_hatos_especie
    ON hatos_ganaderos(especie);

CREATE INDEX IF NOT EXISTS idx_practicas_finca
    ON practicas_regenerativas(finca_id);

CREATE INDEX IF NOT EXISTS idx_practicas_responsable
    ON practicas_regenerativas(responsable_id);