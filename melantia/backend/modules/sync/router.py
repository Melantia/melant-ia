# backend/modules/sync/router.py
"""Router agregador del módulo de sincronización offline-first."""
from fastapi import APIRouter

from modules.sync.routes import sync

router = APIRouter()

router.include_router(sync.router)
