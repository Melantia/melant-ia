-- ============================================================================
-- MELANTIA
-- MOTOR GENÉRICO DE TRAZABILIDAD
-- ============================================================================
--
-- Permite manejar:
--
--   Cultivos:
--       Cacao
--       Café
--       Plátano
--       etc.
--
--   Producción pecuaria:
--       Bovinos
--       Cerdos
--       Caballos
--       Aves
--       Cabras
--
-- Arquitectura:
--
-- trazabilidad_plantillas
--          │
--          ▼
-- trazabilidad_plantilla_fases
--          │
--          ▼
-- trazabilidades
--          │
--          ├── trazabilidad_fases
--          │          │
--          │          ▼
--          │    trazabilidad_eventos
--          │
--          └── cadena_custodia
--
-- ============================================================================


-- ============================================================================
-- PLANTILLAS DE TRAZABILIDAD
-- ============================================================================
-- Define el proceso general de un producto.
--
-- Ejemplos:
--   CACAO
--   CAFE
--   BOVINOS
--   CERDOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS trazabilidad_plantillas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    codigo VARCHAR(80) NOT NULL UNIQUE,

    nombre VARCHAR(150) NOT NULL,

    tipo_produccion VARCHAR(30) NOT NULL,

    producto VARCHAR(100),

    descripcion TEXT,

    version VARCHAR(30)
        DEFAULT '1.0',

    activo BOOLEAN
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT trazabilidad_plantillas_tipo_check
        CHECK (
            tipo_produccion IN (
                'cultivo',
                'pecuaria'
            )
        )
);


-- ============================================================================
-- FASES DE UNA PLANTILLA
-- ============================================================================

CREATE TABLE IF NOT EXISTS trazabilidad_plantilla_fases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plantilla_id UUID NOT NULL
        REFERENCES trazabilidad_plantillas(id)
        ON DELETE CASCADE,

    paso INT NOT NULL,

    codigo_fase VARCHAR(80) NOT NULL,

    titulo VARCHAR(200) NOT NULL,

    descripcion TEXT,

    orden INT NOT NULL,

    obligatoria BOOLEAN
        DEFAULT TRUE,

    configuracion JSONB,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT plantilla_fase_paso_positivo
        CHECK (paso > 0),

    CONSTRAINT plantilla_fase_orden_positiva
        CHECK (orden > 0),

    CONSTRAINT plantilla_fase_unica
        UNIQUE (plantilla_id, paso)
);


-- ============================================================================
-- TRAZABILIDADES REALES
-- ============================================================================
-- Una fila representa una trazabilidad concreta de una finca/lote/hato.
-- ============================================================================

CREATE TABLE IF NOT EXISTS trazabilidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    finca_id UUID NOT NULL
        REFERENCES fincas(id)
        ON DELETE CASCADE,

    lote_id UUID
        REFERENCES lotes(id)
        ON DELETE SET NULL,

    hato_id UUID
        REFERENCES hatos_ganaderos(id)
        ON DELETE SET NULL,

    plantilla_id UUID NOT NULL
        REFERENCES trazabilidad_plantillas(id),

    tipo_produccion VARCHAR(30) NOT NULL,

    producto VARCHAR(100) NOT NULL,

    codigo_trazabilidad VARCHAR(100) NOT NULL UNIQUE,

    estado VARCHAR(30)
        DEFAULT 'activa',

    sync_status VARCHAR(20)
        DEFAULT 'pending',

    hash_integridad VARCHAR(64),

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT trazabilidad_tipo_check
        CHECK (
            tipo_produccion IN (
                'cultivo',
                'pecuaria'
            )
        ),

    CONSTRAINT trazabilidad_estado_check
        CHECK (
            estado IN (
                'activa',
                'cerrada',
                'anulada'
            )
        ),

    CONSTRAINT trazabilidad_sync_check
        CHECK (
            sync_status IN (
                'pending',
                'syncing',
                'synced',
                'failed',
                'conflict'
            )
        ),

    CONSTRAINT trazabilidad_origen_check
        CHECK (
            (lote_id IS NOT NULL AND hato_id IS NULL)
            OR
            (lote_id IS NULL AND hato_id IS NOT NULL)
        )
);


-- ============================================================================
-- FASES DE UNA TRAZABILIDAD REAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS trazabilidad_fases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    trazabilidad_id UUID NOT NULL
        REFERENCES trazabilidades(id)
        ON DELETE CASCADE,

    plantilla_fase_id UUID
        REFERENCES trazabilidad_plantilla_fases(id)
        ON DELETE SET NULL,

    paso INT NOT NULL,

    codigo_fase VARCHAR(80) NOT NULL,

    titulo VARCHAR(200) NOT NULL,

    descripcion TEXT,

    estado VARCHAR(30)
        DEFAULT 'pendiente',

    fecha_inicio TIMESTAMPTZ,

    fecha_completado TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT trazabilidad_fase_estado_check
        CHECK (
            estado IN (
                'pendiente',
                'en_proceso',
                'completada',
                'bloqueada',
                'omitida'
            )
        ),

    CONSTRAINT trazabilidad_fase_unica
        UNIQUE (trazabilidad_id, paso)
);


-- ============================================================================
-- EVENTOS DE TRAZABILIDAD
-- ============================================================================
-- Registra hechos concretos.
--
-- Ejemplos:
--   siembra
--   fertilización
--   cosecha
--   fermentación
--   secado
--   transporte
--   acopio
--   vacunación
--   movimiento animal
-- ============================================================================

CREATE TABLE IF NOT EXISTS trazabilidad_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    trazabilidad_id UUID NOT NULL
        REFERENCES trazabilidades(id)
        ON DELETE CASCADE,

    fase_id UUID
        REFERENCES trazabilidad_fases(id)
        ON DELETE SET NULL,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    tipo_evento VARCHAR(100) NOT NULL,

    fecha_evento TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    cantidad NUMERIC(14, 3),

    unidad VARCHAR(30),

    descripcion TEXT,

    ubicacion TEXT,

    datos JSONB,

    sync_status VARCHAR(20)
        DEFAULT 'pending',

    hash_integridad VARCHAR(64),

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT evento_sync_check
        CHECK (
            sync_status IN (
                'pending',
                'syncing',
                'synced',
                'failed',
                'conflict'
            )
        )
);


-- ============================================================================
-- CADENA DE CUSTODIA
-- ============================================================================
-- Conecta un evento de origen con un evento de destino.
--
-- Ejemplo:
--
-- cosecha
--    ↓
-- batch
--    ↓
-- acopio
--    ↓
-- transporte
--    ↓
-- transformación
-- ============================================================================

CREATE TABLE IF NOT EXISTS cadena_custodia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    trazabilidad_id UUID NOT NULL
        REFERENCES trazabilidades(id)
        ON DELETE CASCADE,

    evento_origen_id UUID
        REFERENCES trazabilidad_eventos(id)
        ON DELETE SET NULL,

    evento_destino_id UUID
        REFERENCES trazabilidad_eventos(id)
        ON DELETE SET NULL,

    harvest_id VARCHAR(100),

    batch_id VARCHAR(100),

    cantidad NUMERIC(14, 3),

    unidad VARCHAR(30),

    fecha_movimiento TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    estado VARCHAR(30)
        DEFAULT 'activo',

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trazabilidad_plantillas_tipo
    ON trazabilidad_plantillas(tipo_produccion);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_plantilla_fases
    ON trazabilidad_plantilla_fases(plantilla_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidades_usuario
    ON trazabilidades(usuario_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidades_finca
    ON trazabilidades(finca_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidades_lote
    ON trazabilidades(lote_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidades_hato
    ON trazabilidades(hato_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidades_producto
    ON trazabilidades(producto);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_fases_trazabilidad
    ON trazabilidad_fases(trazabilidad_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_trazabilidad
    ON trazabilidad_eventos(trazabilidad_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_fecha
    ON trazabilidad_eventos(fecha_evento);

CREATE INDEX IF NOT EXISTS idx_cadena_custodia_trazabilidad
    ON cadena_custodia(trazabilidad_id);

CREATE INDEX IF NOT EXISTS idx_cadena_custodia_batch
    ON cadena_custodia(batch_id);