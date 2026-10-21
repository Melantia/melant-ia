
-- ============================================================
-- Esquema SQL/SQLite para plataforma agropecuaria interoperable
-- Incluye claves foráneas, índices y normalización para filtros
-- ultra rápidos. Compatible con SQLite 3 y SQLite WASM (offline).
-- ============================================================

-- ======================
-- Tablas de Catálogo
-- ======================
CREATE TABLE IF NOT EXISTS provincias (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo_inec TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cantones (
    id INTEGER PRIMARY KEY,
    provincia_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo_inec TEXT NOT NULL,
    FOREIGN KEY (provincia_id) REFERENCES provincias(id)
);

CREATE TABLE IF NOT EXISTS parroquias (
    id INTEGER PRIMARY KEY,
    canton_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo_inec TEXT NOT NULL,
    FOREIGN KEY (canton_id) REFERENCES cantones(id)
);

CREATE TABLE IF NOT EXISTS ciiu (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    descripcion TEXT NOT NULL
);

-- ======================
-- Tabla de Productores
-- (referenciada por inventario_digital y mediciones_campo)
-- ======================
CREATE TABLE IF NOT EXISTS productores (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    cedula_ruc TEXT UNIQUE NOT NULL,
    firma_digital TEXT,
    provincia_id INTEGER,
    canton_id INTEGER,
    parroquia_id INTEGER,
    sector TEXT,
    contacto TEXT,
    rol_usuario TEXT,
    FOREIGN KEY (provincia_id) REFERENCES provincias(id),
    FOREIGN KEY (canton_id) REFERENCES cantones(id),
    FOREIGN KEY (parroquia_id) REFERENCES parroquias(id)
);

-- ======================
-- Tabla de Predios
-- ======================
CREATE TABLE IF NOT EXISTS predios (
    id INTEGER PRIMARY KEY,
    productor_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    provincia_id INTEGER,
    canton_id INTEGER,
    parroquia_id INTEGER,
    sector TEXT,
    coordenadas_gps TEXT,
    ciiu INTEGER,
    rubro TEXT,
    superficie REAL,
    FOREIGN KEY (productor_id) REFERENCES productores(id),
    FOREIGN KEY (provincia_id) REFERENCES provincias(id),
    FOREIGN KEY (canton_id) REFERENCES cantones(id),
    FOREIGN KEY (parroquia_id) REFERENCES parroquias(id),
    FOREIGN KEY (ciiu) REFERENCES ciiu(id)
);

-- ======================
-- Tablas Originales del Sistema
-- ======================
CREATE TABLE fincas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    propietario TEXT,
    ubicacion_hacienda TEXT
);

CREATE TABLE cultivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER,
    tipo_cultivo TEXT, -- Ej: Café, Maíz, Cacao
    variedad TEXT,
    fecha_siembra DATE,
    estado_salud TEXT, -- Registro del Técnico en cultivos
    FOREIGN KEY (finca_id) REFERENCES fincas(id)
);

CREATE TABLE registros_gps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cultivo_id INTEGER,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    altitud REAL,
    precision_metros REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sincronizado_nube INTEGER DEFAULT 0, -- 0 = Pendiente, 1 = Sincronizado
    FOREIGN KEY (cultivo_id) REFERENCES cultivos(id)
);

CREATE TABLE marketplace (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_anuncio TEXT, -- 'Producto', 'Insumo', 'Terreno'
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio REAL,
    moneda TEXT DEFAULT 'USD',
    contacto_vendedor TEXT,
    imagen_local_path TEXT -- Ruta de la foto guardada en el celular (Offline)
);

CREATE TABLE finanzas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_movimiento TEXT, -- 'Ingreso' o 'Egreso'
    categoria TEXT, -- 'Semillas', 'Fertilizantes', 'Venta'
    monto REAL NOT NULL,
    fecha DATE,
    notas TEXT
);

CREATE TABLE conocimiento_legal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tema TEXT, -- 'Tenencia de tierras', 'Leyes Laborales'
    resumen_ley TEXT,
    articulo_referencia TEXT
);

CREATE TABLE calendario_lunar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fase_lunar TEXT,
    recomendacion_actividad TEXT, -- Ej: 'Ideal para podar'
    fecha_evento DATE
);

-- Tabla para inventario de hardware digital por productor
CREATE TABLE inventario_digital (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productor_id INTEGER NOT NULL,
    equipo_tipo TEXT NOT NULL CHECK(equipo_tipo IN ('Sensor', 'GPS', 'Walkie Talkie', 'Otro')),
    modelo TEXT,
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo', 'En reparación')),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    notas TEXT,
    FOREIGN KEY (productor_id) REFERENCES productores(id)
);

-- Tabla para guardar las mediciones guiadas de sensores y GPS
-- Vinculada a productores y opcionalmente a lotes/predios con coordenadas GPS
CREATE TABLE IF NOT EXISTS mediciones_campo (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    productor_id      INTEGER,
    sensor_tipo       TEXT     NOT NULL,               -- 'GPS','Humedad','Temperatura','NPK','pH','EC','Otro'
    valor_lectura     REAL     NOT NULL,
    unidad            TEXT     NOT NULL,               -- 'Hectáreas','% Humedad','pH','mS/cm','°C','Otro'
    actividad_guiada  TEXT,                            -- nombre de la guia_interactiva usada (medicion_gps, instalacion_sensor…)
    paso_completado   INTEGER  DEFAULT 0,              -- último paso de la guía que se completó (0-based)
    lote_id           TEXT,                            -- ID libre del lote o potrero
    latitud           REAL,                            -- coordenadas del punto de medición
    longitud          REAL,
    precision_gps_m   REAL,                            -- precisión GPS en metros
    notas             TEXT,
    fecha_hora        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productor_id) REFERENCES productores(id)
);

CREATE INDEX IF NOT EXISTS idx_mediciones_productor ON mediciones_campo(productor_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_sensor    ON mediciones_campo(sensor_tipo);
CREATE INDEX IF NOT EXISTS idx_mediciones_fecha     ON mediciones_campo(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_mediciones_lote      ON mediciones_campo(lote_id);

-- ======================
-- Tablas Interoperables
-- ======================
CREATE TABLE IF NOT EXISTS animales (
    id INTEGER PRIMARY KEY,
    predio_id INTEGER NOT NULL,
    especie TEXT NOT NULL,
    raza TEXT,
    proposito TEXT,
    arete TEXT,
    fecha_nacimiento DATE,
    estado_sanitario TEXT,
    responsable_id INTEGER,
    FOREIGN KEY (predio_id) REFERENCES predios(id),
    FOREIGN KEY (responsable_id) REFERENCES productores(id)
);

CREATE TABLE IF NOT EXISTS practicas_regenerativas (
    id INTEGER PRIMARY KEY,
    predio_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    fecha DATE NOT NULL,
    evidencia TEXT,
    responsable_id INTEGER,
    FOREIGN KEY (predio_id) REFERENCES predios(id),
    FOREIGN KEY (responsable_id) REFERENCES productores(id)
);

CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY,
    predio_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    fecha DATE NOT NULL,
    datos_json TEXT NOT NULL,
    firmado INTEGER DEFAULT 0,
    responsable_id INTEGER,
    destinatario TEXT,
    FOREIGN KEY (predio_id) REFERENCES predios(id),
    FOREIGN KEY (responsable_id) REFERENCES productores(id)
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    accion TEXT NOT NULL,
    fecha DATETIME NOT NULL,
    ip TEXT,
    detalles TEXT,
    FOREIGN KEY (usuario_id) REFERENCES productores(id)
);

-- ======================
-- Índices para filtros rápidos
-- ======================
CREATE INDEX IF NOT EXISTS idx_predios_provincia ON predios(provincia_id);
CREATE INDEX IF NOT EXISTS idx_predios_canton ON predios(canton_id);
CREATE INDEX IF NOT EXISTS idx_predios_parroquia ON predios(parroquia_id);
CREATE INDEX IF NOT EXISTS idx_predios_ciiu ON predios(ciiu);
CREATE INDEX IF NOT EXISTS idx_animales_especie ON animales(especie);
CREATE INDEX IF NOT EXISTS idx_animales_predio ON animales(predio_id);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_destinatario ON reportes(destinatario);
CREATE INDEX IF NOT EXISTS idx_practicas_fecha ON practicas_regenerativas(fecha);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);

-- ======================
-- Módulo: Agricultura de Precisión
-- Telemetría de sensores, drones e índices NDVI
-- ======================
CREATE TABLE IF NOT EXISTS registros_precision (
    id               INTEGER PRIMARY KEY,
    productor_id     INTEGER NOT NULL,
    predio_id        INTEGER,
    tipo_submodulo   TEXT NOT NULL CHECK(tipo_submodulo IN ('NDVI','Humedad','Drone','MapeoSuelos','Otro')),
    valor_detectado  REAL,
    unidad           TEXT,
    coordenadas_json TEXT,
    observaciones    TEXT,
    fecha_registro   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productor_id) REFERENCES productores(id),
    FOREIGN KEY (predio_id)    REFERENCES predios(id)
);

CREATE INDEX IF NOT EXISTS idx_precision_productor ON registros_precision(productor_id);
CREATE INDEX IF NOT EXISTS idx_precision_tipo      ON registros_precision(tipo_submodulo);
CREATE INDEX IF NOT EXISTS idx_precision_fecha     ON registros_precision(fecha_registro);

-- ======================
-- Ejemplo de inserción de catálogo geográfico
-- ======================
-- INSERT INTO provincias (nombre, codigo_inec) VALUES ('Pichincha', '17');
-- INSERT INTO cantones (provincia_id, nombre, codigo_inec) VALUES (1, 'Quito', '1701');
-- INSERT INTO parroquias (canton_id, nombre, codigo_inec) VALUES (1, 'Centro Historico', '170150');

-- ======================
-- Notas
-- ======================
-- 1. Ampliar catálogos según códigos oficiales del INEC y CIIU Ecuador.
-- 2. datos_json en reportes permite máxima flexibilidad para interoperabilidad.
-- 3. firmado en reportes marca si el reporte tiene firma digital válida.
-- 4. Se pueden agregar triggers para logs automáticos de auditoría.
-- 5. Todas las tablas nuevas usan IF NOT EXISTS para migraciones seguras.
