# backend/shared/repositories/audit.py
"""
Writer de auditoría transversal `audit_eventos` (EP-4E-C / E7).

Rol arquitectónico:
- Registra QUE una operación sensible ocurrió. NUNCA decide
  autorización, nunca concede ni revoca permisos — eso vive en
  services/autorizacion.py (resolver) y dependencies.require_ep_access.
- `audit_eventos` es la tabla transversal existente (EP-3 DDL); este
  módulo es su único punto de escritura — no crear otra
  infraestructura.

Atomicidad:
- Ninguna función hace `commit()`: el INSERT queda dentro de la
  transacción de la operación llamadora (mismo conn). Si la operación
  falla y revierte, el evento tampoco queda — nunca hay auditoría de
  algo que no ocurrió.

Semántica de columnas (verificada contra
backend/database/schema/ecosistema_profesional.sql):
- actor_id    → usuarios.id de quien ejecuta; NULL = sistema
                (actor_tipo='sistema').
- accion      → verbo 'dominio.operacion' (VARCHAR 100, libre).
- objeto_*    → entidad afectada ('concesion', 'participante',…).
- contexto_*  → suave, sin FK (precedente D9): 'proyecto' +
                proyecto_id para operaciones EP.
- detalle     → JSONB: metadatos de la operación (recurso_tipo,
                recurso_id, nivel, rol anterior/nuevo, motivo…).
"""
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


# ============================================================================
# ACCIONES EP (convención 'dominio.operacion' — VARCHAR(100), sin CHECK)
# ============================================================================

class AccionEP:
    """Acciones sensibles del Ecosistema Profesional auditables (E7)."""

    CONCESION_OTORGADA = "ep.concesion_otorgada"
    CONCESION_REVOCADA = "ep.concesion_revocada"
    PARTICIPANTE_REMOVIDO = "ep.participante_removido"
    PARTICIPANTE_REACTIVADO = "ep.participante_reactivado"
    PROPIEDAD_TRANSFERIDA = "ep.propiedad_transferida"
    RESPONSABLE_CAMBIADO = "ep.responsable_cambiado"


class AccionSesion:
    """
    Eventos de seguridad de sesión/dispositivo (F7a Fase ①, doc 21 §4).

    Son EVIDENCIA de auditoría: registrar uno de estos eventos nunca
    bloquea nada por sí solo — la decisión de riesgo vive en el
    servicio de sesión (Fase ②), igual que la autorización vive en
    EP fuera de este módulo.
    """

    SESION_CREADA = "sesion.creada"
    SESION_REVOCADA = "sesion.revocada"
    SESION_EXPIRADA = "sesion.expirada"
    SESION_SOSPECHOSA = "sesion.sospechosa"
    DISPOSITIVO_NUEVO = "dispositivo.nuevo"
    DISPOSITIVO_REVOCADO = "dispositivo.revocado"
    REAUTENTICACION = "sesion.reautenticacion"
    SENAL_RIESGO = "seguridad.senal_riesgo"
    UBICACION_INUSUAL = "seguridad.ubicacion_inusual"
    POSIBLE_REPLAY = "seguridad.posible_replay"
    CAMBIO_CRITICO = "seguridad.cambio_critico"


class AccionAuth:
    """
    Eventos del flujo de autenticación F7a Fase ③ (login, registro,
    refresh). Misma tabla audit_eventos, misma regla: evidencia —
    nunca decisión ni bloqueo por sí solos.

    En `detalle` jamás van: password, tokens, pepper, claves ni el
    email sintético completo (solo `huella` — prefijo HMAC de la
    identidad canónica, no reversible).
    """

    LOGIN = "auth.login"
    LOGIN_RECHAZADO = "auth.login_rechazado"
    REGISTRO = "auth.registro"
    REGISTRO_FALLIDO = "auth.registro_fallido"
    REGISTRO_COMPENSADO = "auth.registro_compensado"
    REFRESH = "auth.refresh"
    REFRESH_RECHAZADO = "auth.refresh_rechazado"


# ============================================================================
# WRITER GENÉRICO
# ============================================================================

async def registrar_evento(
    conn,
    accion: str,
    actor_id: Optional[UUID] = None,
    objeto_tipo: Optional[str] = None,
    objeto_id: Optional[UUID] = None,
    contexto_tipo: Optional[str] = None,
    contexto_id: Optional[UUID] = None,
    detalle: Optional[Dict[str, Any]] = None,
    actor_tipo: str = "usuario",
) -> Dict[str, Any]:
    """
    Inserta un evento en audit_eventos y devuelve la fila.

    No hace commit ni captura excepciones: un error de inserción
    (FK, JSONB inválido…) se propaga al llamador y revierte la
    operación junto con el evento — la auditoría nunca se traga el
    fallo de lo que pretende registrar.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO audit_eventos
                (actor_id, actor_tipo, accion, objeto_tipo, objeto_id,
                 contexto_tipo, contexto_id, detalle)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, actor_id, actor_tipo, accion, objeto_tipo,
                      objeto_id, contexto_tipo, contexto_id, detalle,
                      created_at
            """,
            (
                str(actor_id) if actor_id else None,
                actor_tipo,
                accion,
                objeto_tipo,
                str(objeto_id) if objeto_id else None,
                contexto_tipo,
                str(contexto_id) if contexto_id else None,
                Jsonb(detalle) if detalle is not None else None,
            ),
        )
        return await cursor.fetchone()


# ============================================================================
# HELPERS EP — concesiones (E7: otorgada / revocada bien distinguibles)
# ============================================================================

async def auditar_concesion(
    conn,
    otorgada: bool,
    actor_id: Optional[UUID],
    proyecto_id: UUID,
    concesion_id: UUID,
    participante_id: UUID,
    recurso_tipo: str,
    recurso_id: Optional[UUID] = None,
    nivel: Optional[str] = None,
    motivo: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Registra la concesión otorgada o revocada con toda la trazabilidad
    exigida (participante, proyecto, recurso_tipo, recurso_id, nivel,
    actor y fecha — la fecha es created_at de la fila). En revocación
    el actor_id es quien revoca (puede ser 'sistema' al remover al
    participante: actor_id=None + actor_tipo='sistema' vía el caller).
    """
    detalle: Dict[str, Any] = {
        "participante_id": str(participante_id),
        "recurso_tipo": recurso_tipo,
        "recurso_id": str(recurso_id) if recurso_id else None,
        "nivel": nivel,
    }
    if motivo:
        detalle["motivo"] = motivo
    return await registrar_evento(
        conn,
        accion=(AccionEP.CONCESION_OTORGADA if otorgada
                else AccionEP.CONCESION_REVOCADA),
        actor_id=actor_id,
        objeto_tipo="concesion",
        objeto_id=concesion_id,
        contexto_tipo="proyecto",
        contexto_id=proyecto_id,
        detalle=detalle,
        actor_tipo="usuario" if actor_id else "sistema",
    )


async def auditar_participante(
    conn,
    accion: str,
    actor_id: Optional[UUID],
    proyecto_id: UUID,
    participante_id: UUID,
    rol: Optional[str] = None,
    detalle_extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Registra ciclo de vida de participantes: 'removido', 'reactivado',
    transferencia de propiedad y cambio de responsable usan el mismo
    cuerpo con la acción correspondiente de AccionEP.
    """
    detalle: Dict[str, Any] = {"rol": rol}
    if detalle_extra:
        detalle.update(detalle_extra)
    return await registrar_evento(
        conn,
        accion=accion,
        actor_id=actor_id,
        objeto_tipo="participante",
        objeto_id=participante_id,
        contexto_tipo="proyecto",
        contexto_id=proyecto_id,
        detalle=detalle,
    )


# ============================================================================
# SESIONES — eventos de seguridad (F7a Fase ①)
# ============================================================================

async def auditar_sesion(
    conn,
    accion: str,
    sesion_id: UUID,
    actor_id: Optional[UUID] = None,
    dispositivo_id: Optional[UUID] = None,
    detalle: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Registra un evento de seguridad de sesión sobre audit_eventos.

    Convención: objeto = la sesión afectada; contexto = el
    dispositivo (referencia suave, como todos los contexto_*). El
    actor es quien/qué originó el evento; actor_id=None →
    actor_tipo='sistema' (revocación automática, barrido de
    expiración, detector de replay).

    Evidencia, no decisión: este evento no bloquea ni revoca — la
    lógica de riesgo se implementa en la capa de servicio (Fase ②).
    """
    return await registrar_evento(
        conn,
        accion=accion,
        actor_id=actor_id,
        objeto_tipo="sesion",
        objeto_id=sesion_id,
        contexto_tipo="dispositivo",
        contexto_id=dispositivo_id,
        detalle=detalle,
        actor_tipo="usuario" if actor_id else "sistema",
    )
