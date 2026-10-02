# backend/modules/asistente_tecnico/router.py
"""
Router agregador del Módulo 2 — Asistente Técnico Rural.

Monta los routers por contexto bajo el prefijo /api/v1/asistente.
Los endpoints de cálculo puro (calculadora, lunar, cronograma,
geodesia) son de lógica local: no persisten datos de usuario.
El contexto productivo sí requiere autenticación JWT.
"""
from fastapi import APIRouter

from modules.asistente_tecnico.routes import (
    calculadora,
    calendario,
    contexto,
    geodesia,
    levantamientos,
)

router = APIRouter()

router.include_router(calculadora.router)
router.include_router(calendario.router)
router.include_router(geodesia.router)
router.include_router(levantamientos.router)
router.include_router(contexto.router)
