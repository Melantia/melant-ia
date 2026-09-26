-- ============================================================
-- MELANT IA · Esquema base · 02_geografia
-- División político-administrativa del Ecuador (códigos INEC)
-- y catálogo CIIU usado por fincas y productores.
-- Depende de: extensions.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS provincias (
    id            SERIAL PRIMARY KEY,
    nombre        TEXT NOT NULL,
    codigo_inec   TEXT NOT NULL UNIQUE,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cantones (
    id            SERIAL PRIMARY KEY,
    provincia_id  INTEGER NOT NULL REFERENCES provincias(id) ON DELETE CASCADE,
    nombre        TEXT NOT NULL,
    codigo_inec   TEXT NOT NULL UNIQUE,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parroquias (
    id            SERIAL PRIMARY KEY,
    canton_id     INTEGER NOT NULL REFERENCES cantones(id) ON DELETE CASCADE,
    nombre        TEXT NOT NULL,
    codigo_inec   TEXT NOT NULL UNIQUE,
    tipo          TEXT CHECK (tipo IN ('urbana', 'rural')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clasificación Industrial Internacional Uniforme (actividad económica).
CREATE TABLE IF NOT EXISTS ciiu (
    id            SERIAL PRIMARY KEY,
    codigo        TEXT NOT NULL UNIQUE,
    descripcion   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cantones_provincia   ON cantones(provincia_id);
CREATE INDEX IF NOT EXISTS idx_parroquias_canton    ON parroquias(canton_id);
CREATE INDEX IF NOT EXISTS idx_provincias_nombre    ON provincias USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cantones_nombre      ON cantones USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_parroquias_nombre    ON parroquias USING gin (nombre gin_trgm_ops);
