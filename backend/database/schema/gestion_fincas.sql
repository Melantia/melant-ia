-- ============================================================
-- MELANT IA · Esquema base · 04_gestion_fincas
-- Fincas, lotes, cultivos y trazabilidad mínima del MVP.
-- Consolida los scripts SQLite sueltos de melant_ia/src/database
-- (agro_melant_ia.sql, sql_panel_multiusuario.sql).
-- Depende de: extensions.sql, geografia.sql, usuarios.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS fincas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre            TEXT NOT NULL,
    propietario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    provincia_id      INTEGER REFERENCES provincias(id),
    canton_id         INTEGER REFERENCES cantones(id),
    parroquia_id      INTEGER REFERENCES parroquias(id),
    sector            TEXT,
    ciiu_id           INTEGER REFERENCES ciiu(id),
    superficie_ha     NUMERIC(10, 2) CHECK (superficie_ha >= 0),
    ubicacion         GEOGRAPHY(POINT, 4326),
    perimetro         GEOGRAPHY(POLYGON, 4326),
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Acceso compartido: técnicos e invitados sobre una finca.
CREATE TABLE IF NOT EXISTS usuarios_fincas (
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    finca_id      UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    rol           TEXT NOT NULL CHECK (rol IN ('propietario', 'tecnico', 'invitado')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, finca_id)
);

CREATE TABLE IF NOT EXISTS lotes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finca_id          UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre            TEXT NOT NULL,
    superficie_ha     NUMERIC(10, 2) CHECK (superficie_ha >= 0),
    perimetro         GEOGRAPHY(POLYGON, 4326),
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (finca_id, nombre)
);

CREATE TABLE IF NOT EXISTS cultivos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id           UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    tipo_cultivo      TEXT NOT NULL,          -- Café, Cacao, Maíz, Palma…
    variedad          TEXT,
    fecha_siembra     DATE,
    fecha_cosecha     DATE,
    estado_salud      TEXT CHECK (estado_salud IN ('sano', 'observacion', 'afectado')),
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bitácora de labores de campo (siembra, riego, fumigación, cosecha…).
CREATE TABLE IF NOT EXISTS actividades (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finca_id          UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    lote_id           UUID REFERENCES lotes(id) ON DELETE SET NULL,
    usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo              TEXT NOT NULL,
    descripcion       TEXT,
    fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
    datos             JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidencias (fotos, PDF, certificados) asociadas a finca o actividad.
CREATE TABLE IF NOT EXISTS evidencias (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finca_id          UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    actividad_id      UUID REFERENCES actividades(id) ON DELETE SET NULL,
    usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo              TEXT NOT NULL CHECK (tipo IN ('foto', 'documento', 'audio', 'otro')),
    ruta_archivo      TEXT NOT NULL,
    hash_archivo      TEXT,
    ubicacion         GEOGRAPHY(POINT, 4326),
    sincronizado      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fincas_propietario   ON fincas(propietario_id);
CREATE INDEX IF NOT EXISTS idx_fincas_provincia     ON fincas(provincia_id);
CREATE INDEX IF NOT EXISTS idx_fincas_ubicacion     ON fincas USING gist (ubicacion);
CREATE INDEX IF NOT EXISTS idx_lotes_finca          ON lotes(finca_id);
CREATE INDEX IF NOT EXISTS idx_cultivos_lote        ON cultivos(lote_id);
CREATE INDEX IF NOT EXISTS idx_cultivos_tipo        ON cultivos(tipo_cultivo);
CREATE INDEX IF NOT EXISTS idx_actividades_finca    ON actividades(finca_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha    ON actividades(fecha);
CREATE INDEX IF NOT EXISTS idx_evidencias_finca     ON evidencias(finca_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_sync      ON evidencias(sincronizado);

DROP TRIGGER IF EXISTS trg_fincas_actualizado_en ON fincas;
CREATE TRIGGER trg_fincas_actualizado_en
    BEFORE UPDATE ON fincas
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

DROP TRIGGER IF EXISTS trg_lotes_actualizado_en ON lotes;
CREATE TRIGGER trg_lotes_actualizado_en
    BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

DROP TRIGGER IF EXISTS trg_cultivos_actualizado_en ON cultivos;
CREATE TRIGGER trg_cultivos_actualizado_en
    BEFORE UPDATE ON cultivos
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
