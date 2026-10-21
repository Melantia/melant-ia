-- ===========================================================================
-- MIGRACIÓN M7 — Unicidad de codigo_inec en cantones y parroquias
-- Catálogo geográfico DPA Ecuador · cierra la brecha detectada en la
-- auditoría del 2026-10-20 (provincias.codigo_inec ya era UNIQUE).
-- Versión 2026-10-20 · ⚠️  PROPUESTA — NO EJECUTAR sin autorización
--                        explícita del propietario.
--
-- EJECUCIÓN (cuando se autorice): en una única transacción —
--
--     psql -1 -f backend/database/migraciones/m7_geografia_inec_unicidad.sql
--
--   (psql -1 envuelve el archivo en una transacción; el BEGIN/COMMIT
--    interno es segunda garantía si se corre sin -1. Un fallo a mitad
--    revierte la migración completa.)
--
--   Aviso cosmético: al combinar `psql -1` con el BEGIN/COMMIT interno
--   psql emite "there is already a transaction in progress" / "there
--   is no transaction in progress". Son inofensivos — el COMMIT
--   interno cierra la transacción real y los índices quedan
--   aplicados; verificado 2026-10-20 en melantia_db y melantia_test.
--
-- ALCANCE (dos objetos nuevos; cero ALTER sobre columnas/datos —
-- migración aditiva, rollback = DROP INDEX):
--
--   uq_cantones_codigo_inec   — UNIQUE sobre cantones(codigo_inec)
--   uq_parroquias_codigo_inec — UNIQUE sobre parroquias(codigo_inec)
--
--   Justificación: codigo_inec es el identificador oficial DPA/INEC
--   (cantón = provincia[2d]+cantón[2d]; parroquia = cantón[4d]+
--   parroquia[2d]). Es único por naturaleza en todo el país;
--   provincias.codigo_inec ya lo declara UNIQUE en geografia.sql.
--   Sin la restricción, una doble ejecución de seeds no idempotentes
--   o un importador defectuoso podría duplicar divisiones
--   administrativas sin que la BD lo detecte.
--
--   Por qué índice completo (no parcial): codigo_inec es NOT NULL en
--   el esquema y el catálogo no contempla filas sin código; un NULL
--   sería dato inválido, no "sin clave de dedup" como en m6.
--
--   Por qué NO CONCURRENTLY: tablas de catálogo pequeñas (221 y
--   1.042 filas); el bloqueo de escritura dura milisegundos y la
--   convención del proyecto exige transacción única (-1).
--
--   schema/geografia.sql se actualiza en el mismo cambio para que
--   las instalaciones nuevas declaren la restricción de forma
--   nativa (UNIQUE inline), sin depender de m7.
--
--   Nota: los seeds seeds/cantones.sql y seeds/parroquias.sql ya se
--   protegen con NOT EXISTS; tras m7 la protección queda
--   garantizada a nivel de base de datos.
--
-- PRE-CHEQUEOS (ejecutados 2026-10-20 sobre melantia_db y
-- melantia_test — resultados entre corchetes; repetir antes de
-- aplicar en otra base):
--
--   SELECT codigo_inec, count(*) FROM cantones
--   GROUP BY 1 HAVING count(*) > 1;                      [0 filas]
--   SELECT codigo_inec, count(*) FROM parroquias
--   GROUP BY 1 HAVING count(*) > 1;                      [0 filas]
--   SELECT count(*) FROM cantones
--   WHERE codigo_inec !~ '^[0-9]{4}$';                        [0]
--   SELECT count(*) FROM parroquias
--   WHERE codigo_inec !~ '^[0-9]{6}$';                        [0]
--   -- correspondencia prefijo ↔ FK real:
--   SELECT count(*) FROM cantones c JOIN provincias p
--   ON p.id = c.provincia_id
--   WHERE left(c.codigo_inec,2) <> p.codigo_inec;             [0]
--   SELECT count(*) FROM parroquias pa JOIN cantones c
--   ON c.id = pa.canton_id
--   WHERE left(pa.codigo_inec,4) <> c.codigo_inec;            [0]
--   -- huérfanos FK: [0] en ambas direcciones
--   -- Sin duplicados ni datos inválidos: los índices se crean
--   -- limpios. Si aparecieran duplicados en otra base, resolución
--   -- manual ANTES de aplicar; nunca deduplicar automáticamente.
--
-- VERIFICACIÓN POST-APLICACIÓN:
--
--   SELECT indexname FROM pg_indexes
--   WHERE tablename IN ('cantones','parroquias')
--     AND indexname LIKE 'uq_%';
--   -- Debe listar uq_cantones_codigo_inec y
--   -- uq_parroquias_codigo_inec.
--
--   -- Duplicado rechazado (espera ERROR 23505):
--   -- INSERT INTO cantones (provincia_id, nombre, codigo_inec)
--   --   SELECT provincia_id, 'X', codigo_inec FROM cantones
--   --   WHERE codigo_inec='0101';
-- ===========================================================================

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cantones_codigo_inec
    ON cantones (codigo_inec);

CREATE UNIQUE INDEX IF NOT EXISTS uq_parroquias_codigo_inec
    ON parroquias (codigo_inec);

COMMIT;
