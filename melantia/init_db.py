# init_db.py
"""
Script de inicialización de base de datos para MELANTIA.

Este script ejecuta los esquemas SQL de la base de datos PostgreSQL
utilizando la configuración centralizada de settings.
"""
import sys
from pathlib import Path

# Añadir el directorio backend al path para importar config
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from core.config import settings
import psycopg
from psycopg.rows import dict_row


def initialize_database():
    """
    Inicializa la base de datos PostgreSQL ejecutando los esquemas SQL.

    Ejecuta los archivos SQL en el orden correcto de dependencias:
    1. schema/extensions.sql - Extensiones de PostgreSQL
    2. schema/*.sql - Esquemas base del MVP (orden explícito por FKs)
    3. schema/modulos/*.sql - Esquemas de módulos de negocio
    4. seeds/*.sql - Datos iniciales (si existen)
    """
    print(f"[MELANTIA] Inicializando base de datos: {settings.db_name}")
    print(f"[MELANTIA] Host: {settings.db_host}:{settings.db_port}")

    try:
        # Conectar a PostgreSQL
        conn = psycopg.connect(
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
            user=settings.db_user,
            password=settings.db_password
        )

        conn.autocommit = True
        cursor = conn.cursor()

        def ejecutar_sql(archivo: Path):
            print(f"[MELANTIA] Ejecutando {archivo.name}...")
            with open(archivo, 'r', encoding='utf-8') as f:
                cursor.execute(f.read())
            print(f"[MELANTIA] ✅ {archivo.name} ejecutado correctamente")

        # ============================================================================
        # 1. EJECUTAR EXTENSIONES
        # ============================================================================

        extensions_file = Path("backend/database/schema/extensions.sql")
        if extensions_file.exists():
            ejecutar_sql(extensions_file)
        else:
            print(f"[MELANTIA] ⚠️  Archivo extensions.sql no encontrado, omitiendo...")

        # ============================================================================
        # 2. EJECUTAR ESQUEMAS BASE DEL MVP
        # ============================================================================
        # Orden explícito por dependencias de llaves foráneas:
        # geografia -> usuarios -> gestion_fincas -> trazabilidad
        #   -> suscripciones -> mediciones_campo -> levantamientos
        #   -> registros_campo -> evidencias -> ecosistema_profesional
        # (ecosistema_profesional referencia levantamientos y
        #  registros_campo: debe ir al final — corrección A2, auditoría M2)

        schema_dir = Path("backend/database/schema")
        esquemas_base = [
            "geografia.sql",
            "usuarios.sql",
            "gestion_fincas.sql",
            "trazabilidad.sql",
            "suscripciones.sql",
            "mediciones_campo.sql",
            "levantamientos.sql",
            "registros_campo.sql",
            "evidencias.sql",
            "ecosistema_profesional.sql",
        ]

        if schema_dir.exists():
            for nombre in esquemas_base:
                schema_file = schema_dir / nombre
                if schema_file.exists():
                    ejecutar_sql(schema_file)
                else:
                    print(f"[MELANTIA] ⚠️  {nombre} no encontrado, omitiendo...")
        else:
            print(f"[MELANTIA] ⚠️  Directorio schema/ no encontrado, omitiendo...")

        # ============================================================================
        # 3. EJECUTAR ESQUEMAS DE MÓDULOS DE NEGOCIO
        # ============================================================================
        # Orden explícito: labores_pecuarias depende de animales

        modulos_dir = schema_dir / "modulos"
        esquemas_modulos = [
            "animales.sql",
            "labores_pecuarias.sql",
            "negocios_rurales_v2.sql",
        ]

        if modulos_dir.exists():
            for nombre in esquemas_modulos:
                modulo_file = modulos_dir / nombre
                if modulo_file.exists():
                    ejecutar_sql(modulo_file)
                else:
                    print(f"[MELANTIA] ⚠️  modulos/{nombre} no encontrado, omitiendo...")

            # Ejecutar cualquier módulo adicional no listado, en orden alfabético
            listados = {modulos_dir / n for n in esquemas_modulos}
            for modulo_file in sorted(modulos_dir.glob("*.sql")):
                if modulo_file not in listados:
                    ejecutar_sql(modulo_file)

        # ============================================================================
        # 4. EJECUTAR SEEDS (DATOS INICIALES)
        # ============================================================================

        seeds_dir = Path("backend/database/seeds")
        if seeds_dir.exists():
            seed_files = sorted(seeds_dir.glob("*.sql"))
            print(f"[MELANTIA] Encontrados {len(seed_files)} archivos de seeds")

            for seed_file in seed_files:
                ejecutar_sql(seed_file)
        else:
            print(f"[MELANTIA] ℹ️  Directorio seeds/ no encontrado, no hay datos iniciales")

        # ============================================================================
        # 5. VERIFICACIÓN
        # ============================================================================

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        print(f"[MELANTIA] ✅ Base de datos inicializada con {len(tables)} tablas:")
        for table in tables:
            print(f"  - {table[0]}")

        cursor.close()
        conn.close()

        print(f"[MELANTIA] 🎉 ¡Base de datos inicializada con éxito!")

    except Exception as e:
        print(f"[MELANTIA] ❌ Error durante la inicialización: {e}")
        sys.exit(1)


if __name__ == "__main__":
    initialize_database()