-- ===========================================================================
-- MELANTIA MVP - PLANO MAESTRO DE BASE DE DATOS FUSIONADO Y DEFINITIVO
-- Compatibilidad: Supabase (PostgreSQL) + Estructura Geopolítica INEC Ecuador
-- Enfoque: Sincronización Distribuida mediante UUIDs (Offline-First)
-- Ubicación: E:\Desktop\MELANTIA\melantia\migracion_inicial.sql
-- Codificación: UTF-8 Estricto (Manejo correcto de tildes y eñes)
-- ===========================================================================

-- Habilitar extensión nativa para generación de UUIDs distribuida
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================================
-- 1. TABLAS DE CATÁLOGO GEOPOLÍTICO (INEC ECUADOR)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS provincias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cantones (
    id SERIAL PRIMARY KEY,
    provincia_id INT NOT NULL REFERENCES provincias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS parroquias (
    id SERIAL PRIMARY KEY,
    canton_id INT NOT NULL REFERENCES cantones(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo_inec VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS ciiu (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL
);

-- ===========================================================================
-- 2. TABLAS CORE DE USUARIOS (PRODUCTORES, COMPRADORES, TRANSPORTISTAS)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    cedula_ruc VARCHAR(20) UNIQUE NOT NULL,
    firma_digital TEXT, -- Hash o cadena de verificación local
    provincia_id INT REFERENCES provincias(id),
    canton_id INT REFERENCES cantones(id),
    parroquia_id INT REFERENCES parroquias(id),
    sector_comunidad VARCHAR(150) NOT NULL, -- Ej: 'Chone', 'El Carmen'
    contacto VARCHAR(100),
    tipo_suscripcion VARCHAR(50) DEFAULT 'Standard', -- 'Free', 'Standard', 'Premium'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- 3. TABLAS DEL MÓDULO: GESTIÓN DE FINCAS Y TRAZABILIDAD (PYMES MULTI-LOTE)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS fincas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    provincia_id INT REFERENCES provincias(id),
    canton_id INT REFERENCES cantones(id),
    parroquia_id INT REFERENCES parroquias(id),
    coordenadas_gps TEXT, -- Polígono o punto central en texto
    ciiu_id INT REFERENCES ciiu(id),
    tipo_pyme VARCHAR(100) DEFAULT 'PYME Agropecuaria', -- Multi-lote, Hato ganadero
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE,
    nombre_lote VARCHAR(100) NOT NULL,
    cultivo_principal VARCHAR(100), -- Ej: 'Plátano Barraganete', 'Cacao'
    variedad VARCHAR(100),
    fecha_siembra DATE,
    area_metros_cuadrados NUMERIC(12, 2),
    estado_salud_lote VARCHAR(100), -- Bitácora del Asistente Técnico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hatos_ganaderos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE,
    especie VARCHAR(50) NOT NULL, -- 'Cerdos', 'Bovinos', 'Caballos', 'Aves', 'Cabras'
    raza VARCHAR(100),
    proposito VARCHAR(100), -- 'Carne', 'Leche', 'Doble Propósito'
    arete_identificador VARCHAR(50), -- Trazabilidad individual facultativa
    cantidad_cabezas INT DEFAULT 0,
    fecha_nacimiento_estimada DATE,
    estado_sanitario VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prácticas Regenerativas vinculadas a la Finca/PYME
CREATE TABLE IF NOT EXISTS practicas_regenerativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE,
    tipo_practica VARCHAR(150) NOT NULL, -- Ej: 'Pastoreo Rotativo', 'Abono Orgánico'
    fecha_aplicacion DATE NOT NULL,
    evidencia_notas TEXT,
    responsable_id UUID REFERENCES usuarios(id)
);

-- ===========================================================================
-- 4. AGRICULTURA DE PRECISIÓN (HARDWARE DIGITAL Y MEDICIONES DE CAMPO)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS inventario_hardware_digital (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    equipo_tipo VARCHAR(50) NOT NULL, -- 'Sensor', 'GPS', 'Walkie Talkie', 'Otro'
    modelo VARCHAR(100),
    estado_equipo VARCHAR(50) DEFAULT 'Activo', -- 'Activo', 'Inactivo', 'En reparación'
    fecha_registro DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS mediciones_campo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    sensor_tipo VARCHAR(50) NOT NULL, -- 'GPS','Humedad','Temperatura','NPK','pH','EC'
    valor_lectura NUMERIC(12, 4) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL, -- 'Hectáreas', '% Humedad', 'pH', '°C'
    actividad_guiada VARCHAR(150), -- Nombre de la guía interactiva usada por Ángel
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    latitud REAL,
    longitud REAL,
    precision_gps_metros REAL,
    notas TEXT,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -- ============================================================
-- NEGOCIOS RURALES
-- 1. PERFIL COMERCIAL
-- ============================================================

CREATE TABLE IF NOT EXISTS perfiles_comerciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    usuario_id UUID NOT NULL UNIQUE
        REFERENCES usuarios(id) ON DELETE CASCADE,

    nombre_comercial VARCHAR(150),
    descripcion TEXT,

    actividad_principal VARCHAR(150),

    provincia_id INT REFERENCES provincias(id),
    canton_id INT REFERENCES cantones(id),
    parroquia_id INT REFERENCES parroquias(id),

    mostrar_ubicacion BOOLEAN DEFAULT TRUE,

    reputacion NUMERIC(5,2) DEFAULT 0.00
        CHECK (reputacion >= 0 AND reputacion <= 5),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ===========================================================================
-- 6. TABLAS DEL MÓDULO: REGISTRO DE EVIDENCIAS Y DOCUMENTOS (CUSTODIA TOTAL)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS evidencias_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_bien VARCHAR(100) NOT NULL, -- 'Cosecha', 'Bienes Raíces', 'Vehículos', 'Maquinaria'
    nombre_documento VARCHAR(255) NOT NULL, 
    monto_total NUMERIC(12,2) NOT NULL,
    comision_app NUMERIC(12,2) NOT NULL, -- 3% Retenido para la App
    monto_liberado NUMERIC(12,2) NOT NULL, -- 97% Restante para el Vendedor
    url_foto_evidencia_firmas VARCHAR(255), -- Foto de contrato / apretón de manos / recibo de pago
    url_foto_soporte_legal VARCHAR(255),   -- FOTO DE LA ESCRITURA PÚBLICA o MATRÍCULA VEHICULAR (Verificación)
    estado_pago VARCHAR(100) DEFAULT 'En Custodia', -- 'En Custodia', 'Fondos Liberados al Vendedor'
    confirmacion_vendedor BOOLEAN DEFAULT FALSE,
    confirmacion_comprador BOOLEAN DEFAULT FALSE,
    hash_transaccion VARCHAR(64) UNIQUE NOT NULL, -- Hash único para el QR inmutable offline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- 7. TABLA DE CONTROL OPERATIVO: DIAGNÓSTICO DE RUTAS Y MÓDULOS (COMPLETO)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS diagnostico_rutas_modulos (
    id SERIAL PRIMARY KEY,
    modulo TEXT NOT NULL,
    ruta_actual TEXT NOT NULL,
    sugerida TEXT NOT NULL,
    existe_sugerida TEXT NOT NULL
);

-- Inserción única masiva que contiene TODOS los módulos del sistema (Termina en UN SOLO punto y coma)
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES 
('Gestión de Suscripciones', 'modules/01_suscripciones/gestion_suscripciones', 'modules/gestion_suscripciones', 'True'),
('Visión Artificial', 'modules/02_asistente_tecnico_rural/vision_artificial', 'modules/vision_artificial', 'True'),
('Visión Satelital', 'modules/02_asistente_tecnico_rural/vision_satelital', 'modules/vision_satelital', 'True'),
('Salud y Medicina Veterinaria', 'modules/02_asistente_tecnico_rural/salud_medicina_veterinaria', 'modules/salud_medicina_veterinaria', 'True'),
('Clima Inteligente', 'modules/02_asistente_tecnico_rural/clima_inteligente', 'SIN_ARCHIVO', 'False'),
('Gestión de Fincas', 'modules/03_gestion_fincas_trazabilidad/gestion_fincas_trazabilidad', 'modules/gestion_fincas_trazabilidad', 'True'),
('Trazabilidad Cultivos Especiales', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cultivos_especiales', 'modules/trazabilidad_cultivos_especiales', 'True'),
('Trazabilidad de Granjas', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_granjas', 'modules/trazabilidad_granjas', 'True'),
('Trazabilidad de Café', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cafe', 'modules/trazabilidad_cafe', 'True'),
('Trazabilidad de Cacao', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cacao', 'modules/trazabilidad_cacao', 'True'),
('Trazabilidad de Plátano', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_platano', 'modules/trazabilidad_platano', 'True'),
('Trazabilidad de Aguacate', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_aguacate', 'modules/trazabilidad_aguacate', 'True'),
('Trazabilidad de Guanábana', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_guanabana', 'modules/trazabilidad_guanabana', 'True'),
('Negocios Rurales', 'modules/04_negocios_rurales/negocios_rurales', 'modules/negocios_rurales', 'True'),
('Mercado Plátano', 'modules/04_negocios_rurales/mercado_platano', 'modules/mercado_platano', 'True'),
('Ventas de Gestión Productiva', 'modules/04_negocios_rurales/ventas_gestion_productiva', 'modules/ventas_gestion_productiva', 'True'),
('Finanzas Personales', 'modules/05_emprendedor_finanzas_personales/finanzas_personales', 'modules/finanzas_personales', 'True'),
('Registro Financiero Inteligente', 'modules/05_emprendedor_finanzas_personales/registro_financiero_inteligente', 'modules/registro_financiero_inteligente', 'True'),
('Consejos y Alertas Financieras', 'modules/05_emprendedor_finanzas_personales/consejos_alertas', 'modules/consejos_alertas', 'True'),
('Termómetro Financiero', 'modules/05_emprendedor_finanzas_personales/termometro_financiero', 'modules/termometro_financiero', 'True'),
('Gráfica Ingresos y Gastos', 'modules/05_emprendedor_finanzas_personales/grafica_ingresos_gastos', 'modules/grafica_ingresos_gastos', 'True'),
('Ciudadano Rural', 'modules/08_comunidad_virtual/ciudadano_rural', 'modules/ciudadano_rural', 'True'),
('Asesoría Legal', 'modules/08_comunidad_virtual/asesoria_legal', 'modules/asesoria_legal', 'True'),
('Guía de Primeros Auxilios', 'modules/09_asistente_preventivo_salud_rural/guia_primeros_auxilios', 'modules/guia_primeros_auxilios', 'True'),
('Botiquín Casero Inteligente', 'modules/09_asistente_preventivo_salud_rural/botiquin_casero', 'modules/botiquin_casero', 'True'),
('Ficha Médica', 'modules/09_asistente_preventivo_salud_rural/ficha_medica', 'modules/ficha_medica', 'True'),
('Apertura de Cuenta Digital', 'modules/10_servicios_financieros/apertura_cuenta_digital', 'modules/apertura_cuenta_digital', 'True'),
('Onboarding KYC', 'modules/10_servicios_financieros/onboarding_kyc', 'modules/onboarding_kyc', 'True'),
('Gestión de Pagos y Beneficios', 'modules/10_servicios_financieros/gestion_pagos_beneficios', 'modules/gestion_pagos_beneficios', 'True'),
('Simulación de Perfil Financiero', 'modules/10_servicios_financieros/simulacion_perfil_financiero', 'modules/simulacion_perfil_financiero', 'True'),
('Solicitar Microcrédito', 'modules/10_servicios_financieros/solicitar_microcredito', 'modules/solicitar_microcredito', 'True'),
('Transferencias y Movimientos', 'modules/10_servicios_financieros/transferencias_movimientos', 'modules/transferencias_movimientos', 'True'),
('Integración Bancos y Cooperativas', 'modules/10_servicios_financieros/integracion_bancos_cooperativas', 'modules/integracion_bancos_cooperativas', 'True'),
('Historial y Estado de Cuenta', 'modules/10_servicios_financieros/historial_estado_cuenta', 'modules/historial_estado_cuenta', 'True'),
('Registro de Evidencias Fotograficas', 'modules/11_evidencias_documentos/registro_evidencia_fotografica', 'modules/registro_evidencia_fotografica', 'True');


-- ===========================================================================
-- 8. INDEXACIÓN RELACIONAL PARA MODO OFFLINE / FILTROS ULTRA RÁPIDOS
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_fincas_provincia ON fincas(provincia_id);
CREATE INDEX IF NOT EXISTS idx_fincas_canton ON fincas(canton_id);
CREATE INDEX IF NOT EXISTS idx_fincas_parroquia ON fincas(parroquia_id);
CREATE INDEX IF NOT EXISTS idx_bolsa_estado ON bolsa_ofertas(estado);
CREATE INDEX IF NOT EXISTS idx_lotes_finca ON lotes(finca_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_usuario ON mediciones_campo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_sensor ON mediciones_campo(sensor_tipo);
CREATE INDEX IF NOT EXISTS idx_evidencias_hash ON evidencias_documentos(hash_transaccion);

-- ===========================================================================
-- 9. MÓDULO ADICIONAL: POLÍTICAS DE RETENCIÓN, LÍMITES Y CONTROL GEOGRÁFICO
-- ===========================================================================

-- Modificación facultativa si deseas inyectar el control de MB consumidos en la tabla raíz
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS storage_usado_mb NUMERIC(10,2) DEFAULT 0.00;

-- Tabla de Registros de Campo (Cultivos, plagas, enfermedades detectadas por la IA)
CREATE TABLE IF NOT EXISTS registros_campo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    tipo_registro VARCHAR(50) NOT NULL, -- 'plaga', 'enfermedad', 'medicion', 'trazabilidad'
    descripcion TEXT,
    foto_url TEXT, -- Almacenamiento optimizado local o Supabase Storage (Max 150KB)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- 10.TRIGGER DE PROTECCIÓN: CONTROL DE BUCKETS Y COSTOS POR SUSCRIPCIÓN
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
