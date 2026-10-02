-- ============================================================================
-- MELANTIA
-- MÓDULO: NEGOCIOS RURALES
-- VERSIÓN: 2.0
-- PostgreSQL / Supabase
--
-- Arquitectura:
--
-- RED SOCIAL COMERCIAL RURAL
--          |
--     +----+----+
--     |         |
--   OFERTA    DEMANDA
--     |         |
--     +----+----+
--          |
--       BOLSA
--          |
--    OPORTUNIDADES
--          |
--      NEGOCIACIÓN
--          |
--     TRANSACCIÓN
--          |
--       3% MELANTIA
--
-- FERIAS = capa de dinamización comercial transversal
-- ============================================================================


-- ============================================================================
-- 0. REQUISITO
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- 1. PERFIL COMERCIAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS perfiles_comerciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    usuario_id UUID NOT NULL UNIQUE
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    nombre_comercial VARCHAR(150),

    descripcion TEXT,

    actividad_principal VARCHAR(150),

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    mostrar_ubicacion BOOLEAN NOT NULL DEFAULT TRUE,

    reputacion NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (
            reputacion >= 0
            AND reputacion <= 5
        ),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 2. RED SOCIAL COMERCIAL RURAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS publicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    autor_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    tipo_publicacion VARCHAR(20) NOT NULL
        CHECK (
            tipo_publicacion IN (
                'social',
                'oferta',
                'demanda',
                'pregunta',
                'conocimiento'
            )
        ),

    contenido TEXT NOT NULL
        CHECK (
            char_length(contenido) BETWEEN 5 AND 2000
        ),

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    /*
        Control de privacidad.

        TRUE:
        Se permite mostrar la ubicación territorial configurada.

        FALSE:
        La ubicación no se expone públicamente.
    */
    mostrar_ubicacion BOOLEAN NOT NULL DEFAULT TRUE,

    likes_count INTEGER NOT NULL DEFAULT 0
        CHECK (likes_count >= 0),

    /*
        Una publicación puede convertirse posteriormente
        en una operación comercial.

        No se crea automáticamente.
    */
    oferta_id UUID,

    demanda_id UUID,

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    /*
        Una publicación que no sea OFERTA o DEMANDA
        no puede apuntar a una operación comercial.
    */
    CONSTRAINT publicaciones_tipo_operacion_ck
    CHECK (
        (
            tipo_publicacion = 'oferta'
            AND demanda_id IS NULL
        )
        OR
        (
            tipo_publicacion = 'demanda'
            AND oferta_id IS NULL
        )
        OR
        (
            tipo_publicacion IN (
                'social',
                'pregunta',
                'conocimiento'
            )
            AND oferta_id IS NULL
            AND demanda_id IS NULL
        )
    )
);


-- ============================================================================
-- 3. COMENTARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    publicacion_id UUID NOT NULL
        REFERENCES publicaciones(id)
        ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    contenido TEXT NOT NULL
        CHECK (
            char_length(contenido) BETWEEN 1 AND 1000
        ),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 4. BOLSA AGROPECUARIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS bolsa_ofertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    /*
        venta:
            El usuario ofrece un producto/servicio.

        compra:
            El usuario busca comprar un producto/servicio.
    */
    tipo_oferta VARCHAR(20) NOT NULL
        CHECK (
            tipo_oferta IN (
                'venta',
                'compra'
            )
        ),

    rol_emisor VARCHAR(80) NOT NULL,

    producto_servicio VARCHAR(255) NOT NULL,

    categoria VARCHAR(100),

    /*
        Cantidad estructurada.
        NO usar:
            "2 toneladas"
            "500 cajas"

        Usar:
            cantidad = 2000
            unidad = kg
    */
    cantidad NUMERIC(14,3) NOT NULL
        CHECK (cantidad > 0),

    unidad VARCHAR(30) NOT NULL,

    precio_sugerido NUMERIC(14,2) NOT NULL
        CHECK (precio_sugerido >= 0),

    moneda CHAR(3) NOT NULL DEFAULT 'USD',

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    disponibilidad_desde DATE,

    disponibilidad_hasta DATE,

    estado VARCHAR(30) NOT NULL DEFAULT 'abierta'
        CHECK (
            estado IN (
                'abierta',
                'en_negociacion',
                'cerrada',
                'cancelada',
                'expirada'
            )
        ),

    comprador_o_productor_acepta_id UUID
        REFERENCES usuarios(id),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT bolsa_fecha_disponibilidad_ck
    CHECK (
        disponibilidad_hasta IS NULL
        OR disponibilidad_desde IS NULL
        OR disponibilidad_hasta >= disponibilidad_desde
    )
);


-- ============================================================================
-- 5. OPORTUNIDADES COMERCIALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    /*
        La oferta siempre debe representar una VENTA.
    */
    oferta_id UUID NOT NULL
        REFERENCES bolsa_ofertas(id)
        ON DELETE CASCADE,

    /*
        La demanda siempre debe representar una COMPRA.
    */
    demanda_id UUID NOT NULL
        REFERENCES bolsa_ofertas(id)
        ON DELETE CASCADE,

    porcentaje_coincidencia NUMERIC(5,2)
        CHECK (
            porcentaje_coincidencia >= 0
            AND porcentaje_coincidencia <= 100
        ),

    motivo_coincidencia TEXT,

    estado VARCHAR(30) NOT NULL DEFAULT 'detectada'
        CHECK (
            estado IN (
                'detectada',
                'notificada',
                'aceptada',
                'rechazada',
                'cerrada'
            )
        ),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    /*
        Evita que una operación se empareje consigo misma.
    */
    CONSTRAINT oportunidad_no_autoemparejamiento
    CHECK (
        oferta_id <> demanda_id
    ),

    /*
        Evita duplicar exactamente la misma oportunidad.
    */
    CONSTRAINT oportunidad_unica
    UNIQUE (
        oferta_id,
        demanda_id
    )
);


-- ============================================================================
-- 6. FERIAS VIRTUALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ferias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    nombre VARCHAR(200) NOT NULL,

    descripcion TEXT,

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,

    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,

    estado VARCHAR(30) NOT NULL DEFAULT 'programada'
        CHECK (
            estado IN (
                'programada',
                'activa',
                'finalizada',
                'cancelada'
            )
        ),

    /*
        La Feria como evento no cobra entrada.
        La monetización de MELANTIA ocurre mediante
        la comisión de las transacciones.
    */
    acceso_gratuito BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT feria_fechas_ck
    CHECK (
        fecha_fin > fecha_inicio
    )
);


-- ============================================================================
-- 7. PARTICIPANTES DE FERIAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS feria_participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    feria_id UUID NOT NULL
        REFERENCES ferias(id)
        ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    rol VARCHAR(40) NOT NULL DEFAULT 'participante'
        CHECK (
            rol IN (
                'participante',
                'vendedor',
                'comprador',
                'organizador'
            )
        ),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT feria_usuario_unico
    UNIQUE (
        feria_id,
        usuario_id
    )
);


-- ============================================================================
-- 8. RELACIÓN FERIA - BOLSA
--
-- Una oferta/demanda existente puede participar en una Feria.
-- ============================================================================

CREATE TABLE IF NOT EXISTS feria_operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    feria_id UUID NOT NULL
        REFERENCES ferias(id)
        ON DELETE CASCADE,

    bolsa_id UUID NOT NULL
        REFERENCES bolsa_ofertas(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT feria_operacion_unica
    UNIQUE (
        feria_id,
        bolsa_id
    )
);


-- ============================================================================
-- 9. TRANSACCIONES COMERCIALES
--
-- AQUÍ se calcula el 3%.
--
-- La publicación de una oferta NO genera comisión.
-- La apertura de una demanda NO genera comisión.
-- La Feria NO genera comisión.
--
-- La comisión aparece cuando existe una transacción.
-- ============================================================================

CREATE TABLE IF NOT EXISTS transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    oferta_id UUID
        REFERENCES bolsa_ofertas(id),

    demanda_id UUID
        REFERENCES bolsa_ofertas(id),

    vendedor_id UUID NOT NULL
        REFERENCES usuarios(id),

    comprador_id UUID NOT NULL
        REFERENCES usuarios(id),

    cantidad NUMERIC(14,3) NOT NULL
        CHECK (cantidad > 0),

    unidad VARCHAR(30) NOT NULL,

    precio_unitario NUMERIC(14,2) NOT NULL
        CHECK (precio_unitario >= 0),

    valor_bruto NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (valor_bruto >= 0),

    /*
        Porcentaje configurable para que en el futuro
        MELANTIA pueda modificar su política comercial
        sin alterar la estructura de la transacción.
    */
    porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 3.00
        CHECK (
            porcentaje_comision >= 0
            AND porcentaje_comision <= 100
        ),

    comision_app NUMERIC(14,2) NOT NULL DEFAULT 0,

    valor_neto_vendedor NUMERIC(14,2) NOT NULL DEFAULT 0,

    moneda CHAR(3) NOT NULL DEFAULT 'USD',

    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (
            estado IN (
                'pendiente',
                'confirmada',
                'pagada',
                'liquidada',
                'cancelada'
            )
        ),

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    /*
        El comprador y vendedor no pueden ser la misma cuenta.
    */
    CONSTRAINT transaccion_partes_diferentes_ck
    CHECK (
        vendedor_id <> comprador_id
    )
);


-- ============================================================================
-- 10. FUNCIÓN CENTRAL DEL 3%
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_comision_transaccion_melantia()
RETURNS TRIGGER AS $$
BEGIN

    /*
        Valor bruto:
        cantidad x precio unitario
    */
    NEW.valor_bruto :=
        ROUND(
            NEW.cantidad * NEW.precio_unitario,
            2
        );

    /*
        Comisión MELANTIA.
    */
    NEW.comision_app :=
        ROUND(
            NEW.valor_bruto
            * NEW.porcentaje_comision
            / 100,
            2
        );

    /*
        Valor que recibe el vendedor.
    */
    NEW.valor_neto_vendedor :=
        NEW.valor_bruto
        - NEW.comision_app;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 11. TRIGGER DE COMISIÓN
-- ============================================================================

DROP TRIGGER IF EXISTS
trigger_comision_transaccion_melantia
ON transacciones;

CREATE TRIGGER trigger_comision_transaccion_melantia

BEFORE INSERT OR UPDATE

ON transacciones

FOR EACH ROW

EXECUTE FUNCTION calcular_comision_transaccion_melantia();


-- ============================================================================
-- 12. ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at_melantia()
RETURNS TRIGGER AS $$
BEGIN

    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS
trigger_updated_at_perfiles_comerciales
ON perfiles_comerciales;

CREATE TRIGGER trigger_updated_at_perfiles_comerciales

BEFORE UPDATE
ON perfiles_comerciales

FOR EACH ROW

EXECUTE FUNCTION actualizar_updated_at_melantia();


DROP TRIGGER IF EXISTS
trigger_updated_at_publicaciones
ON publicaciones;

CREATE TRIGGER trigger_updated_at_publicaciones

BEFORE UPDATE
ON publicaciones

FOR EACH ROW

EXECUTE FUNCTION actualizar_updated_at_melantia();


DROP TRIGGER IF EXISTS
trigger_updated_at_bolsa
ON bolsa_ofertas;

CREATE TRIGGER trigger_updated_at_bolsa

BEFORE UPDATE
ON bolsa_ofertas

FOR EACH ROW

EXECUTE FUNCTION actualizar_updated_at_melantia();


DROP TRIGGER IF EXISTS
trigger_updated_at_ferias
ON ferias;

CREATE TRIGGER trigger_updated_at_ferias

BEFORE UPDATE
ON ferias

FOR EACH ROW

EXECUTE FUNCTION actualizar_updated_at_melantia();


DROP TRIGGER IF EXISTS
trigger_updated_at_transacciones
ON transacciones;

CREATE TRIGGER trigger_updated_at_transacciones

BEFORE UPDATE
ON transacciones

FOR EACH ROW

EXECUTE FUNCTION actualizar_updated_at_melantia();


-- ============================================================================
-- 13. ÍNDICES
-- ============================================================================

-- PUBLICACIONES

CREATE INDEX IF NOT EXISTS idx_publicaciones_fecha
    ON publicaciones(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publicaciones_tipo
    ON publicaciones(tipo_publicacion);

CREATE INDEX IF NOT EXISTS idx_publicaciones_autor
    ON publicaciones(autor_id);

CREATE INDEX IF NOT EXISTS idx_publicaciones_provincia
    ON publicaciones(provincia_id);

CREATE INDEX IF NOT EXISTS idx_publicaciones_canton
    ON publicaciones(canton_id);


-- COMENTARIOS

CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion
    ON comentarios(publicacion_id);

CREATE INDEX IF NOT EXISTS idx_comentarios_usuario
    ON comentarios(usuario_id);


-- BOLSA

CREATE INDEX IF NOT EXISTS idx_bolsa_usuario
    ON bolsa_ofertas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_bolsa_tipo
    ON bolsa_ofertas(tipo_oferta);

CREATE INDEX IF NOT EXISTS idx_bolsa_producto
    ON bolsa_ofertas(producto_servicio);

CREATE INDEX IF NOT EXISTS idx_bolsa_categoria
    ON bolsa_ofertas(categoria);

CREATE INDEX IF NOT EXISTS idx_bolsa_estado
    ON bolsa_ofertas(estado);

CREATE INDEX IF NOT EXISTS idx_bolsa_provincia
    ON bolsa_ofertas(provincia_id);

CREATE INDEX IF NOT EXISTS idx_bolsa_canton
    ON bolsa_ofertas(canton_id);


-- OPORTUNIDADES

CREATE INDEX IF NOT EXISTS idx_oportunidades_oferta
    ON oportunidades(oferta_id);

CREATE INDEX IF NOT EXISTS idx_oportunidades_demanda
    ON oportunidades(demanda_id);

CREATE INDEX IF NOT EXISTS idx_oportunidades_estado
    ON oportunidades(estado);


-- FERIAS

CREATE INDEX IF NOT EXISTS idx_ferias_fecha
    ON ferias(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_ferias_estado
    ON ferias(estado);

CREATE INDEX IF NOT EXISTS idx_ferias_provincia
    ON ferias(provincia_id);


-- TRANSACCIONES

CREATE INDEX IF NOT EXISTS idx_transacciones_vendedor
    ON transacciones(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_transacciones_comprador
    ON transacciones(comprador_id);

CREATE INDEX IF NOT EXISTS idx_transacciones_estado
    ON transacciones(estado);

CREATE INDEX IF NOT EXISTS idx_transacciones_fecha
    ON transacciones(created_at DESC);


-- ============================================================================
-- 14. RELACIONES DE PUBLICACIÓN CON BOLSA
-- ============================================================================
--
-- Se agregan después de crear ambas tablas para evitar
-- problemas de referencia circular.
--

ALTER TABLE publicaciones
    DROP CONSTRAINT IF EXISTS publicaciones_oferta_fk;

ALTER TABLE publicaciones
    ADD CONSTRAINT publicaciones_oferta_fk
    FOREIGN KEY (oferta_id)
    REFERENCES bolsa_ofertas(id)
    ON DELETE SET NULL;


ALTER TABLE publicaciones
    DROP CONSTRAINT IF EXISTS publicaciones_demanda_fk;

ALTER TABLE publicaciones
    ADD CONSTRAINT publicaciones_demanda_fk
    FOREIGN KEY (demanda_id)
    REFERENCES bolsa_ofertas(id)
    ON DELETE SET NULL;


-- ============================================================================
-- 15. ÍNDICES ÚNICOS PARA EVITAR CONVERSIONES DUPLICADAS
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_publicacion_una_oferta
ON publicaciones(oferta_id)
WHERE oferta_id IS NOT NULL;


CREATE UNIQUE INDEX IF NOT EXISTS
idx_publicacion_una_demanda
ON publicaciones(demanda_id)
WHERE demanda_id IS NOT NULL;


-- ============================================================================
-- FIN DEL MÓDULO NEGOCIOS RURALES v2
-- ============================================================================