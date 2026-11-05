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
import json
import logging
from typing import Any, Dict, Optional, Tuple
from uuid import UUID

from psycopg.errors import CheckViolation, ForeignKeyViolation, UniqueViolation
from pydantic import ValidationError as PydanticValidationError

from core.exceptions import (
    AuthenticationError,
    MelantiaException,
    ResourceNotFoundError,
    ValidationError as DomainValidationError,
)
from modules.gestion_fincas.schemas.fincas import (
    FincaCreate,
    FincaUpdate,
)
from modules.gestion_fincas.schemas.lotes import (
    LoteCreate,
    LoteUpdate,
)
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

# Allowlist I-7 — create + update + delete (soft-delete con
# tombstone), solo fincas y lotes.
_ENTITY_TYPES = ("finca", "lote")
_ACTIONS = ("create", "update", "delete")

# Restricciones UNIQUE reales del DDL — para distinguir colisiones
# por e.diag.constraint_name (B-1), nunca por suposición.
_UQ_LEDGER = "uq_sync_operaciones_client_op"
_PK_ENTIDADES = {"fincas_pkey", "lotes_pkey"}


class _DependientesActivos(MelantiaException):
    """I-7: delete de finca rechazado por lotes activos —
    error de negocio identificable `has_dependents` (Opción A:
    el usuario elimina los lotes uno a uno antes de la finca)."""


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
        if op.action == "create":
            if op.entity_type == "finca":
                entidad = await _crear_finca(
                    conn, usuario_id, dispositivo_id, op
                )
            else:
                entidad = await _crear_lote(
                    conn, usuario_id, dispositivo_id, op
                )
        else:
            if op.action == "update":
                # update — concurrencia optimista (I-6)
                entidad, conflicto = await _actualizar_entidad(
                    conn, usuario_id, op
                )
            else:  # delete — soft-delete + tombstone (I-7)
                entidad, conflicto = await _eliminar_entidad(
                    conn, usuario_id, op
                )
            if conflicto is not None:
                # version_mismatch: nada se escribe en dominio ni
                # changelog — solo el resultado en el ledger, para
                # que un reintento idéntico reproduzca el conflicto.
                await sync_repo.actualizar_resultado_operacion(
                    conn,
                    ledger["id"],
                    {
                        "status": "conflict",
                        "server_state": conflicto,
                    },
                )
                await conn.commit()
                return SyncOpResult(
                    client_operation_id=op.client_operation_id,
                    status="conflict",
                    entity_id=op.entity_id,
                    code="version_mismatch",
                    server_state=conflicto,
                )

        seq = await sync_repo.siguiente_seq(conn, scope)
        version = int(entidad["version"])
        op_changelog = "delete" if op.action == "delete" else "upsert"
        await sync_repo.insertar_cambio(
            conn,
            scope,
            seq,
            op.entity_type,
            op.entity_id,
            op_changelog,
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
    except _DependientesActivos:
        # I-7/Opción A: la finca tiene lotes activos — error de
        # negocio identificable, sin escritura ni persistencia
        # (el resultado no se registra; el reintento tras borrar
        # los lotes debe re-evaluar).
        await conn.rollback()
        return _error_op(op, "has_dependents")
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
        if resultado.get("status") == "conflict":
            # Reintento idéntico de una op que ya fue rechazada por
            # versión: se reproduce el mismo conflicto y estado —
            # el reintento resuelto usa otra client_operation_id.
            return SyncOpResult(
                client_operation_id=op.client_operation_id,
                status="conflict",
                entity_id=op.entity_id,
                code="version_mismatch",
                server_state=resultado.get("server_state"),
            )
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


# ============================================================================
# DOMINIO — update con concurrencia optimista (I-6)
# ============================================================================

def _estado_servidor(fila: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Snapshot JSON-seguro de la fila actual del servidor, para
    `server_state` en conflictos: el cliente lo necesita completo
    para resolver (fechas/UUID/Decimal serializados como str)."""
    if not fila:
        return {}
    return json.loads(
        json.dumps(fila, ensure_ascii=False, default=str)
    )


async def _actualizar_entidad(
    conn, usuario_id: str, op: SyncOperation
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Update con concurrencia optimista. Devuelve
    (entidad_nueva, None) si la versión coincidió y se aplicó, o
    (None, server_state) si hay conflicto — sin tocar la entidad,
    sin changelog, sin consumir seq.

    Propiedad indistinguible: entidad inexistente o ajena →
    ResourceNotFoundError (el caller la traduce a 'not_found').

    TOCTOU: además de comparar `version` leída vs `base_version`,
    el UPDATE exige `version = base_version` en el predicado —
    si una transacción concurrente subió la versión entre ambas,
    el UPDATE no toca fila y se clasifica conflicto igual.
    """
    if op.entity_type == "finca":
        actual = await sync_repo.fila_finca(conn, op.entity_id)
        propia = actual and str(actual["usuario_id"]) == str(usuario_id)
        finca_padre_id = None
    else:
        actual = await sync_repo.fila_lote(conn, op.entity_id)
        propietario = await sync_repo.propietario_lote(
            conn, op.entity_id
        )
        propia = actual and propietario == str(usuario_id)
        finca_padre_id = str(actual["finca_id"]) if actual else None

    if not actual or not propia or actual.get("deleted_at"):
        # B-3 (I-7): una entidad tombstoned se comporta como
        # inexistente — un update nunca la resucita.
        raise ResourceNotFoundError(
            op.entity_type.capitalize(), str(op.entity_id)
        )

    if int(actual["version"]) != int(op.base_version):
        return None, _estado_servidor(actual)

    campos = await _campos_update(conn, actual, op)

    if op.entity_type == "finca":
        actualizada = await fincas_repo.actualizar_finca(
            conn,
            str(op.entity_id),
            usuario_id,
            campos,
            base_version=op.base_version,
        )
    else:
        actualizada = await fincas_repo.actualizar_lote(
            conn,
            str(op.entity_id),
            finca_padre_id,
            campos,
            base_version=op.base_version,
        )
    if not actualizada:
        # TOCTOU real: otra tx incrementó la versión entre la
        # lectura y el UPDATE — conflicto con el estado vigente.
        vigente = (
            await sync_repo.fila_finca(conn, op.entity_id)
            if op.entity_type == "finca"
            else await sync_repo.fila_lote(conn, op.entity_id)
        )
        return None, _estado_servidor(vigente or actual)

    nueva = (
        await sync_repo.fila_finca(conn, op.entity_id)
        if op.entity_type == "finca"
        else await sync_repo.fila_lote(conn, op.entity_id)
    )
    return nueva, None


async def _campos_update(
    conn, actual: Dict[str, Any], op: SyncOperation
) -> Dict[str, Any]:
    """
    Payload → campos editables. Los schemas FincaUpdate/LoteUpdate
    (extra="forbid") son la allowlist: id, usuario_id, version,
    deleted_at y todo campo no declarado se rechazan por schema —
    el caller lo clasifica 'validation'. Misma regla geo que la
    vía web (_resolver_geo sobre el estado actual).
    """
    if op.entity_type == "finca":
        data = FincaUpdate.model_validate(op.payload)
        campos = data.model_dump(exclude_unset=True)
        if not campos:
            raise DomainValidationError("Ningún campo a actualizar")
        geo_keys = {"provincia_id", "canton_id", "parroquia_id"}
        if geo_keys & campos.keys():
            prov, cant, parr = await _resolver_geo(
                conn,
                campos.get("provincia_id", actual["provincia_id"]),
                campos.get("canton_id", actual["canton_id"]),
                campos.get("parroquia_id", actual["parroquia_id"]),
            )
            campos.update(
                {"provincia_id": prov, "canton_id": cant,
                 "parroquia_id": parr}
            )
        return campos

    data = LoteUpdate.model_validate(op.payload)
    campos = data.model_dump(exclude_unset=True)
    if not campos:
        raise DomainValidationError("Ningún campo a actualizar")
    return campos


# ============================================================================
# DOMINIO — delete: soft-delete + tombstone (I-7)
# ============================================================================

async def _eliminar_entidad(
    conn, usuario_id: str, op: SyncOperation
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Soft-delete con concurrencia optimista. Devuelve
    (entidad_tombstoned, None) si se aplicó, o (None, server_state)
    si hay conflicto — sin tombstone, sin changelog, sin seq.

    Entidad ajena/inexistente → ResourceNotFoundError (el caller la
    traduce a 'not_found' indistinguible). Entidad ya tombstoned →
    ResourceNotFoundError igual: por B-3 se comporta como
    inexistente y nunca se emite un segundo tombstone.

    Finca con lotes activos → _DependientesActivos (Opción A
    aprobada: el usuario borra los lotes antes que la finca).
    `bloquear_finca` (FOR UPDATE) serializa la comprobación contra
    INSERTs concurrentes de lotes — la FK `lotes.finca_id` toma
    FOR KEY SHARE sobre la fila padre.
    """
    if op.entity_type == "finca":
        actual = await sync_repo.fila_finca(conn, op.entity_id)
        propia = actual and str(actual["usuario_id"]) == str(usuario_id)
        finca_padre_id = str(op.entity_id)
    else:
        actual = await sync_repo.fila_lote(conn, op.entity_id)
        propietario = await sync_repo.propietario_lote(
            conn, op.entity_id
        )
        propia = actual and propietario == str(usuario_id)
        finca_padre_id = str(actual["finca_id"]) if actual else None

    if not actual or not propia or actual.get("deleted_at"):
        raise ResourceNotFoundError(
            op.entity_type.capitalize(), str(op.entity_id)
        )

    if int(actual["version"]) != int(op.base_version):
        return None, _estado_servidor(actual)

    if op.entity_type == "finca":
        # Serializar delete-vs-insert-lote ANTES de comprobar
        # dependientes (misma tx → lock hasta commit).
        await fincas_repo.bloquear_finca(conn, str(op.entity_id))
        if await fincas_repo.contar_lotes_activos_finca(
            conn, str(op.entity_id)
        ):
            raise _DependientesActivos(
                f"La finca {op.entity_id} tiene lotes activos"
            )
        borrada = await fincas_repo.eliminar_finca(
            conn, str(op.entity_id), usuario_id, op.base_version
        )
    else:
        borrada = await fincas_repo.eliminar_lote(
            conn, str(op.entity_id), finca_padre_id, op.base_version
        )
    if not borrada:
        # TOCTOU: la versión cambió o la entidad fue tombstoned
        # entre la lectura y el UPDATE — conflicto con el estado
        # vigente (o not_found si ya no existe como activa).
        vigente = (
            await sync_repo.fila_finca(conn, op.entity_id)
            if op.entity_type == "finca"
            else await sync_repo.fila_lote(conn, op.entity_id)
        )
        if vigente and not vigente.get("deleted_at"):
            return None, _estado_servidor(vigente)
        raise ResourceNotFoundError(
            op.entity_type.capitalize(), str(op.entity_id)
        )

    entidad = (
        await sync_repo.fila_finca(conn, op.entity_id)
        if op.entity_type == "finca"
        else await sync_repo.fila_lote(conn, op.entity_id)
    )
    return entidad, None
