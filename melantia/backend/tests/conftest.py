# backend/tests/conftest.py
"""Permite importar los paquetes del backend (core, modules, shared)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
