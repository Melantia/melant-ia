# backend/database.py
import time
import asyncio
from contextlib import asynccontextmanager, contextmanager
from typing import Any, Dict, Optional
from fastapi import HTTPException
from psycopg_pool import AsyncConnectionPool, ConnectionPool
from psycopg.rows import dict_row

from core.config import settings
from core.exceptions import MelantiaException

# CONFIGURACIÓN DEL POOL DE CONEXIONES ASÍNCRONAS (Psycopg 3)
# Ideal para soportar las múltiples peticiones concurrentes del ecosistema agropecuario
#
# Pools perezosos (Etapa 1 C2): se construyen en init_pools(), no al
# importar el módulo — así `settings.database_url` valida la config
# (DATABASE_URL o MELANTIA_DB_PASS) antes de abrir la primera
# conexión, sin romper imports de módulos que no usan la BD.
db_pool: Optional[AsyncConnectionPool] = None
sync_db_pool: Optional[ConnectionPool] = None


def init_pools():
    """
    Construye (una sola vez) los pools async y sync sin abrir
    conexiones — `open=False` y la apertura real ocurre en el
    lifespan de FastAPI o en la primera llamada a
    get_db_connection()/get_db_connection_sync().

    Devuelve (db_pool, sync_db_pool). Si falta la credencial de
    PostgreSQL, settings.database_url lanza RuntimeError aquí —
    antes de abrir cualquier conexión, sin exponer valores.
    """
    global db_pool, sync_db_pool
    if db_pool is None:
        db_pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.db_pool_min_size,
            max_size=settings.db_pool_max_size,
            open=False, # Se abre explícitamente en el ciclo de vida de FastAPI
            kwargs={"row_factory": dict_row} # convención del proyecto: acceso por nombre
        )
    # Pool síncrono para compatibilidad temporal con módulos existentes
    # Nota: Este pool síncrono será eliminado cuando todos los módulos migren a async
    if sync_db_pool is None:
        sync_db_pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.db_sync_pool_min_size,
            max_size=settings.db_sync_pool_max_size,
            open=False,
            kwargs={"row_factory": dict_row}
        )
    return db_pool, sync_db_pool

@asynccontextmanager
async def get_db_connection():
    """
    Administrador de contexto asíncrono para transacciones de MELANTIA.
    Entrega tanto la conexión como el cursor ya configurado con dict_row.
    """
    init_pools()
    async with db_pool.connection() as conn:
        # Configuramos dict_row para mapear registros directamente a diccionarios de Python
        async with conn.cursor(row_factory=dict_row) as cursor:
            try:
                yield conn, cursor
                # Si todo sale bien dentro del bloque, el pool maneja el commit automáticamente
            except Exception as error:
                await conn.rollback()
                # Las excepciones HTTP previstas (HTTPException, MelantiaException)
                # se re-lanzan tal cual: no son fallos de base de datos y no deben
                # enmascararse como 500. Solo errores reales de BD se registran aquí.
                if not isinstance(error, (HTTPException, MelantiaException)):
                    print(f"[DB ERROR] Fallo en transacción de MELANTIA: {error}")
                raise error

@contextmanager
def get_db_connection_sync():
    """
    Versión síncrona para compatibilidad temporal con módulos existentes.
    DEPRECATED: Este método será eliminado cuando todos los módulos migren a async.
    Prefiera usar get_db_connection() async en nuevo código.
    """
    init_pools()
    with sync_db_pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cursor:
            try:
                yield conn, cursor
                conn.commit()
            except Exception as error:
                conn.rollback()
                if not isinstance(error, (HTTPException, MelantiaException)):
                    print(f"[DB ERROR] Fallo en transacción síncrona de MELANTIA: {error}")
                raise error

# ===========================================================================
# MOTOR SINGLEFLIGHT EVOLUCIONADO: ASYNC REAL + EXPIRACIÓN POR TIEMPO (TTL)
# ===========================================================================

class CacheItem:
    def __init__(self, valor: Any, ttl_segundos: int):
        self.valor = valor
        self.expira_at = time.time() + ttl_segundos

    @property
    def ha_expirado(self) -> bool:
        return time.time() > self.expira_at


class SingleFlightManager:
    def __init__(self):
        # Almacena tareas asíncronas en vuelo para Coalescing
        self._vuelos_activos: Dict[str, asyncio.Task] = {}
        # Corrección 3: Diccionario que guarda instancias CacheItem para control de expiración
        self._cache_local: Dict[str, CacheItem] = {}

    async def ejecutar(
        self, 
        clave_unica: str, 
        funcion_db_corutina, 
        ttl_segundos: int = 60, 
        *args, 
        **kwargs
    ) -> Any:
        """
        Patrón SingleFlight con Request Collapsing y Caché Efímera Asíncrona.
        Corrección 4: No bloquea el event loop al usar operaciones e interfaces completamente async.
        """
        # 1. Verificar caché en caliente y vigencia del dato
        if clave_unica in self._cache_local:
            item = self._cache_local[clave_unica]
            if not item.ha_expirado:
                return item.valor
            else:
                # Si expiró, lo removemos de inmediato
                self._cache_local.pop(clave_unica, None)

        # 2. Evitar Thundering Herd: Si otra petición idéntica ya está consultando, unirse al vuelo
        if clave_unica in self._vuelos_activos:
            print(f"✈️ [SingleFlight] Coalescing activado para: {clave_unica}. Compartiendo consulta.")
            return await self._vuelos_activos[clave_unica]

        # 3. Iniciar el vuelo asíncrono no bloqueante
        task = asyncio.create_task(funcion_db_corutina(*args, **kwargs))
        self._vuelos_activos[clave_unica] = task

        try:
            resultado = await task
            # Guardamos el resultado empaquetado con su tiempo de vida útil
            self._cache_local[clave_unica] = CacheItem(resultado, ttl_segundos)
            return resultado
        finally:
            # Liberamos el vuelo para permitir consultas frescas en el futuro
            self._vuelos_activos.pop(clave_unica, None)

    def invalidar_clave(self, clave_unica: str):
        """Invalida inmediatamente la caché si hay mutaciones (INSERT/UPDATE/DELETE)"""
        self._cache_local.pop(clave_unica, None)


# Instancia global única para el backend de MELANTIA
single_flight = SingleFlightManager()

# Alias para compatibilidad con código existente
# DEPRECATED: Usar invalidar_clave directamente
SingleFlightManager.limpiar_cache_clave = SingleFlightManager.invalidar_clave
