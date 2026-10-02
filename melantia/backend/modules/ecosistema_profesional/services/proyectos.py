# backend/modules/ecosistema_profesional/services/proyectos.py
"""
Servicio de proyectos EP — primera integración contextual (EP-4E-D).

Reglas:
- Toda autorización pasa por services/autorizacion.resolver_permiso —
  este service no duplica matriz ni techos.
- Gestionar concesiones exige nivel 'administrar' sobre 'participantes'
  (propietario/profesional_responsable por matriz base).
- E1: la concesión solo se otorga a participante ACTIVO del proyecto.
- E2: el nivel otorgado no puede superar el techo del rol destino.
- E3: recurso_id de tipo vinculable debe tener vínculo vivo con el
  proyecto; un UUID ajeno no autoriza nada.
- E9: duplicado activo → 409 (índices parciales + verificación previa).
- Ninguna función hace commit: la ruta confirma la transacción tras
  service + auditoría en la misma conexión.
"""
import logging
from typing import Any, Dict
from uuid import UUID

from psycopg.errors import UniqueViolation

from core.exceptions import (
    AuthorizationError,
    BusinessLogicError,
    DuplicateResourceError,
    ResourceNotFoundError,
)
from shared.repositories import audit
from shared.repositories import ep_autorizacion as authz_repo
from shared.repositories import ep_proyectos as repo
from modules.ecosistema_profesional.services import autorizacion as authz

logger = logging.getLogger("melantia.ep.proyectos")


async def obtener_proyecto(
    conn, usuario_id: str, proyecto_id: UUID
) -> Dict[str, Any]:
    """Lectura contextual del proyecto — exige consulta mínima."""
    nivel = await authz.resolver_permiso(
        conn, usuario_id, proyecto_id, "proyecto"
    )
    if not authz.nivel_suficiente(nivel, authz.CONSULTA):
        raise ResourceNotFoundError("Proyecto", proyecto_id)
    proyecto = await repo.obtener_proyecto(conn, proyecto_id)
    if not proyecto:
        raise ResourceNotFoundError("Proyecto", proyecto_id)
    return {**proyecto, "mi_nivel": nivel}


async def obtener_lote_contextual(
    conn, usuario_id: str, proyecto_id: UUID, lote_id: UUID
) -> Dict[str, Any]:
    """
    Lectura del lote A TRAVÉS del proyecto (E5): el resolver ya exigió
    el vínculo ep_proyecto_lotes; aquí solo se lee la representación.
    El endpoint /lotes/{id} del módulo origen sigue inaccesible.
    """
    nivel = await authz.resolver_permiso(
        conn, usuario_id, proyecto_id, "lote", lote_id
    )
    if not authz.nivel_suficiente(nivel, authz.CONSULTA):
        raise ResourceNotFoundError("Proyecto", proyecto_id)
    lote = await repo.obtener_lote(conn, lote_id)
    if not lote:
        raise ResourceNotFoundError("Lote", lote_id)
    return {**lote, "mi_nivel": nivel, "contexto": "proyecto"}


# ============================================================================
# CONCESIONES (otorgar / revocar — 'administrar' sobre participantes)
# ============================================================================

async def _exige_admin_participantes(
    conn, usuario_id: str, proyecto_id: UUID
) -> None:
    nivel = await authz.resolver_permiso(
        conn, usuario_id, proyecto_id, "participantes"
    )
    if nivel == authz.NINGUNO:
        raise ResourceNotFoundError("Proyecto", proyecto_id)
    if not authz.nivel_suficiente(nivel, authz.ADMINISTRAR):
        raise AuthorizationError(
            "Se requiere nivel 'administrar' sobre participantes "
            "para gestionar concesiones."
        )


async def otorgar_concesion(
    conn,
    usuario_id: str,
    proyecto_id: UUID,
    usuario_destino_id: UUID,
    recurso_tipo: str,
    nivel: str,
    recurso_id: UUID = None,
    vigente_hasta=None,
) -> Dict[str, Any]:
    """
    Cadena aprobada: actor administrador → participante destino ACTIVO
    del proyecto → recurso vinculado (si es instancia vinculable) →
    nivel ≤ techo del rol destino → INSERT → audit. Sin commit.
    """
    await _exige_admin_participantes(conn, usuario_id, proyecto_id)

    destino = await authz_repo.obtener_participante(
        conn, proyecto_id, usuario_destino_id
    )
    if not destino or destino["estado"] != "activo":
        raise ResourceNotFoundError("Participante", usuario_destino_id)

    # E2: el grant no puede superar el techo del rol del DESTINO
    techo = authz.TECHOS_ROL.get(destino["rol"], authz.NINGUNO)
    if not authz.nivel_suficiente(techo, nivel):
        raise BusinessLogicError(
            f"El nivel '{nivel}' supera el techo '{techo}' del rol "
            f"'{destino['rol']}'."
        )

    # E3: instancia vinculable exige vínculo vivo con ESTE proyecto
    if recurso_id is not None and recurso_tipo in authz_repo.VINCULOS:
        if not await authz_repo.existe_vinculo(
            conn, proyecto_id, recurso_tipo, recurso_id
        ):
            raise ResourceNotFoundError("Recurso", recurso_id)

    try:
        concesion = await repo.crear_concesion(
            conn, proyecto_id, destino["id"], recurso_tipo, nivel,
            otorgado_por=usuario_id, recurso_id=recurso_id,
            vigente_hasta=vigente_hasta,
        )
    except UniqueViolation:
        # E9: ya existe una activa equivalente (índice parcial) —
        # cambiar nivel = revocar la activa + crear una nueva
        raise DuplicateResourceError(
            "Concesión activa", f"{recurso_tipo}:{recurso_id or 'tipo'}"
        )

    await audit.auditar_concesion(
        conn, otorgada=True, actor_id=usuario_id, proyecto_id=proyecto_id,
        concesion_id=concesion["id"], participante_id=destino["id"],
        recurso_tipo=recurso_tipo, recurso_id=recurso_id, nivel=nivel,
    )
    logger.info(
        "[CONCESION OTORGADA] proyecto=%s destino=%s tipo=%s nivel=%s",
        proyecto_id, usuario_destino_id, recurso_tipo, nivel,
    )
    return concesion


async def revocar_concesion(
    conn, usuario_id: str, proyecto_id: UUID, concesion_id: UUID
) -> Dict[str, Any]:
    """
    Marca la concesión 'revocada' con revocado_por/at + audit.
    La fila histórica NUNCA se borra (E1/E9). Sin commit.
    """
    await _exige_admin_participantes(conn, usuario_id, proyecto_id)

    concesion = await repo.obtener_concesion(conn, proyecto_id, concesion_id)
    if not concesion or concesion["estado"] != "activa":
        raise ResourceNotFoundError("Concesión", concesion_id)

    revocada = await repo.revocar_concesion(
        conn, concesion_id, revocado_por=usuario_id
    )
    await audit.auditar_concesion(
        conn, otorgada=False, actor_id=usuario_id, proyecto_id=proyecto_id,
        concesion_id=concesion["id"],
        participante_id=concesion["participante_id"],
        recurso_tipo=concesion["recurso_tipo"],
        recurso_id=concesion["recurso_id"], nivel=concesion["nivel"],
    )
    logger.info(
        "[CONCESION REVOCADA] proyecto=%s concesion=%s por=%s",
        proyecto_id, concesion_id, usuario_id,
    )
    return revocada
