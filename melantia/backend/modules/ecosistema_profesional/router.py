# backend/modules/ecosistema_profesional/router.py
"""
Router agregador del Ecosistema Profesional (EP).

Monta los routers por contexto bajo el prefijo /api/v1/ep.
EP-4A: identidad profesional (perfiles). Workspaces/proyectos llegan
en EP-4B/EP-4C.
"""
from fastapi import APIRouter

from modules.ecosistema_profesional.routes import perfiles

router = APIRouter()

router.include_router(perfiles.router)
