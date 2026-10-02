# backend/modules/ecosistema_profesional/router.py
"""
Router agregador del Ecosistema Profesional (EP).

Monta los routers por contexto bajo el prefijo /api/v1/ep.
EP-4A: perfiles · EP-4B: workspaces · EP-4E-D: proyectos contextuales
(lectura + concesiones).
"""
from fastapi import APIRouter

from modules.ecosistema_profesional.routes import (
    perfiles,
    proyectos,
    workspaces,
)

router = APIRouter()

router.include_router(perfiles.router)
router.include_router(workspaces.router)
router.include_router(proyectos.router)
