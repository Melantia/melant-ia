-- ============================================================================
-- MELANTIA — Seed: catálogo de perfiles profesionales (EP-4A.1)
-- ----------------------------------------------------------------------------
-- Convención B6: los seeds viven en archivos separados del DDL.
-- Idempotente: ON CONFLICT (codigo) DO NOTHING — re-ejecución segura.
-- Regla EP: `codigo` es identificador semántico; la FK real es `id` (UUID).
-- ----------------------------------------------------------------------------
-- Ejecutado: 2026-09-29 sobre melantia_db.
-- ============================================================================

BEGIN;

INSERT INTO perfiles_profesionales (codigo, nombre, descripcion) VALUES
    ('agronomo',
     'Agrónomo/a',
     'Profesional en agronomía: manejo de cultivos, suelos y producción.'),
    ('veterinario',
     'Médico/a Veterinario/a',
     'Profesional en sanidad y producción animal.'),
    ('tecnico_agricola',
     'Técnico/a Agrícola',
     'Técnico de campo: asistencia productiva y levantamientos.'),
    ('topografo',
     'Topógrafo/a',
     'Profesional en mediciones de terreno y delimitación de predios.'),
    ('administrador_finca',
     'Administrador/a de Finca',
     'Gestión operativa y administrativa de la unidad productiva.'),
    ('consultor_rural',
     'Consultor/a Rural',
     'Asesoría integral rural: negocios, proyectos y comercialización.')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
