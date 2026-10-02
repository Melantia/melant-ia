-- ===========================================================================
-- USUARIOS MELANTIA
-- Productores, compradores, transportistas y demás usuarios
-- ===========================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    nombre VARCHAR(150) NOT NULL,

    cedula_ruc VARCHAR(20) UNIQUE NOT NULL,

    firma_digital TEXT,

    provincia_id INT
        REFERENCES provincias(id),

    canton_id INT
        REFERENCES cantones(id),

    parroquia_id INT
        REFERENCES parroquias(id),

    sector_comunidad VARCHAR(150) NOT NULL,

    contacto VARCHAR(100),

    tipo_suscripcion VARCHAR(50)
        DEFAULT 'Standard',

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP

);

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS storage_usado_mb NUMERIC(10,2) DEFAULT 0.00;

-- Soporte de autenticación local (aditivo, no destructivo).
-- NULL en usuarios históricos: deberán registrar contraseña antes
-- de poder emitir tokens JWT por /api/auth/login.
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);