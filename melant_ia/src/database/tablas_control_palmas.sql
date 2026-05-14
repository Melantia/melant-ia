-- Tabla de control de plagas
CREATE TABLE control_plagas (
    id_control INTEGER PRIMARY KEY AUTOINCREMENT,
    id_lote INTEGER,
    fecha DATE,
    plaga TEXT, -- Ej: Rhynchophorus palmarum, Gusanos Defoliadores
    severidad TEXT CHECK( severidad IN ('Leve', 'Moderada', 'Severa') ),
    acciones TEXT, -- Ej: Aplicación de biocontrol, eliminación de palmas
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
);

-- Tabla de monitoreo de enfermedades
CREATE TABLE monitoreo_enfermedades (
    id_monitoreo INTEGER PRIMARY KEY AUTOINCREMENT,
    id_lote INTEGER,
    fecha DATE,
    enfermedad TEXT, -- Ej: Pudrición del Cogollo, Marchitez Letal
    sintomas TEXT,
    severidad TEXT CHECK( severidad IN ('Leve', 'Moderada', 'Severa') ),
    acciones TEXT,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
);
