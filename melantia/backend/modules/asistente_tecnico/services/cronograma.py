# backend/modules/asistente_tecnico/services/cronograma.py
"""
Item 4 — Cronograma de Siembra.

Genera el calendario de labores de un cultivo a partir de la fecha de
siembra, usando los hitos de knowledge/calendario_siembras.json.

Lógica migrada del proyecto legacy
(melant_ia/.../cronograma_siembra.js → generarCronogramaSiembra).

Offline: el conocimiento es un JSON local descargable.
"""
import unicodedata
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from modules.asistente_tecnico.services.conocimiento import cargar_conocimiento


def _normalizar(texto: str) -> str:
    """
    Minúsculas sin tildes ni diacríticos: 'Maíz' == 'maiz' == 'MAIZ'.

    El conocimiento legacy usa nombres de presentación con tildes
    ('Maíz', 'Raíz'); la entrada del usuario rara vez las incluye.
    """
    return "".join(
        c
        for c in unicodedata.normalize("NFD", texto.strip().lower())
        if unicodedata.category(c) != "Mn"
    )


def listar_cultivos() -> List[Dict[str, Any]]:
    """Cultivos con cronograma disponible (nombre + categoría + ciclo)."""
    cultivos = cargar_conocimiento("calendario_siembras.json")
    return [
        {
            "cultivo": c["cultivo"],
            "categoria": c.get("categoria"),
            "ciclo_total_dias": c["configuracion_calendario"].get(
                "ciclo_total_dias"
            ),
            "siembra_directa": c["configuracion_calendario"].get(
                "siembra_directa"
            ),
            "fase_lunar_ideal_siembra": c["configuracion_calendario"].get(
                "fase_lunar_ideal_siembra"
            ),
        }
        for c in cultivos
    ]


def _buscar_cultivo(nombre: str) -> Optional[Dict[str, Any]]:
    cultivos = cargar_conocimiento("calendario_siembras.json")
    clave = _normalizar(nombre)
    return next(
        (c for c in cultivos if _normalizar(c["cultivo"]) == clave),
        None,
    )


def _recomendacion_lunar(fase_nombre: Optional[str]) -> str:
    """Descripción de la fase lunar ideal desde la base de conocimiento."""
    if not fase_nombre:
        return ""
    try:
        conocimiento = cargar_conocimiento("calendario_lunar.json")
        fases = conocimiento["calendario_lunar"]["fases"]
        fase = next((f for f in fases if f["nombre"] == fase_nombre), None)
        return fase["descripcion"] if fase else ""
    except (FileNotFoundError, KeyError):
        return ""


def generar_cronograma(cultivo_nombre: str, fecha_siembra: date) -> Dict[str, Any]:
    """
    Genera el cronograma de labores de un cultivo.

    Cada hito del JSON (dia_inicio/dia_fin) se convierte en un evento
    con fechas calendario absolutas.

    Raises:
        ValueError: si el cultivo no existe en la base de conocimiento.
    """
    cultivo = _buscar_cultivo(cultivo_nombre)
    if cultivo is None:
        disponibles = [c["cultivo"] for c in listar_cultivos()]
        raise ValueError(
            f"Cultivo '{cultivo_nombre}' no encontrado. "
            f"Disponibles: {', '.join(disponibles)}"
        )

    config = cultivo["configuracion_calendario"]
    eventos = []
    for hito in config.get("hitos", []):
        fecha_inicio = fecha_siembra + timedelta(days=hito["dia_inicio"])
        fecha_fin = fecha_siembra + timedelta(
            days=hito.get("dia_fin", hito["dia_inicio"])
        )
        eventos.append(
            {
                "tarea": hito["tarea"],
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat(),
                "instruccion": hito.get("instruccion", ""),
            }
        )

    fase_ideal = config.get("fase_lunar_ideal_siembra")

    return {
        "cultivo": cultivo["cultivo"],
        "categoria": cultivo.get("categoria"),
        "siembra_directa": config.get("siembra_directa"),
        "ciclo_total_dias": config.get("ciclo_total_dias"),
        "fecha_siembra": fecha_siembra.isoformat(),
        "fase_lunar_ideal": fase_ideal,
        "recomendacion_lunar": _recomendacion_lunar(fase_ideal),
        "eventos": eventos,
    }
