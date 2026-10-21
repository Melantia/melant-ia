# backend/modules/gestion_fincas/router.py
"""
Router agregador del Módulo 3 (Gestión de Fincas).

Monta /fincas (CRUD fincas + lotes) y /geografia (catálogo DPA/INEC
de solo lectura). main.py lo publica bajo el prefijo /api/v1 —
convención de los módulos modernos (asistente, EP).
"""
from fastapi import APIRouter

from modules.gestion_fincas.routes import fincas, geografia

router = APIRouter()

router.include_router(fincas.router)
router.include_router(geografia.router)
