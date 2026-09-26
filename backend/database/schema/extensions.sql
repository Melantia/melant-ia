-- ============================================================
-- MELANT IA · Esquema base · 01_extensions
-- Extensiones PostgreSQL requeridas por el MVP.
-- Ejecutar SIEMPRE en primer lugar (el resto del esquema
-- depende de gen_random_uuid(), búsqueda sin acentos y GIS).
-- ============================================================

-- UUID v4 nativo (gen_random_uuid) y utilidades de hashing.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Búsqueda difusa por nombre (fincas, productores, catálogos).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalización de acentos para búsquedas en español.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Geometrías de predios y lotes (puntos GPS y polígonos).
CREATE EXTENSION IF NOT EXISTS postgis;

-- Función común de auditoría: mantiene actualizado_en en cada UPDATE.
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
