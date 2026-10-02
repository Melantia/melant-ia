# backend/modules/ecosistema_profesional/dependencies.py
"""
Dependencias FastAPI del Ecosistema Profesional (EP-4E).

`require_ep_access` es la puerta contextual: aplica el resolver de
services/autorizacion.py sobre el proyecto de la ruta.

Reglas de respuesta (§14, E5):
- nivel 'ninguno'  → 404 indistinguible (no revela que el proyecto o el
  recurso existen a quien no tiene acceso).
- nivel insuficiente (> 'ninguno', < mínimo) → 403: el participante
  ve el proyecto pero no la operación pedida.

No usar los placeholders de core/dependencies.py (E8): este módulo es
la única dependencia de autorización del EP.

Uso en endpoints EP (cuando existan):

    @router.get("/proyectos/{proyecto_id}/lotes/{lote_id}")
    async def leer_lote(
        proyecto_id: UUID, lote_id: UUID,
        nivel: str = Depends(require_ep_access(
            "lote", "consulta", recurso_id_param="lote_id")),
        db=Depends(get_db),
        usuario_id: str = Depends(get_current_user),
    ):
        ...
"""
from typing import Optional
from uuid import UUID

from fastapi import Depends, Request

from core.dependencies import get_current_user, get_db
from core.exceptions import AuthorizationError, ResourceNotFoundError
from modules.ecosistema_profesional.services import autorizacion as authz


def require_ep_access(
    recurso_tipo: str,
    nivel_minimo: str = "consulta",
    recurso_id_param: Optional[str] = None,
):
    """
    Factoría de dependencia de autorización contextual.

    Args:
        recurso_tipo: clave de la matriz ('proyecto', 'lote', …).
        nivel_minimo: nivel requerido ('consulta'|'crear'|'editar'|
            'administrar').
        recurso_id_param: nombre del path param que lleva el UUID de la
            instancia (p. ej. 'lote_id'); None = acceso a nivel de tipo.

    Devuelve el nivel efectivo resuelto — el endpoint puede usarlo para
    decidir contenido (p. ej. presupuesto consolidado vs interno).

    Raises:
        ResourceNotFoundError (404): nivel 'ninguno' — ajeno, invitado,
            removido, proyecto inexistente o instancia no vinculada.
        AuthorizationError (403): participante visible con nivel < mínimo.
    """
    async def _verificar(
        request: Request,
        usuario_id: str = Depends(get_current_user),
        db=Depends(get_db),
    ) -> str:
        conn, _ = db
        proyecto_id = request.path_params.get("proyecto_id")
        if not proyecto_id:
            # Endpoint mal cableado — fallo ruidoso, no silencioso
            raise AuthorizationError(
                "La ruta no expone 'proyecto_id' en el path."
            )
        recurso_id = (
            request.path_params.get(recurso_id_param)
            if recurso_id_param else None
        )

        nivel = await authz.resolver_permiso(
            conn, usuario_id, UUID(str(proyecto_id)), recurso_tipo,
            UUID(str(recurso_id)) if recurso_id else None,
        )
        if nivel == authz.NINGUNO:
            raise ResourceNotFoundError("Proyecto", proyecto_id)
        if not authz.nivel_suficiente(nivel, nivel_minimo):
            raise AuthorizationError(
                f"Nivel '{nivel_minimo}' requerido sobre "
                f"'{recurso_tipo}' en el proyecto."
            )
        return nivel

    return _verificar
