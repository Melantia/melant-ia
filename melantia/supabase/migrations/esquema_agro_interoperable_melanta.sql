-- Esquema SQL/SQLite para plataforma agropecuaria interoperable
-- Incluye claves foráneas, índices y normalización para filtros ultra rápidos

-- ======================
-- Tablas de Catálogo
-- ======================
CREATE TABLE provincias (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo_inec TEXT UNIQUE NOT NULL
);

CREATE TABLE cantones (
    id INTEGER PRIMARY KEY,
    provincia_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo_inec TEXT NOT NULL,
    FOREIGN KEY (provincia_id) REFERENCES provincias(id)
);

CREATE TABLE parroquias (
    id INTEGER PRIMARY KEY,
    canton_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo_inec TEXT NOT NULL,
    FOREIGN KEY (canton_id) REFERENCES cantones(id)
);

CREATE TABLE ciiu (
    id INTEGER PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    descripcion TEXT NOT NULL
);

-- ======================
-- Tablas Principales
-- ======================
CREATE TABLE productores (
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

CREATE TABLE predios (
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

CREATE TABLE animales (
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

CREATE TABLE practicas_regenerativas (
    id INTEGER PRIMARY KEY,
    predio_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    fecha DATE NOT NULL,
    evidencia TEXT,
    responsable_id INTEGER,
    FOREIGN KEY (predio_id) REFERENCES predios(id),
    FOREIGN KEY (responsable_id) REFERENCES productores(id)
);

CREATE TABLE reportes (
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

CREATE TABLE logs_auditoria (
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
CREATE INDEX idx_predios_provincia ON predios(provincia_id);
CREATE INDEX idx_predios_canton ON predios(canton_id);
CREATE INDEX idx_predios_parroquia ON predios(parroquia_id);
CREATE INDEX idx_predios_ciiu ON predios(ciiu);
CREATE INDEX idx_animales_especie ON animales(especie);
CREATE INDEX idx_animales_predio ON animales(predio_id);
CREATE INDEX idx_reportes_fecha ON reportes(fecha);
CREATE INDEX idx_reportes_tipo ON reportes(tipo);
CREATE INDEX idx_reportes_destinatario ON reportes(destinatario);
CREATE INDEX idx_practicas_fecha ON practicas_regenerativas(fecha);
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);

-- ======================
-- Ejemplo de inserción de catálogo geográfico
-- ======================
-- INSERT INTO provincias (nombre, codigo_inec) VALUES ('Pichincha', '17');
-- INSERT INTO cantones (provincia_id, nombre, codigo_inec) VALUES (1, 'Quito', '1701');
-- INSERT INTO parroquias (canton_id, nombre, codigo_inec) VALUES (1, 'Centro Historico', '170150');

-- ======================
-- Notas
-- ======================
-- 1. Puedes ampliar los catálogos según los códigos oficiales del INEC y CIIU.
-- 2. La columna datos_json en reportes permite máxima flexibilidad para interoperabilidad.
-- 3. La columna firmado en reportes puede usarse para marcar si el reporte tiene firma digital válida.
-- 4. Puedes agregar triggers para logs automáticos de auditoría.
