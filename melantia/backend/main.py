# backend/main.py
"""
Punto de entrada principal del backend de MELANTIA.

Responsabilidades:
- Crear la aplicación FastAPI.
- Configurar CORS.
- Definir schemas de entrada para endpoints CORE.
- Registrar endpoints fundamentales.
- Ejecutar tareas de segundo plano.
- Montar los routers modulares de MELANTIA.

La lógica de negocio específica debe permanecer en sus respectivos módulos.
"""

# ============================================================================
# IMPORTS
# ============================================================================

import asyncio
import logging
import sys
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import uvicorn
from fastapi import (
    BackgroundTasks, Depends, FastAPI, HTTPException, Request, status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from psycopg.errors import UniqueViolation

from core.config import settings
from core.dependencies import get_current_user
from core.exceptions import MelantiaException
from database import get_db_connection, init_pools
from core.security import require_jwt_secret_for_legacy
from contextlib import asynccontextmanager

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("melantia.backend")

# ============================================================================
# LIFESPAN HANDLER - Gestión del ciclo de vida de la aplicación
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación FastAPI.
    Abre los pools de conexión al iniciar y los cierra al terminar.
    """
    # Startup: Abrir pools de conexión
    logger.info(
        "[MELANTIA] %s v%s iniciando en entorno '%s'",
        settings.app_name,
        settings.app_version,
        settings.environment,
    )
    # Etapa 1 C1: fail-closed — la rama legacy HS256 exige clave
    # explícita antes de aceptar solicitudes; si falta, el arranque
    # aborta aquí sin exponer valores.
    require_jwt_secret_for_legacy()

    # Etapa 1 C2: init_pools() valida DATABASE_URL/MELANTIA_DB_PASS
    # antes de abrir la primera conexión.
    logger.info(
        "[MELANTIA] Iniciando pools de conexión a base de datos (%s:%s/%s)...",
        settings.db_host,
        settings.db_port,
        settings.db_name,
    )
    db_pool, sync_db_pool = init_pools()
    await db_pool.open()
    sync_db_pool.open()
    logger.info("[MELANTIA] Pools de conexión iniciados correctamente")

    yield

    # Shutdown: Cerrar pools de conexión
    logger.info("[MELANTIA] Cerrando pools de conexión a base de datos...")
    await db_pool.close()
    sync_db_pool.close()
    logger.info("[MELANTIA] Pools de conexión cerrados correctamente")

# ============================================================================
# IMPORTACIÓN DE MÓDULOS
# ============================================================================

from modules.auth.controllers import (
    router as auth_router,
)

from modules.suscripciones.controllers import (
    router as suscripciones_router,
)

from modules.negocios_rurales.controllers import (
    router as negocios_router,
)

from modules.registro_evidencias.controllers import (
    router as evidencias_router,
)

from modules.asistente_tecnico.router import (
    router as asistente_router,
)
from modules.ecosistema_profesional.router import (
    router as ep_router,
)
from modules.gestion_fincas.router import (
    router as gestion_fincas_router,
)
from modules.sync.router import (
    router as sync_router,
)


# ============================================================================
# APLICACIÓN FASTAPI
# ============================================================================

app = FastAPI(
    title=settings.app_name,
    description=(
        "Productividad Agropecuaria Inteligente - "
        "Backend modular de MELANTIA"
    ),
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)


# ============================================================================
# CORS
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# MANEJO GLOBAL DE EXCEPCIONES MELANTIA
# ============================================================================

@app.exception_handler(MelantiaException)
async def manejar_excepciones_melantia(
    request: Request, exc: MelantiaException
) -> JSONResponse:
    """
    Traduce las excepciones tipadas de core.exceptions a respuestas
    HTTP con su status_code (401, 403, 404...) y cuerpo estructurado.
    Sin este handler, una AuthenticationError se propagaría como un
    500 no controlado.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


# ============================================================================
# ENUMS
# ============================================================================

class TipoOferta(str, Enum):
    """
    Tipos de operaciones que puede manejar inicialmente la Bolsa.
    """

    COMPRA = "compra"
    VENTA = "venta"
    TRANSPORTE = "transporte"


class TipoRegistroCampo(str, Enum):
    """
    Tipos de registros técnicos de campo.
    """

    PLAGA = "plaga"
    ENFERMEDAD = "enfermedad"
    DEFICIENCIA = "deficiencia"


# ============================================================================
# SCHEMAS - BOLSA AGROPECUARIA
# ============================================================================

class OfertaBolsaSchema(BaseModel):
    """
    Datos mínimos para una oferta/demanda de la Bolsa Agropecuaria.

    Nota:
    Este schema todavía es una primera versión.
    Posteriormente podemos separar producto, cantidad y unidad
    para permitir matching comercial preciso.
    """

    usuario_id: str = Field(..., min_length=1)

    tipo_oferta: TipoOferta

    rol_emisor: str = Field(..., min_length=1)

    rubro_o_ruta: str = Field(..., min_length=1)

    cantidad_volumen: str = Field(..., min_length=1)

    precio_sugerido: float = Field(..., ge=0)


# ============================================================================
# SCHEMAS - EVIDENCIAS DOCUMENTALES
# ============================================================================

class EvidenciaDocumentoSchema(BaseModel):
    """
    Evidencia documental relacionada con un bien o activo.
    """

    usuario_id: str = Field(..., min_length=1)

    categoria_bien: str = Field(..., min_length=1)

    nombre_documento: str = Field(..., min_length=1)

    monto_total: float = Field(..., ge=0)

    url_foto_evidencia_firmas: str = Field(..., min_length=1)

    url_foto_soporte_legal: str = Field(..., min_length=1)

    hash_transaccion: str = Field(..., min_length=1)


# ============================================================================
# SCHEMAS - CLASIFICACIÓN DE CAMPO
# ============================================================================

class ClasificacionFotoSchema(BaseModel):
    """
    Información enviada por el módulo de diagnóstico rural.

    La identidad del usuario NO forma parte del body: se deriva
    exclusivamente del JWT autenticado (FIX-01). Un `usuario_id`
    enviado por el cliente se ignora.
    """

    lote_id: Optional[str] = None

    tipo_registro: TipoRegistroCampo

    especie_afectada: str = Field(..., min_length=1)

    diagnostico_usuario: str = Field(..., min_length=1)

    foto_url: str = Field(..., min_length=1)

    # Identificador para evitar procesar dos veces
    # la misma evidencia y duplicar incentivos.
    hash_transaccion: Optional[str] = None


# ============================================================================
# WORKER - SCORE PRODUCTIVO MELANTIA
# ============================================================================

async def recalcular_score_productivo(usuario_id: str) -> None:
    """
    Recalcula el indicador productivo interno de MELANTIA.

    IMPORTANTE:
    Este valor es un indicador interno/productivo de MELANTIA.
    No constituye una aprobación ni decisión crediticia bancaria.
    """

    logger.info(
        "[MELANTIA] Recalculando indicador productivo para usuario: %s",
        usuario_id,
    )

    try:
        async with get_db_connection() as (conn, cursor):
            cursor = None

            # --------------------------------------------------------------
            # SUPERFICIE PRODUCTIVA
            # --------------------------------------------------------------

            cursor = await conn.execute(
                """
                SELECT
                    COALESCE(SUM(area_metros_cuadrados), 0) AS m2
                FROM lotes
                WHERE finca_id IN (
                    SELECT id
                    FROM fincas
                    WHERE usuario_id = %s
                )
                """,
                (usuario_id,),
            )

            resultado_area = await cursor.fetchone()

            area_m2 = (
                resultado_area["m2"]
                if resultado_area and resultado_area["m2"]
                else 0.0
            )

            # --------------------------------------------------------------
            # GANADO
            # --------------------------------------------------------------

            cursor = await conn.execute(
                """
                SELECT
                    COALESCE(SUM(cantidad_cabezas), 0) AS cabezas
                FROM hatos_ganaderos
                WHERE finca_id IN (
                    SELECT id
                    FROM fincas
                    WHERE usuario_id = %s
                )
                """,
                (usuario_id,),
            )

            resultado_ganado = await cursor.fetchone()

            ganado_total = (
                resultado_ganado["cabezas"]
                if resultado_ganado
                else 0
            )

            # --------------------------------------------------------------
            # APORTES DE CONOCIMIENTO
            # --------------------------------------------------------------

            cursor = await conn.execute(
                """
                SELECT COUNT(*) AS aportes
                FROM registros_campo
                WHERE usuario_id = %s
                  AND es_activo_conocimiento = TRUE
                """,
                (usuario_id,),
            )

            resultado_aportes = await cursor.fetchone()

            aportes_ia = (
                resultado_aportes["aportes"]
                if resultado_aportes
                else 0
            )

            # --------------------------------------------------------------
            # CÁLCULO DEL INDICADOR
            # --------------------------------------------------------------

            score = (
                300
                + (ganado_total * 5)
                + (int(area_m2 / 10000) * 10)
                + (aportes_ia * 15)
            )

            # Límite superior
            score = min(score, 850)

            # --------------------------------------------------------------
            # ACTUALIZACIÓN
            # --------------------------------------------------------------

            sql_upsert = """
                INSERT INTO perfil_economico_productor (
                    usuario_id,
                    area_total_cultivos_m2,
                    cabezas_ganado_total,
                    score_productivo_melantia,
                    fecha_ultimo_calculo
                )
                VALUES (%s, %s, %s, %s, NOW())

                ON CONFLICT (usuario_id)
                DO UPDATE SET
                    area_total_cultivos_m2 =
                        EXCLUDED.area_total_cultivos_m2,

                    cabezas_ganado_total =
                        EXCLUDED.cabezas_ganado_total,

                    score_productivo_melantia =
                        EXCLUDED.score_productivo_melantia,

                    fecha_ultimo_calculo = NOW();
            """

            cursor = await conn.execute(
                sql_upsert,
                (
                    usuario_id,
                    area_m2,
                    ganado_total,
                    score,
                ),
            )

            await conn.commit()

            logger.info(
                "[MELANTIA] Indicador productivo actualizado: %s",
                score,
            )

    except Exception as error:
        logger.exception(
            "Error en worker de indicador productivo para usuario %s",
            usuario_id,
        )


# ============================================================================
# ENDPOINT - RUTA RAÍZ
# ============================================================================

@app.get(
    "/",
    tags=["Sistema"],
)
def read_root():
    """
    Comprueba que la API está funcionando.
    """

    return {
        "app": settings.app_name,
        "status": "online",
        "version": app.version,
        "environment": settings.environment,
        "backend": "FastAPI",
    }


# ============================================================================
# ENDPOINT - CLASIFICACIÓN DE EVIDENCIA DE CAMPO
# ============================================================================

@app.post(
    "/api/ia/clasificar-evidencia",
    status_code=status.HTTP_201_CREATED,
    tags=["Inteligencia Artificial Rural"],
)
async def clasificar_evidencia_campo(
    data: ClasificacionFotoSchema,
    background_tasks: BackgroundTasks,
    usuario_id: str = Depends(get_current_user),
):
    """
    Registra una clasificación de campo.

    También genera el incentivo correspondiente y solicita
    el recalculo del indicador productivo en segundo plano.

    FIX-01: la identidad proviene exclusivamente del JWT
    (`get_current_user` — rama Supabase o legacy según el
    discriminador de emisor). El body ya no admite `usuario_id`;
    un `lote_id` debe pertenecer a una finca del usuario
    autenticado.
    """

    fecha_actual = datetime.now(timezone.utc)

    diagnostico_final_ia = (
        "Confirmado por Red Neuronal MELANTIA"
    )

    try:
        async with get_db_connection() as (conn, cursor):
            cursor = None

            # ----------------------------------------------------------
            # TITULARIDAD DEL LOTE (si se declara)
            # ----------------------------------------------------------
            # Un lote ajeno o inexistente se reporta como 404 —
            # indistinguible, sin revelar a quién pertenece.

            if data.lote_id:

                try:
                    uuid.UUID(data.lote_id)
                except (ValueError, AttributeError, TypeError):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Lote no encontrado.",
                    )

                cursor = await conn.execute(
                    """
                    SELECT 1
                    FROM lotes l
                    JOIN fincas f ON f.id = l.finca_id
                    WHERE l.id = %s
                      AND f.usuario_id = %s
                    LIMIT 1
                    """,
                    (
                        data.lote_id,
                        usuario_id,
                    ),
                )

                if not await cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Lote no encontrado.",
                    )

            # ----------------------------------------------------------
            # PROTECCIÓN CONTRA DUPLICADOS
            # ----------------------------------------------------------
            # NOTA (residual documentado): este SELECT es fast-path;
            # la carrera TOCTOU solo se cierra con el índice UNIQUE
            # parcial propuesto en migración m6 (pendiente de
            # autorización). El UniqueViolation ya se traduce a 409
            # para cuando el índice exista.

            if data.hash_transaccion:

                cursor = await conn.execute(
                    """
                    SELECT id
                    FROM registros_campo
                    WHERE usuario_id = %s
                      AND hash_transaccion = %s
                    LIMIT 1
                    """,
                    (
                        usuario_id,
                        data.hash_transaccion,
                    ),
                )

                registro_existente = await cursor.fetchone()

                if registro_existente:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            "Esta evidencia ya fue procesada."
                        ),
                    )

            # ----------------------------------------------------------
            # REGISTRO DE EVIDENCIA
            # ----------------------------------------------------------

            sql_registro = """
                INSERT INTO registros_campo (
                    usuario_id,
                    lote_id,
                    tipo_registro,
                    descripcion,
                    especie_afectada,
                    diagnostico_usuario,
                    clasificacion_ia,
                    foto_url,
                    es_activo_conocimiento,
                    hash_transaccion
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, TRUE, %s
                )
                RETURNING id;
            """

            cursor = await conn.execute(
                sql_registro,
                (
                    usuario_id,
                    data.lote_id,
                    data.tipo_registro.value,
                    f"Soporte de conocimiento de "
                    f"{data.tipo_registro.value}",
                    data.especie_afectada,
                    data.diagnostico_usuario,
                    diagnostico_final_ia,
                    data.foto_url,
                    data.hash_transaccion,
                ),
            )

            resultado = await cursor.fetchone()

            if not resultado:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No se pudo crear el registro.",
                )

            nuevo_registro_id = resultado["id"]

            # ----------------------------------------------------------
            # INCENTIVO MELANTIOS
            # ----------------------------------------------------------

            cursor = await conn.execute(
                """
                SELECT 1
                FROM usuarios_suscripciones
                WHERE usuario_id = %s
                """,
                (usuario_id,),
            )

            existe_suscripcion = await cursor.fetchone()

            if not existe_suscripcion:

                cursor = await conn.execute(
                    """
                    INSERT INTO usuarios_suscripciones (
                        usuario_id,
                        nombre,
                        plan_actual,
                        melantios_balance,
                        ultima_sincronizacion
                    )
                    VALUES (
                        %s,
                        'Productor Local',
                        'Standard',
                        10.00,
                        %s
                    )
                    """,
                    (
                        usuario_id,
                        fecha_actual,
                    ),
                )

            else:

                cursor = await conn.execute(
                    """
                    UPDATE usuarios_suscripciones
                    SET
                        melantios_balance =
                            melantios_balance + 10.00,
                        ultima_sincronizacion = %s
                    WHERE usuario_id = %s
                    """,
                    (
                        fecha_actual,
                        usuario_id,
                    ),
                )

            # ----------------------------------------------------------
            # CONFIRMAR TRANSACCIÓN
            # ----------------------------------------------------------

            await conn.commit()

            # ----------------------------------------------------------
            # WORKER DE SCORE
            # ----------------------------------------------------------

            background_tasks.add_task(
                recalcular_score_productivo,
                usuario_id,
            )

            return {
                "status": "success",
                "registro_id": nuevo_registro_id,
                "incentivo": (
                    "¡Felicidades! Se han abonado "
                    "10 Melantios."
                ),
                "score": (
                    "El indicador productivo de MELANTIA "
                    "se está recalculando."
                ),
                "balance_premio": "+10.00 Melantios",
            }

    except HTTPException:
        raise

    except UniqueViolation:
        # Defensa de segundo nivel (m6 pendiente): si el índice UNIQUE
        # de hash_transaccion existe, el INSERT concurrente duplicado
        # aterriza aquí — nunca como 500 ni con doble abono.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta evidencia ya fue procesada.",
        )

    except Exception:

        logger.exception(
            "Error interno clasificando evidencia de campo"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el motor transaccional de MELANTIA.",
        )


# ============================================================================
# ENDPOINT - PERFIL PRODUCTIVO
# ============================================================================

@app.get(
    "/api/finanzas/perfil-bancario/{usuario_id}",
    tags=["Servicios Financieros"],
)
async def obtener_perfil_bancario_kyc(
    usuario_id: str,
    usuario_autenticado: str = Depends(get_current_user),
):
    """
    Obtiene información productiva del usuario autenticado.

    FIX-02: el `usuario_id` de la ruta debe coincidir con la
    identidad validada por el backend. Un identificador ajeno o
    malformado devuelve el mismo 404 que un perfil inexistente
    (sin revelar a quién pertenece). No existe rol de lectura
    ajena en este lote.

    El score mostrado es un indicador productivo interno
    de MELANTIA y no una aprobación crediticia.
    """

    try:
        solicitado = str(uuid.UUID(usuario_id))
        autenticado = str(uuid.UUID(usuario_autenticado))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de productor no encontrado.",
        )

    if solicitado != autenticado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de productor no encontrado.",
        )

    try:

        async with get_db_connection() as (conn, cursor):
            cursor = None

            sql_perfil = """
                SELECT
                    u.nombre,
                    u.cedula_ruc,
                    u.sector_comunidad,

                    p.nombre AS provincia,
                    c.nombre AS canton,
                    pa.nombre AS parroquia,

                    COALESCE(
                        pf.score_productivo_melantia,
                        300
                    ) AS score_interno,

                    COALESCE(
                        pf.area_total_cultivos_m2,
                        0
                    ) AS area_total_cultivos_m2,

                    COALESCE(
                        pf.cabezas_ganado_total,
                        0
                    ) AS cabezas_ganado_total

                FROM usuarios u

                LEFT JOIN provincias p
                    ON u.provincia_id = p.id

                LEFT JOIN cantones c
                    ON u.canton_id = c.id

                LEFT JOIN parroquias pa
                    ON u.parroquia_id = pa.id

                LEFT JOIN perfil_economico_productor pf
                    ON u.id = pf.usuario_id

                WHERE u.id = %s;
            """

            cursor = await conn.execute(
                sql_perfil,
                (usuario_id,),
            )

            row = await cursor.fetchone()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "Perfil de productor "
                        "no encontrado."
                    ),
                )

            return {
                "status": "success",

                "datos_identidad": {
                    "nombre_completo": row["nombre"],
                    "cedula_ruc": row["cedula_ruc"],
                },

                "geolocalizacion_inec": {
                    "provincia": row["provincia"],
                    "canton": row["canton"],
                    "parroquia": row["parroquia"],
                    "comunidad_sector": (
                        row["sector_comunidad"]
                    ),
                },

                "patrimonio_productivo": {
                    "superficie_cultivos_m2": float(
                        row["area_total_cultivos_m2"] or 0
                    ),
                    "cabezas_ganado": (
                        row["cabezas_ganado_total"] or 0
                    ),
                },

                "indicador_productivo_melantia": (
                    row["score_interno"]
                ),

                "evaluacion_financiera": (
                    "Requiere evaluación independiente "
                    "de la entidad financiera."
                ),
            }

    except HTTPException:
        raise

    except Exception:

        logger.exception(
            "Error interno consultando perfil productivo"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno consultando el perfil productivo.",
        )


# ============================================================================
# ENDPOINT - DIAGNÓSTICO
# ============================================================================

@app.get(
    "/api/diagnostico/rutas",
    tags=["Diagnóstico"],
)
def obtener_diagnostico_rutas():
    """
    Endpoint sencillo para comprobar que el backend
    responde correctamente.
    """

    return {
        "status": "ok",
        "mensaje": (
            "Sistema de diagnóstico de rutas "
            "MELANTIA operativo."
        ),
    }


# ============================================================================
# ROUTERS MODULARES
# ============================================================================

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Autenticación"],
)

app.include_router(
    suscripciones_router,
    prefix="/api/suscripciones",
    tags=["Suscripciones & Melantios"],
)

app.include_router(
    negocios_router,
    prefix="/api/negocios",
    tags=["Negocios Rurales"],
)

app.include_router(
    evidencias_router,
    prefix="/api/evidencias",
    tags=["Registro Evidencias y Documentos"],
)

app.include_router(
    asistente_router,
    prefix="/api/v1/asistente",
    tags=["Asistente Técnico Rural"],
)

app.include_router(
    ep_router,
    prefix="/api/v1/ep",
    tags=["Ecosistema Profesional"],
)

app.include_router(
    gestion_fincas_router,
    prefix="/api/v1",
    tags=["Gestión de Fincas"],
)

app.include_router(
    sync_router,
    prefix="/api/v1",
    tags=["Sincronización"],
)


# ============================================================================
# EJECUCIÓN LOCAL
# ============================================================================

# Psycopg async requiere SelectorEventLoop en Windows. Debe aplicarse
# a nivel de módulo (no solo en __main__) porque `uvicorn main:app`
# importa este archivo sin ejecutar el bloque principal.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development,
    )