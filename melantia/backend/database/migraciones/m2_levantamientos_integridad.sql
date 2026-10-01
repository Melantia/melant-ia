-- ===========================================================================
-- MIGRACIÓN M2 — Integridad de levantamientos GPS
-- Auditoría M2 · decisiones B1, B2, B3 (parcial), B4
-- Versión final 2026-09-30 · PENDIENTE DE EJECUCIÓN
--
-- EJECUCIÓN: en una única transacción, sin migración parcial:
--
--     psql -1 -f m2_levantamientos_integridad.sql
--
--   (`psql -1` envuelve todo el archivo en una transacción implícita;
--    además, este script ya trae BEGIN/COMMIT explícito como segunda
--    garantía si se ejecuta con psql normal. Si cualquier sentencia
--    falla, la migración completa hace rollback.)
--
-- ⚠️  "Idempotente" (IF NOT EXISTS / NOT VALID) NO equivale a
--     "atómica": sin la transacción, un fallo a mitad dejaría el
--     esquema a medio migrar. Por eso la ejecución es con -1.
--
-- ALCANCE:
--   B4  mediciones_campo.latitud/longitud/precision_gps_metros
--       REAL → DOUBLE PRECISION (REAL redondea a float32; en lat/lon
--       equivale a ~1–2 m de error — no aceptable para vértices GPS).
--       En esta base las columnas YA están en DOUBLE PRECISION porque
--       el ALTER convive en schema/levantamientos.sql; las sentencias
--       de abajo son no-op idempotentes ahí, pero necesarias en
--       cualquier base creada solo con mediciones_campo.sql antiguo.
--   B3a levantamientos.usuario_id → NOT NULL.
--   B3b levantamientos.estado → CHECK ('borrador','cerrado','aplicado').
--   B1  levantamientos.client_operation_id (nueva) + UNIQUE parcial
--       (usuario_id, client_operation_id) — clave de idempotencia de
--       la OPERACIÓN de creación (la genera el cliente; identifica la
--       operación, no al usuario ni al dispositivo).
--   B2  UNIQUE parcial mediciones_campo(levantamiento_id, orden).
--       Confirmado por auditoría de código: las columnas
--       `levantamiento_id` y `orden` fueron añadidas por
--       schema/levantamientos.sql exclusivamente para vértices GPS, y
--       el único escritor de mediciones_campo es
--       shared/repositories/levantamientos.py (sensor_tipo='GPS').
--       El par (levantamiento_id, orden) identifica exclusivamente
--       un vértice de levantamiento; las mediciones de sensores
--       (Humedad, Temperatura, NPK, pH, EC) no usan esas columnas y
--       quedan fuera del índice por el predicado WHERE.
--
-- EXCLUIDO EXPRESAMENTE (decisiones diferidas):
--   - mediciones_campo.usuario_id → NOT NULL: pendiente de auditar
--     consumidores (mediciones sin usuario podrían existir).
--   - sync_status / hash_integridad: diferido al diseño de Sync.
--
-- PRE-CHEQUEOS (ejecutados 2026-09-30 sobre melantia_db — resultados
-- entre corchetes; repetir antes de aplicar en otra base):
--
--   -- 1) NULLs que harían fallar SET NOT NULL:                [0]
--   SELECT count(*) AS nulos FROM levantamientos WHERE usuario_id IS NULL;
--
--   -- 2) Estados fuera del CHECK:                             [0]
--   SELECT estado, count(*) FROM levantamientos
--   WHERE estado NOT IN ('borrador','cerrado','aplicado')
--   GROUP BY estado;
--
--   -- 3) Vértices duplicados que harían fallar el UNIQUE:     [0]
--   SELECT levantamiento_id, orden, count(*)
--   FROM mediciones_campo
--   WHERE levantamiento_id IS NOT NULL AND orden IS NOT NULL
--   GROUP BY 1, 2 HAVING count(*) > 1;
--
--   -- 4) client_operation_id duplicados (si ya existiera):    [n/a]
--   SELECT usuario_id, client_operation_id, count(*)
--   FROM levantamientos
--   WHERE client_operation_id IS NOT NULL
--   GROUP BY 1, 2 HAVING count(*) > 1;
--
-- REVERSIBILIDAD:
--   - DOUBLE PRECISION: ampliación sin pérdida; revertir a REAL
--     truncaría precisión.
--   - SET NOT NULL: reversible con DROP NOT NULL.
--   - CHECK: reversible con DROP CONSTRAINT.
--   - Índices únicos: reversibles con DROP INDEX.
--   - client_operation_id: reversible con DROP COLUMN (pierde la clave).
-- ===========================================================================

BEGIN;

-- B4 — precisión de coordenadas GPS ------------------------------------------
ALTER TABLE mediciones_campo
    ALTER COLUMN latitud TYPE DOUBLE PRECISION,
    ALTER COLUMN longitud TYPE DOUBLE PRECISION,
    ALTER COLUMN precision_gps_metros TYPE DOUBLE PRECISION;

-- B3a — usuario_id obligatorio en levantamientos ------------------------------
-- FALLA si existen filas con usuario_id NULL (ver pre-chequeo 1).
ALTER TABLE levantamientos
    ALTER COLUMN usuario_id SET NOT NULL;

-- B3b — CHECK de estado.
-- ADD CONSTRAINT ... NOT VALID toma un bloqueo ShareRowExclusive breve
-- sobre la tabla (no escanea filas, pero sí compite con DDL y con otras
-- transacciones que tengan bloqueos incompatibles). VALIDATE CONSTRAINT
-- recorre la tabla bajo ShareUpdateExclusive: permite lecturas y
-- escrituras normales durante la validación, aunque puede esperar si
-- hay transacciones largas abiertas. No es "cero bloqueo": ejecutar en
-- ventana de baja actividad.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_levantamientos_estado'
    ) THEN
        ALTER TABLE levantamientos
            ADD CONSTRAINT chk_levantamientos_estado
            CHECK (estado IN ('borrador', 'cerrado', 'aplicado')) NOT VALID;
    END IF;
END $$;
-- FALLA si hay estados fuera del catálogo (ver pre-chequeo 2).
ALTER TABLE levantamientos VALIDATE CONSTRAINT chk_levantamientos_estado;

-- B1 — clave de idempotencia de la operación de creación (offline-first) ------
ALTER TABLE levantamientos
    ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_levantamientos_client_operation_id
    ON levantamientos (usuario_id, client_operation_id)
    WHERE client_operation_id IS NOT NULL;

-- B2 — un vértice por (levantamiento, orden) ----------------------------------
-- FALLA si hay duplicados (ver pre-chequeo 3).
-- El predicado WHERE limita el índice a vértices GPS; las mediciones
-- de otros sensores (orden IS NULL) no quedan restringidas.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mediciones_levantamiento_orden
    ON mediciones_campo (levantamiento_id, orden)
    WHERE levantamiento_id IS NOT NULL AND orden IS NOT NULL;

COMMIT;

-- ===========================================================================
-- POST-EJECUCIÓN:
--   1. python -m pytest tests/ -x -q        (suite completa del backend)
--   2. Pruebas E2E de levantamientos
--      (crear → puntos → calcular → aplicar, incluido reintento con el
--       mismo client_operation_id).
-- ===========================================================================
