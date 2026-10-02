-- ===========================================================================
-- MELANTIA — REGISTROS DE CAMPO + CONTROL DE CUOTA DE ALMACENAMIENTO
-- Extraído de migraciones/migracion_inicial.sql §9–10.
-- Ampliado con las columnas que backend/main.py escribe hoy
-- (DB_AUDIT_PHASE2 P3): especie_afectada, diagnostico_usuario,
-- clasificacion_ia, es_activo_conocimiento, hash_transaccion.
-- Dependencias: usuarios, lotes, uuid-ossp
-- ===========================================================================

CREATE TABLE IF NOT EXISTS registros_campo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    tipo_registro VARCHAR(50) NOT NULL, -- 'plaga', 'enfermedad', 'medicion', 'trazabilidad'
    descripcion TEXT,
    especie_afectada VARCHAR(100),
    diagnostico_usuario TEXT,
    clasificacion_ia VARCHAR(150),
    foto_url TEXT, -- Almacenamiento optimizado local o Supabase Storage (Max 150KB)
    es_activo_conocimiento BOOLEAN DEFAULT FALSE,
    hash_transaccion VARCHAR(64), -- Dedup idempotente offline (no UNIQUE: nullable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registros_campo_user
    ON registros_campo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registros_campo_hash
    ON registros_campo(hash_transaccion);

-- ===========================================================================
-- TRIGGER DE PROTECCIÓN: CONTROL DE CUOTA POR SUSCRIPCIÓN
-- Requiere usuarios.storage_usado_mb (schema/usuarios.sql) y
-- usuarios.tipo_suscripcion.
-- ===========================================================================

CREATE OR REPLACE FUNCTION verificar_limite_almacenamiento_melantia()
RETURNS TRIGGER AS $$
DECLARE
    v_plan VARCHAR(50);
    v_usado NUMERIC(10,2);
    v_limite INT;
BEGIN
    -- Capturar la suscripción actual y el almacenamiento usado por el productor
    SELECT tipo_suscripcion, storage_usado_mb INTO v_plan, v_usado
    FROM usuarios WHERE id = NEW.usuario_id;

    -- Asignación estricta de cuotas en Megabytes (MB)
    v_limite := CASE
        WHEN v_plan = 'Basico' THEN 100
        WHEN v_plan = 'Standard' THEN 500
        WHEN v_plan = 'Empresarial' THEN 2000
        ELSE 50
    END;

    -- Bloquear inserción si el dispositivo o cuenta rebasó su cuota offline/online
    IF v_usado >= v_limite THEN
        RAISE EXCEPTION 'Límite de almacenamiento excedido para plan % (% MB). Optimiza tus evidencias.', v_plan, v_limite;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verificar_espacio_campo ON registros_campo;

CREATE TRIGGER trigger_verificar_espacio_campo
BEFORE INSERT ON registros_campo
FOR EACH ROW EXECUTE FUNCTION verificar_limite_almacenamiento_melantia();
