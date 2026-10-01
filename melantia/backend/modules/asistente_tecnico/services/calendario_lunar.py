# backend/modules/asistente_tecnico/services/calendario_lunar.py
"""
Item 3 — Calendario Lunar.

Algoritmo de fase lunar migrado del proyecto legacy
(melant_ia/.../calendario_lunar.js): edad lunar por mes sinódico
(29.530588853 días) anclado a la luna nueva de referencia
2000-01-06 18:14 UTC.

100% offline: cálculo astronómico local, sin dependencias externas.
"""
import calendar
from datetime import date, datetime, timezone
from typing import Any, Dict, List

from core.exceptions import KnowledgeUnavailableError
from modules.asistente_tecnico.services.conocimiento import cargar_conocimiento

# Luna nueva de referencia: 6-ene-2000 18:14 UTC (efeméride estándar).
_LUNA_NUEVA_REF = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
_MES_SINODICO = 29.530588853

# Límites de edad lunar para cada fase (días).
_LIMITE_CUARTO_CRECIENTE = 7.38
_LIMITE_LUNA_LLENA = 14.77
_LIMITE_CUARTO_MENGUANTE = 22.15

# Orden del ciclo lunar (índice 0..3). Los nombres e iconos son
# constantes astronómicas/presentacionales; las recomendaciones
# agronómicas provienen de knowledge/calendario_lunar.json
# (fuente canónica — decisión C3 de la auditoría M2).
_NOMBRES_FASE = [
    "Luna Nueva",
    "Cuarto Creciente",
    "Luna Llena",
    "Cuarto Menguante",
]
_ICONOS_FASE = ["🌑", "🌓", "🌕", "🌗"]


def _descripcion_fase(nombre_fase: str) -> str:
    """
    Descripción/recomendación agronómica de la fase desde la
    base de conocimiento (fuente canónica).

    Raises:
        KnowledgeUnavailableError: si el JSON falta, está corrupto
            o no contiene la fase (despliegue inconsistente).
    """
    conocimiento = cargar_conocimiento("calendario_lunar.json")
    try:
        fases_doc = conocimiento["calendario_lunar"]["fases"]
    except KeyError as exc:
        raise KnowledgeUnavailableError(
            "calendario_lunar.json",
            details={"causa": f"estructura incompleta ({exc})"},
        )

    descripcion = next(
        (f["descripcion"] for f in fases_doc if f.get("nombre") == nombre_fase),
        None,
    )
    if descripcion is None:
        raise KnowledgeUnavailableError(
            "calendario_lunar.json",
            details={"causa": f"fase '{nombre_fase}' no definida"},
        )
    return descripcion


def _a_datetime(fecha: date) -> datetime:
    """Normaliza una fecha a datetime consciente de UTC."""
    if isinstance(fecha, datetime):
        dt = fecha
    else:
        dt = datetime(fecha.year, fecha.month, fecha.day)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def calcular_fase_lunar(fecha: date) -> Dict[str, Any]:
    """
    Calcula la fase lunar de una fecha.

    Retorna: nombre de fase, icono, edad lunar (días), índice de fase
    y recomendación agronómica. La recomendación y la descripción
    provienen de knowledge/calendario_lunar.json (fuente canónica).
    """
    dt = _a_datetime(fecha)
    dias = (dt - _LUNA_NUEVA_REF).total_seconds() / 86_400
    edad = (dias % _MES_SINODICO + _MES_SINODICO) % _MES_SINODICO

    if edad < _LIMITE_CUARTO_CRECIENTE:
        indice = 0
    elif edad < _LIMITE_LUNA_LLENA:
        indice = 1
    elif edad < _LIMITE_CUARTO_MENGUANTE:
        indice = 2
    else:
        indice = 3

    descripcion = _descripcion_fase(_NOMBRES_FASE[indice])

    return {
        "fase": _NOMBRES_FASE[indice],
        "icono": _ICONOS_FASE[indice],
        "indice_fase": indice,
        "edad_lunar_dias": round(edad, 2),
        "recomendacion": descripcion,
        "descripcion": descripcion,
    }


def calendario_mensual(anio: int, mes: int) -> List[Dict[str, Any]]:
    """Genera la fase lunar de cada día del mes (para vista calendario)."""
    _, dias_mes = calendar.monthrange(anio, mes)
    return [
        {"fecha": date(anio, mes, dia).isoformat(), **calcular_fase_lunar(date(anio, mes, dia))}
        for dia in range(1, dias_mes + 1)
    ]
