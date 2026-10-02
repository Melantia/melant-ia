
-- Habilitar extensión nativa para generación de UUIDs distribuida
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS: decisión pendiente (PHASE2_ARCHITECTURE_DECISIONS §B1).
-- No incluido en PostgreSQL 17 vanilla; ninguna columna lo usa aún.
-- Descomentar solo si se instala la extensión en el servidor.
-- CREATE EXTENSION IF NOT EXISTS postgis;