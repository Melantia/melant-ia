# Estructura de base de datos para panel multiusuario y multifinca (offline, SQLite)

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    rol TEXT, -- admin, tecnico, productor
    plan TEXT, -- free, pro, premium, empresarial
    activo INTEGER DEFAULT 1
);

-- Tabla de fincas
CREATE TABLE IF NOT EXISTS fincas (
    finca_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    responsable_id INTEGER,
    FOREIGN KEY(responsable_id) REFERENCES usuarios(usuario_id)
);

-- Relación usuarios-fincas (permisos)
CREATE TABLE IF NOT EXISTS usuarios_fincas (
    usuario_id INTEGER,
    finca_id INTEGER,
    rol TEXT, -- propietario, invitado, tecnico
    PRIMARY KEY(usuario_id, finca_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(usuario_id),
    FOREIGN KEY(finca_id) REFERENCES fincas(finca_id)
);

-- Ejemplo de tabla de actividades/productividad por finca
CREATE TABLE IF NOT EXISTS actividades (
    actividad_id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER,
    usuario_id INTEGER,
    fecha TEXT,
    tipo TEXT,
    descripcion TEXT,
    FOREIGN KEY(finca_id) REFERENCES fincas(finca_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(usuario_id)
);

-- Tabla de documentos/reporte
CREATE TABLE IF NOT EXISTS documentos (
    doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER,
    usuario_id INTEGER,
    tipo TEXT,
    fecha TEXT,
    archivo TEXT,
    FOREIGN KEY(finca_id) REFERENCES fincas(finca_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(usuario_id)
);
