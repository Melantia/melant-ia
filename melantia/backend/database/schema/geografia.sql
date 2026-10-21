-- ===========================================================================
-- GEOGRAFÍA Y CATÁLOGOS - ECUADOR
-- ===========================================================================

CREATE TABLE IF NOT EXISTS provincias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cantones (
    id SERIAL PRIMARY KEY,
    provincia_id INT NOT NULL
        REFERENCES provincias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS parroquias (
    id SERIAL PRIMARY KEY,
    canton_id INT NOT NULL
        REFERENCES cantones(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ciiu (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL
);