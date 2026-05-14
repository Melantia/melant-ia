"""
Esquema de base de datos pecuario integrado para MELANT IA.

Diseno: separado por especie, pero integrado por tablas base comun.
- Especies: porcino, bovino, avicola, equino
- Ejes comunes: salud, nutricion, produccion y trazabilidad
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path("melant_ia.db")


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def create_schema(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()

    # Catalogos y actores
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS productores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            documento TEXT,
            telefono TEXT,
            email TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS fincas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productor_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            ubicacion TEXT,
            area_total_ha REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (productor_id) REFERENCES productores(id) ON DELETE CASCADE
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS potreros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            finca_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            area_ha REAL NOT NULL,
            tipo_pasto TEXT,
            capacidad_calculada REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE
        );
        """
    )

    # Tabla central de animales (integracion)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS animales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            finca_id INTEGER NOT NULL,
            especie TEXT NOT NULL CHECK (especie IN ('porcino', 'bovino', 'avicola', 'equino')),
            identificacion TEXT NOT NULL,
            nombre TEXT,
            sexo TEXT CHECK (sexo IN ('M', 'F')),
            fecha_nacimiento TEXT,
            raza TEXT,
            madre_id INTEGER,
            padre_id INTEGER,
            estado TEXT DEFAULT 'activo',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (finca_id, especie, identificacion),
            FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
            FOREIGN KEY (madre_id) REFERENCES animales(id),
            FOREIGN KEY (padre_id) REFERENCES animales(id)
        );
        """
    )

    # Salud comun
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS salud_registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            tipo_evento TEXT NOT NULL,
            diagnostico TEXT,
            tratamiento TEXT,
            proxima_alerta TEXT,
            veterinario TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    # Nutricion comun
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS nutricion_registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            dieta TEXT,
            suplemento TEXT,
            consumo_kg_dia REAL,
            observaciones TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    # Produccion comun
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS produccion_registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            tipo_produccion TEXT NOT NULL,
            valor REAL NOT NULL,
            unidad TEXT NOT NULL,
            observaciones TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    # =============================
    # ESPECIFICO POR ESPECIE
    # =============================

    # Porcino: ciclos de gestacion y peso
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS porcino_ciclos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha_servicio TEXT,
            fecha_parto_estimada TEXT,
            fecha_parto_real TEXT,
            nacidos_vivos INTEGER,
            nacidos_muertos INTEGER,
            destetados INTEGER,
            peso_promedio_destete_kg REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    # Bovino: leche, carne y reproduccion
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bovino_ordeno_diario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            litros REAL NOT NULL,
            dias_en_lactancia INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bovino_carne_cria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            peso_kg REAL,
            gdp_kg_dia REAL,
            peso_destete_kg REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bovino_reproduccion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha_celo TEXT,
            fecha_servicio TEXT,
            fecha_parto TEXT,
            iep_dias INTEGER,
            estado_reproductivo TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    # Avicola: mortalidad y eficiencia alimenticia
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS avicola_lotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            finca_id INTEGER NOT NULL,
            nombre_lote TEXT NOT NULL,
            fecha_inicio TEXT NOT NULL,
            aves_iniciales INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS avicola_control_diario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lote_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            mortalidad INTEGER DEFAULT 0,
            alimento_consumido_kg REAL,
            produccion_huevos INTEGER,
            peso_promedio_ave_kg REAL,
            conversion_alimenticia REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lote_id) REFERENCES avicola_lotes(id) ON DELETE CASCADE
        );
        """
    )

    # Equino: desparasitacion y dieta energetica
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS equino_cuidado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            desparasitacion_programada TEXT,
            desparasitacion_aplicada TEXT,
            dieta_energetica TEXT,
            condicion_corporal REAL,
            observaciones TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
        );
        """
    )

    conn.commit()


def seed_demo_data(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM productores;")
    if cur.fetchone()[0] > 0:
        return

    cur.execute(
        "INSERT INTO productores (nombre, documento, telefono, email) VALUES (?, ?, ?, ?)",
        ("Productor Demo", "DOC-001", "000000000", "demo@melant.local"),
    )
    productor_id = cur.lastrowid

    cur.execute(
        "INSERT INTO fincas (productor_id, nombre, ubicacion, area_total_ha) VALUES (?, ?, ?, ?)",
        (productor_id, "Finca Demo", "Zona Rural", 25.0),
    )
    finca_id = cur.lastrowid

    cur.execute(
        "INSERT INTO animales (finca_id, especie, identificacion, nombre, sexo, raza) VALUES (?, ?, ?, ?, ?, ?)",
        (finca_id, "bovino", "ARETE-001", "Luna", "F", "Doble proposito"),
    )

    conn.commit()


def initialize_database(db_path: Path = DB_PATH, with_demo: bool = False) -> None:
    conn = get_connection(db_path)
    try:
        create_schema(conn)
        if with_demo:
            seed_demo_data(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    initialize_database(with_demo=True)
    print(f"Base de datos pecuaria creada en: {DB_PATH.resolve()}")
