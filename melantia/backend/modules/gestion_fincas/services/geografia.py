# backend/modules/gestion_fincas/services/geografia.py
"""
Servicio de solo lectura del catálogo geográfico DPA/INEC.

Sin reglas de negocio: delega al repositorio. Existe como capa
propia para que el router siga la convención delgada del proyecto
y para el punto de extensión de filtros/caché futuros.
"""
from typing import Any, Dict, List, Optional

from shared.repositories import geografia as repo


async def listar_provincias(conn) -> List[Dict[str, Any]]:
    return await repo.listar_provincias(conn)


async def listar_cantones(
    conn, provincia_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    return await repo.listar_cantones(conn, provincia_id)


async def listar_parroquias(
    conn, canton_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    return await repo.listar_parroquias(conn, canton_id)
