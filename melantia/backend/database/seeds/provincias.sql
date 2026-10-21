-- ============================================================================
-- MELANTIA — Seed: catálogo geográfico Ecuador (DPA)
-- ----------------------------------------------------------------------------
-- Convención B6: los seeds viven en archivos separados del DDL.
-- Idempotente: re-ejecución segura (ON CONFLICT / NOT EXISTS).
-- Fuente: División Político-Administrativa INEC vía Open Admin Data
--         (CC-BY-4.0) https://github.com/open-admin-data/ecuador-administrative-divisions
-- codigo_inec: código oficial (provincia 2d, cantón 4d, parroquia 6d).
-- ============================================================================

BEGIN;

INSERT INTO provincias (nombre, codigo_inec) VALUES
    ('Azuay', '01'),
    ('Bolívar', '02'),
    ('Cañar', '03'),
    ('Carchi', '04'),
    ('Cotopaxi', '05'),
    ('Chimborazo', '06'),
    ('El Oro', '07'),
    ('Esmeraldas', '08'),
    ('Guayas', '09'),
    ('Imbabura', '10'),
    ('Loja', '11'),
    ('Los Ríos', '12'),
    ('Manabí', '13'),
    ('Morona Santiago', '14'),
    ('Napo', '15'),
    ('Pastaza', '16'),
    ('Pichincha', '17'),
    ('Tungurahua', '18'),
    ('Zamora Chinchipe', '19'),
    ('Galápagos', '20'),
    ('Sucumbíos', '21'),
    ('Orellana', '22'),
    ('Santo Domingo de los Tsáchilas', '23'),
    ('Santa Elena', '24')
ON CONFLICT (codigo_inec) DO NOTHING;
COMMIT;
