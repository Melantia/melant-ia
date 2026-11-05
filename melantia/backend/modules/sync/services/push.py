# backend/modules/sync/services/push.py
"""
Servicio de push del protocolo de sincronización — incremento I-2.

Alcance: action='create' sobre entity_type ∈ {'finca','lote'}.

Frontera transaccional (auditoría I-1/I-2): una conexión del request,
UNA transacción por operación — reserva en el ledger, validación de
dominio, insert de entidad, bump de cursor y fila de changelog
confirman o revierten juntos con un único conn.commit(); cualquier
fallo intermedio ejecuta conn.rollback() antes de producir el
resultado de error de la op (el pool confirma lo que quede abierto
en una salida limpia, así que jamás se devuelve error con una tx
pendiente).

Idempotencia: la inserción especulativa en sync_operaciones es el
primer paso de la tx — la UNIQUE (usuario_id, client_operation_id)
bloquea a una concurrente de la misma clave hasta que la primera
termina (semántica C de m8). Tras el UniqueViolation DE ESA
RESTRICCIÓN (verificada por e.diag.constraint_name): rollback,
relectura del ledger confirmado y comparación de payload_hash —
mismo hash → 'duplicate' con el resultado guardado; distinto →
'idempotency_key_reuse'. Otras colisiones UNIQUE no se confunden
con la clave idempotente (B-1).

Autenticación del sobre (H-1): la sesión MELANTIA exacta del token
(auth_session_id = claim session_id verificado) debe estar activa,
no vencida, ser del usuario y pertenecer al dispositivo declarado
— ninguna otra sesión activa del usuario sirve de sustituto.
"""
import logging
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.errors import CheckViolation, ForeignKeyViolation, UniqueViolation
from pydantic import ValidationError as PydanticValidationError

from core.exceptions import (
    AuthenticationError,
    MelantiaException,
    ResourceNotFoundError,
    ValidationError as DomainValidationError,
)
from modules.gestion_fincas.schemas.fincas import FincaCreate
from modules.gestion_fincas.schemas.lotes import LoteCreate
from modules.gestion_fincas.services.fincas import (
    _finca_propia,
    _resolver_geo,
)
from modules.sync.schemas import (
    SyncOpResult,
    SyncOperation,
    SyncPushRequest,
    SyncPushResponse,
)
from shared.repositories import fincas as fincas_repo
from shared.repositories import sync as sync_repo
from shared.sync_canonical import hash_operacion

logger = logging.getLogger("melantia.sync")

# Allowlist del incremento I-2 — create-only, solo fincas y lotes.
_ENTITY_TYPES = ("finca", "lote")
_ACTIONS = ("create",)

# Restricciones UNIQUE reales del DDL — para distinguir colisiones
# por e.diag.constraint_name (B-1), nunca por suposición.
_UQ_LEDGER = "uq_sync_operaciones_client_op"
_PK_ENTIDADES = {"fincas_pkey", "lotes_pkey"}


class _LoteSyncPayload(LoteCreate):
    """Payload de un lote vía sync: campos del lote + finca padre."""
    finca_id: UUID


# ============================================================================
# SOBRE — identidad, dispositivo, sesión
# ============================================================================

async def procesar_push(
    conn,
    usuario_id: str,
    session_id: UUID,
    data: SyncPushRequest,
) -> SyncPushResponse:
    """
    Valida el sobre y procesa las operaciones en el orden recibido.

    Vínculo H-1 (token → sesión → dispositivo):
    1. La sesión EXACTA del token — identificada por el claim
       session_id verificado — debe existir, ser del usuario, estar
       'activa' y no vencida (expires_at > now). Sin ella → 401.
       Ninguna otra sesión activa del usuario sustituye este vínculo.
    2. Esa sesión debe pertenecer al dispositivo declarado en el
       sobre: si el token autentica la sesión de otro dispositivo,
       el push se rechaza aunque el usuario tenga otra sesión activa
       en el dispositivo solicitado → 404 indistinguible.
    3. El dispositivo debe seguir existiendo, ser del usuario y
       estar 'activo' → 404 indistinguible en caso contrario.

    La procedencia registrada (sync_operaciones.dispositivo_id y
    dispositivo_origen_id de la entidad) es por tanto la del
    dispositivo de la sesión autenticada.
    """
    sesion = await sync_repo.sesion_autenticada_activa(
        conn, session_id, usuario_id
    )
    if not sesion:
        raise AuthenticationError(
            "Sesión inactiva o inexistente para esta credencial"
        )

    if str(sesion["dispositivo_id"]) != str(data.device_id):
        raise ResourceNotFoundError("Dispositivo", str(data.device_id))

    dispositivo = await sync_repo.dispositivo_activo_de_usuario(
        conn, data.device_id, usuario_id
    )
    if not dispositivo:
        raise ResourceNotFoundError("Dispositivo", str(data.device_id))

    # §9.1: el push actualiza last_seen_at del dispositivo.
    await sync_repo.registrar_uso_dispositivo(conn, data.device_id)
    await conn.commit()

    scope = sync_repo.scope_de_usuario(usuario_id)
    results = [
        await _procesar_operacion(
            conn, usuario_id, data.device_id, scope, op
        )
        for op in data.operations
    ]

    hint = await sync_repo.ultimo_seq(conn, scope)
    return SyncPushResponse(results=results, pull_cursor_hint=hint)


# ============================================================================
# OPERACIÓN — una transacción por op
# ============================================================================

async def _procesar_operacion(
    conn,
    usuario_id: str,
    dispositivo_id: UUID,
    scope: str,
    op: SyncOperation,
) -> SyncOpResult:
    # Allowlist por op: el sobre es válido pero la op no está en el
    # alcance del incremento — error individual, el lote continúa.
    if op.entity_type not in _ENTITY_TYPES:
        return _error_op(op, "unsupported_entity_type")
    if op.action not in _ACTIONS:
        return _error_op(op, "unsupported_action")

    h = hash_operacion(
        scope,
        op.entity_type,
        op.entity_id,
        op.action,
        op.base_version,
        op.payload,
    )

    # --- Reserva idempotente (especulativa, primer paso de la tx) ---
    try:
        ledger = await sync_repo.insertar_operacion(
            conn,
            usuario_id,
            dispositivo_id,
            op.client_operation_id,
            h,
            op.entity_type,
            op.entity_id,
            op.action,
        )
    except UniqueViolation as e:
        # Solo la restricción idempotente activa el flujo duplicate/
        # key_reuse (B-1). La tx abortada se revierte ANTES de releer
        # el ledger; cualquier otra UNIQUE es error de integridad.
        await conn.rollback()
        if e.diag.constraint_name == _UQ_LEDGER:
            return await _resolver_duplicado(conn, usuario_id, op, h)
        logger.warning(
            "[SYNC] UNIQUE inesperada en sync_operaciones: %s",
            e.diag.constraint_name,
        )
        return _error_op(op, "internal")

    # --- Dominio + cursor + changelog + resultado: una sola tx ---
    try:
        if op.entity_type == "finca":
            entidad = await _crear_finca(
                conn, usuario_id, dispositivo_id, op
            )
        else:
            entidad = await _crear_lote(
                conn, usuario_id, dispositivo_id, op
            )

        seq = await sync_repo.siguiente_seq(conn, scope)
        version = int(entidad["version"])
        await sync_repo.insertar_cambio(
            conn,
            scope,
            seq,
            op.entity_type,
            op.entity_id,
            "upsert",
            entidad,
            version,
            usuario_id,
        )
        await sync_repo.actualizar_resultado_operacion(
            conn,
            ledger["id"],
            {"entity_id": str(op.entity_id), "server_version": version},
        )
        await conn.commit()
        return SyncOpResult(
            client_operation_id=op.client_operation_id,
            status="applied",
            entity_id=op.entity_id,
            server_version=version,
        )
    except UniqueViolation as e:
        await conn.rollback()
        if e.diag.constraint_name in _PK_ENTIDADES:
            # PK de la entidad ya ocupada — distinguir propia de
            # ajena sin revelar existencia (404 indistinguible).
            propietario = await _propietario(conn, op)
            code = (
                "entity_exists"
                if propietario == usuario_id
                else "not_found"
            )
            return _error_op(op, code)
        # Otra UNIQUE (p.ej. sync_cambios_pkey) es integridad/
        # infraestructura, no "entidad existente".
        logger.warning(
            "[SYNC] UNIQUE inesperada en op %s: %s",
            op.client_operation_id,
            e.diag.constraint_name,
        )
        return _error_op(op, "internal")
    except (PydanticValidationError, DomainValidationError) as e:
        await conn.rollback()
        return _error_op(op, "validation", _detalle_seguro(e))
    except (ForeignKeyViolation, CheckViolation) as e:
        await conn.rollback()
        return _error_op(op, "validation", _detalle_seguro(e))
    except ResourceNotFoundError:
        # 404 de dominio (finca padre ajena/inexistente vía
        # _finca_propia): indistinguible por diseño (M-2).
        await conn.rollback()
        return _error_op(op, "not_found")
    except MelantiaException:
        # Cualquier otro error controlado de dominio/infraestructura
        # NO se disfraza de not_found: error interno de la op (M-2).
        await conn.rollback()
        logger.warning(
            "[SYNC] op %s falló con error controlado",
            op.client_operation_id,
            exc_info=True,
        )
        return _error_op(op, "internal")
    except Exception:
        await conn.rollback()
        logger.exception(
            "[SYNC] op %s falló de forma inesperada",
            op.client_operation_id,
        )
        return _error_op(op, "internal")


async def _resolver_duplicado(
    conn, usuario_id: str, op: SyncOperation, h: str
) -> SyncOpResult:
    """
    Tras la colisión de UNIQUE: relee la fila confirmada y compara
    la huella — semántica A (duplicate) / B (idempotency_key_reuse).
    """
    fila = await sync_repo.obtener_operacion(
        conn, usuario_id, op.client_operation_id
    )
    resultado = fila["resultado"] if fila else None
    if fila and fila["payload_hash"] == h and resultado:
        return SyncOpResult(
            client_operation_id=op.client_operation_id,
            status="duplicate",
            entity_id=resultado.get("entity_id"),
            server_version=resultado.get("server_version"),
        )
    return _error_op(op, "idempotency_key_reuse")


async def _propietario(conn, op: SyncOperation) -> Optional[str]:
    if op.entity_type == "finca":
        return await sync_repo.propietario_finca(conn, op.entity_id)
    return await sync_repo.propietario_lote(conn, op.entity_id)


def _error_op(
    op: SyncOperation,
    code: str,
    detail: Optional[str] = None,
) -> SyncOpResult:
    return SyncOpResult(
        client_operation_id=op.client_operation_id,
        status="error",
        code=code,
        detail=detail,
    )


def _detalle_seguro(exc: Exception) -> str:
    """Detalle del error sin filtrar SQL ni valores internos."""
    if isinstance(exc, PydanticValidationError):
        return "Payload inválido para la entidad declarada"
    if isinstance(exc, (ForeignKeyViolation, CheckViolation)):
        return "Restricción de integridad incumplida"
    return str(exc)


# ============================================================================
# DOMINIO — create con repositorios existentes (sin commits propios)
# ============================================================================

async def _crear_finca(
    conn, usuario_id: str, dispositivo_id: UUID, op: SyncOperation
) -> Dict[str, Any]:
    """
    Crea la finca con el UUID del cliente. Reutiliza el schema y la
    validación geográfica del CRUD web (_resolver_geo) — el usuario
    propietario sale del token, nunca del payload.
    """
    data = FincaCreate.model_validate(op.payload)
    campos = data.model_dump(exclude_unset=True)
    prov, cant, parr = await _resolver_geo(
        conn,
        campos.pop("provincia_id", None),
        campos.pop("canton_id", None),
        campos.pop("parroquia_id", None),
    )
    campos.update(
        {"provincia_id": prov, "canton_id": cant, "parroquia_id": parr}
    )
    campos = {k: v for k, v in campos.items() if v is not None}
    campos["dispositivo_origen_id"] = str(dispositivo_id)
    nueva = await fincas_repo.insertar_finca(
        conn, usuario_id, campos, entity_id=op.entity_id
    )
    return await sync_repo.fila_finca(conn, nueva["id"])


async def _crear_lote(
    conn, usuario_id: str, dispositivo_id: UUID, op: SyncOperation
) -> Dict[str, Any]:
    """
    Crea el lote bajo una finca del usuario. payload.finca_id es la
    relación padre declarada por el cliente; la propiedad se verifica
    con _finca_propia (404 indistinguible si es ajena).

    Hallazgo B-3 registrado para I-3: _finca_propia no filtra
    deleted_at — cuando exista soft-delete habrá que excluir fincas
    tombstoned aquí. En I-2 no es explotable: ningún camino escribe
    deleted_at todavía, así que no puede haber tombstones.
    """
    data = _LoteSyncPayload.model_validate(op.payload)
    await _finca_propia(conn, data.finca_id, usuario_id)
    campos = data.model_dump(
        exclude_unset=True, exclude={"finca_id"}
    )
    campos = {k: v for k, v in campos.items() if v is not None}
    campos["dispositivo_origen_id"] = str(dispositivo_id)
    nuevo = await fincas_repo.insertar_lote(
        conn, str(data.finca_id), campos, entity_id=op.entity_id
    )
    return await sync_repo.fila_lote(conn, nuevo["id"])
