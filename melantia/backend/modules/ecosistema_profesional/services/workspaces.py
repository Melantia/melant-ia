# backend/modules/ecosistema_profesional/services/workspaces.py
"""
Servicio de workspaces del EP (EP-4B).

Coordina: router -> este servicio -> shared/repositories/workspaces.

Reglas de negocio:
- Quien crea el workspace queda como miembro propietario/activo.
- Aislamiento: un workspace del que no eres miembro activo es 404 —
  no se revela su existencia.
- Gestión de miembros: propietario o socio (activos) pueden invitar;
  solo propietario cambia rol/estado de otros.
- El invitado entra en 'invitado' y acepta su propia membresía.
- El propietario fundador (workspaces.propietario_id) no puede ser
  removido ni degradado — la transferencia de propiedad está diferida.
- Nunca puede quedar un workspace sin al menos un propietario activo.
- Sin escrituras a `audit_eventos`: los writers llegan con ADM-2.
"""
import logging
from typing import Any, Dict, List
from uuid import UUID

from psycopg.errors import UniqueViolation

from core.exceptions import (
    AuthorizationError,
    BusinessLogicError,
    DuplicateResourceError,
    OperationNotAllowedError,
    ResourceNotFoundError,
)
from modules.ecosistema_profesional.schemas.workspaces import (
    InvitarMiembroRequest,
    WorkspaceCreate,
    WorkspaceUpdate,
)
from shared.repositories import workspaces as repo

logger = logging.getLogger("melantia.ep.workspaces")

ROLES_GESTORES = {"propietario", "socio"}


async def _miembro_activo(
    conn, workspace_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """
    Membresía activa del usuario o 404 (aislamiento: no revela si el
    workspace existe para un ajeno o un removido).
    """
    miembro = await repo.obtener_miembro(conn, workspace_id, usuario_id)
    if not miembro or miembro["estado"] != "activo":
        raise ResourceNotFoundError("Workspace", workspace_id)
    return miembro


async def _exige_gestor(
    conn, workspace_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """Miembro activo con rol gestor (propietario o socio)."""
    miembro = await _miembro_activo(conn, workspace_id, usuario_id)
    if miembro["rol"] not in ROLES_GESTORES:
        raise AuthorizationError(
            "Se requiere rol 'propietario' o 'socio' en el workspace."
        )
    return miembro


async def crear_workspace(
    conn, usuario_id: str, data: WorkspaceCreate
) -> Dict[str, Any]:
    """Crea el workspace y registra al creador como propietario activo."""
    workspace = await repo.crear_workspace(
        conn, usuario_id, data.nombre, data.descripcion
    )
    await repo.agregar_miembro(
        conn, workspace["id"], usuario_id, "propietario"
    )
    await conn.commit()
    logger.info(
        "[WORKSPACE CREADO] id=%s propietario=%s",
        workspace["id"], usuario_id,
    )
    return {**workspace, "mi_rol": "propietario"}


async def listar_mios(conn, usuario_id: str) -> List[Dict[str, Any]]:
    """Workspaces donde el usuario es miembro activo."""
    return await repo.listar_workspaces_usuario(conn, usuario_id)


async def obtener_workspace(
    conn, workspace_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """Detalle con miembros — solo si el usuario es miembro activo."""
    miembro = await _miembro_activo(conn, workspace_id, usuario_id)
    workspace = await repo.obtener_workspace(conn, workspace_id)
    if not workspace:
        raise ResourceNotFoundError("Workspace", workspace_id)
    miembros = await repo.listar_miembros(conn, workspace_id)
    return {**workspace, "mi_rol": miembro["rol"], "miembros": miembros}


async def actualizar_workspace(
    conn, workspace_id: UUID, usuario_id: str, data: WorkspaceUpdate
) -> Dict[str, Any]:
    """Edita nombre/descripción — propietario o socio."""
    await _exige_gestor(conn, workspace_id, usuario_id)
    actualizado = await repo.actualizar_workspace(
        conn, workspace_id, data.nombre, data.descripcion
    )
    if not actualizado:
        raise ResourceNotFoundError("Workspace", workspace_id)
    await conn.commit()
    return actualizado


async def invitar_miembro(
    conn, workspace_id: UUID, usuario_id: str, data: InvitarMiembroRequest
) -> Dict[str, Any]:
    """
    Invita a un usuario (estado 'invitado'). El invitado debe existir;
    la pareja (workspace, usuario) es única — incluso removidos.
    """
    miembro_gestor = await _exige_gestor(conn, workspace_id, usuario_id)
    if data.rol == "propietario" and miembro_gestor["rol"] != "propietario":
        raise AuthorizationError(
            "Solo un propietario puede invitar a otro propietario."
        )
    if not await repo.existe_usuario(conn, data.usuario_id):
        raise ResourceNotFoundError("Usuario", data.usuario_id)

    try:
        miembro = await repo.agregar_miembro(
            conn, workspace_id, data.usuario_id, data.rol
        )
    except UniqueViolation:
        await conn.rollback()
        raise DuplicateResourceError(
            "Miembro del workspace", str(data.usuario_id)
        )
    await conn.commit()
    logger.info(
        "[MIEMBRO INVITADO] ws=%s usuario=%s rol=%s",
        workspace_id, data.usuario_id, data.rol,
    )
    return miembro


async def aceptar_invitacion(
    conn, workspace_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """El usuario invitado acepta su propia membresía (→ 'activo')."""
    miembro = await repo.obtener_miembro(conn, workspace_id, usuario_id)
    if not miembro or miembro["estado"] != "invitado":
        raise ResourceNotFoundError("Invitación", workspace_id)
    actualizado = await repo.actualizar_miembro(
        conn, workspace_id, usuario_id, rol=None, estado="activo"
    )
    await conn.commit()
    return actualizado


async def actualizar_miembro(
    conn, workspace_id: UUID, usuario_id: str, objetivo_id: UUID,
    rol: str = None, estado: str = None,
) -> Dict[str, Any]:
    """
    Cambia rol/estado de un miembro. Solo propietario activo.
    Protege al propietario fundador y al último propietario activo.
    """
    gestor = await _miembro_activo(conn, workspace_id, usuario_id)
    if gestor["rol"] != "propietario":
        raise AuthorizationError(
            "Solo un propietario puede gestionar miembros."
        )

    workspace = await repo.obtener_workspace(conn, workspace_id)
    if not workspace:
        raise ResourceNotFoundError("Workspace", workspace_id)
    objetivo = await repo.obtener_miembro(conn, workspace_id, objetivo_id)
    if not objetivo:
        raise ResourceNotFoundError("Miembro", objetivo_id)

    pierde_propiedad = (
        objetivo["rol"] == "propietario"
        and objetivo["estado"] == "activo"
        and ((rol is not None and rol != "propietario")
             or estado == "removido")
    )
    if pierde_propiedad:
        if str(workspace["propietario_id"]) == str(objetivo_id):
            raise OperationNotAllowedError(
                "actualizar_miembro",
                "el propietario fundador no puede ser degradado ni "
                "removido (transferencia de propiedad diferida)",
            )
        n = await repo.contar_propietarios_activos(conn, workspace_id)
        if n <= 1:
            raise BusinessLogicError(
                "El workspace necesita al menos un propietario activo."
            )

    actualizado = await repo.actualizar_miembro(
        conn, workspace_id, objetivo_id, rol=rol, estado=estado
    )
    await conn.commit()
    return actualizado


async def remover_miembro(
    conn, workspace_id: UUID, usuario_id: str, objetivo_id: UUID
) -> None:
    """
    Marca una membresía como 'removido' (preserva historial). Lo hace un
    propietario activo, o el propio usuario para salir del workspace.
    """
    gestor = await repo.obtener_miembro(conn, workspace_id, usuario_id)
    es_salida_propia = str(objetivo_id) == str(usuario_id)
    es_propietario = (
        gestor and gestor["estado"] == "activo"
        and gestor["rol"] == "propietario"
    )
    if not es_salida_propia and not es_propietario:
        raise ResourceNotFoundError("Workspace", workspace_id)

    workspace = await repo.obtener_workspace(conn, workspace_id)
    if not workspace:
        raise ResourceNotFoundError("Workspace", workspace_id)
    if str(workspace["propietario_id"]) == str(objetivo_id):
        raise OperationNotAllowedError(
            "remover_miembro",
            "el propietario fundador no puede ser removido "
            "(transferencia de propiedad diferida)",
        )

    objetivo = await repo.obtener_miembro(conn, workspace_id, objetivo_id)
    if not objetivo or objetivo["estado"] == "removido":
        raise ResourceNotFoundError("Miembro", objetivo_id)
    if (
        objetivo["rol"] == "propietario"
        and objetivo["estado"] == "activo"
        and await repo.contar_propietarios_activos(conn, workspace_id) <= 1
    ):
        raise BusinessLogicError(
            "El workspace necesita al menos un propietario activo."
        )

    await repo.actualizar_miembro(
        conn, workspace_id, objetivo_id, rol=None, estado="removido"
    )
    await conn.commit()
