-- Registro de censos fitosanitarios
CREATE TABLE monitoreo_plagas (
    id_censo INTEGER PRIMARY KEY AUTOINCREMENT,
    id_lote INTEGER,
    fecha_monitoreo DATE,
    plaga_detectada TEXT,
    incidencia_porcentaje DECIMAL(5,2), -- % de palmas afectadas
    severidad TEXT CHECK( severidad IN ('Leve', 'Moderada', 'Severa') ),
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
);

-- Registro de cirugías o erradicaciones (especial para PC)
CREATE TABLE intervenciones_sanitarias (
    id_intervencion INTEGER PRIMARY KEY,
    id_lote INTEGER,
    tipo_accion TEXT, -- 'Cirugia', 'Erradicacion', 'Inyeccion'
    cantidad_palmas INTEGER,
    producto_usado TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
);
