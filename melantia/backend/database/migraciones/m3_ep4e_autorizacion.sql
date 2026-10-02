-- ===========================================================================
-- MIGRACIÓN M3 — EP-4E: Autorización contextual del Ecosistema Profesional
-- Diseño aprobado 2026-10-01 · docs/EP_MODELO_DATOS.md §14
--
-- ⚠️  PROPUESTA — NO EJECUTAR sin autorización explícita.
--     Ejecución autorizada: una sola transacción —
--         psql -1 -f backend/database/migraciones/m3_ep4e_autorizacion.sql
--     (idempotente ≠ atómica: el wrapper -1 garantiza todo-o-nada;
--      el BEGIN/COMMIT interno es segunda garantía si se corre sin -1).
--
-- ALCANCE (único objeto nuevo; cero ALTER sobre tablas existentes):
--   ep_proyecto_concesiones — grants contextuales por participante sobre
--   tipo/instancia de recurso del proyecto. Registro histórico: las
--   revocadas NO se borran (estado='revocada' + revocado_por/at).
--
-- REGLAS EMBEBIDAS (decisiones E1–E9 aprobadas):
--   - nivel nunca 'administrar': los techos de rol (E2) se refuerzan en
--     service; 'administrar' no es concedible por grant.
--   - recurso_id sin FK física (E3): precedente D9 — contexto_* suave;
--     un grant huérfano es inerte (sin vínculo vivo no resuelve nada).
--   - unicidad SOLO sobre activas (E9): dos índices únicos parciales
--     cubren instancia (recurso_id NOT NULL) y tipo (recurso_id NULL);
--     un UNIQUE de tabla permitiría duplicados NULL y bloquearía la
--     re-otorgación tras revocar (E1).
--   - retiro del participante → service revoca sus concesiones en la
--     misma operación (E1); reactivación no las restaura.
--
-- PRE-CHEQUEOS (ejecutar ANTES de aplicar; esperados 0/0):
--   -- 1) la tabla no debe existir aún:
--   SELECT count(*) AS existe FROM information_schema.tables
--   WHERE table_name = 'ep_proyecto_concesiones';            -- esperado 0
--   -- 2) participantes huérfanos no deben existir (FK sana):
--   SELECT count(*) FROM ep_proyecto_participantes p
--   WHERE NOT EXISTS (SELECT 1 FROM ep_proyectos e
--                     WHERE e.id = p.proyecto_id);           -- esperado 0
-- ===========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ep_proyecto_concesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    participante_id UUID NOT NULL
        REFERENCES ep_proyecto_participantes(id) ON DELETE CASCADE,
    -- Qué se concede: tipo siempre; instancia opcional (NULL = todos
    -- los recursos de ese tipo dentro del proyecto).
    recurso_tipo VARCHAR(40) NOT NULL
        CHECK (recurso_tipo IN (
            'finca', 'lote', 'levantamiento', 'registro',
            'actividad', 'documento', 'presupuesto', 'resultado'
        )),
    recurso_id UUID,                    -- referencia suave, sin FK
    nivel VARCHAR(20) NOT NULL
        CHECK (nivel IN ('consulta', 'crear', 'editar')),
    otorgado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    vigente_hasta TIMESTAMPTZ,          -- NULL = indefinido
    estado VARCHAR(30) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'revocada')),
    revocado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    revocado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unicidad solo sobre concesiones activas (instancia y tipo).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ep_concesiones_activa_instancia
    ON ep_proyecto_concesiones (participante_id, recurso_tipo, recurso_id)
    WHERE estado = 'activa' AND recurso_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ep_concesiones_activa_tipo
    ON ep_proyecto_concesiones (participante_id, recurso_tipo)
    WHERE estado = 'activa' AND recurso_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ep_concesiones_proyecto
    ON ep_proyecto_concesiones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_concesiones_participante
    ON ep_proyecto_concesiones(participante_id);
CREATE INDEX IF NOT EXISTS idx_ep_concesiones_recurso
    ON ep_proyecto_concesiones(recurso_tipo, recurso_id);

COMMIT;

-- ===========================================================================
-- VERIFICACIÓN POST-EJECUCIÓN:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name='ep_proyecto_concesiones';              -- 1 fila
--   SELECT indexname FROM pg_indexes
--   WHERE tablename='ep_proyecto_concesiones' ORDER BY 1;    -- 5 índices
--   pytest backend/tests — suite completa verde.
-- ===========================================================================
