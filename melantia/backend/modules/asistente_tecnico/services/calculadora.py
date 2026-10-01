# backend/modules/asistente_tecnico/services/calculadora.py
"""
Item 2 — Calculadora Agrícola.

Lógica pura de cálculo agropecuario, migrada del proyecto legacy
(melant_ia/src/modules/02_asistente_tecnico_rural/calculadora_agricola.js)
y enriquecida con las tablas de conocimiento de knowledge/.

100% offline: no requiere base de datos ni servicios externos.
"""
import math
from typing import Any, Dict, Optional

from core.exceptions import KnowledgeUnavailableError
from modules.asistente_tecnico.services.conocimiento import cargar_conocimiento

_CONOCIMIENTO_CULTIVOS = "cultivos_ecuador.json"
_CONOCIMIENTO_PROPORCIONES = "calculadora_proporciones.json"
_CONOCIMIENTO_FERTILIDAD = "calculadora_fertilidad_ec.json"


# ============================================================================
# PARÁMETROS DE CULTIVOS (knowledge/cultivos_ecuador.json)
# ============================================================================

def obtener_cultivos() -> Dict[str, Any]:
    """Retorna la tabla de parámetros técnicos de cultivos de Ecuador."""
    try:
        return cargar_conocimiento(_CONOCIMIENTO_CULTIVOS)["cultivos"]
    except KeyError:
        raise KnowledgeUnavailableError(
            _CONOCIMIENTO_CULTIVOS,
            details={"causa": "clave 'cultivos' no definida"},
        )


def obtener_cultivo(cultivo_id: str) -> Optional[Dict[str, Any]]:
    """Busca un cultivo por su identificador (ej. 'cacao')."""
    return obtener_cultivos().get(cultivo_id.strip().lower())


# ============================================================================
# 1. FUNCIONES AGRÍCOLAS
# ============================================================================

def calcular_densidad(
    area_ha: float,
    distancia_filas_m: float,
    distancia_plantas_m: float,
    germinacion: float = 1.0,
    pureza: float = 1.0,
) -> int:
    """
    Plantas estimadas para un área dada.

    area_m2 / (dist_filas * dist_plantas), ajustado por germinación y
    pureza de la semilla (factores 0..1).
    """
    area_m2 = area_ha * 10_000
    separacion = distancia_filas_m * distancia_plantas_m
    if area_m2 <= 0 or separacion <= 0:
        return 0
    return int(area_m2 / separacion * germinacion * pureza)


def calcular_dosis_mezcla(
    dosis_por_ha: float,
    area_ha: float,
    volumen_tanque_l: float,
    tasa_aplicacion_l_ha: float = 200.0,
) -> Dict[str, float]:
    """
    Dosis total de producto, volumen de caldo y cargas de tanque.

    Semántica definida (corrección C2, auditoría M2 — el legacy solo
    devolvía el volumen del tanque sin calcular):
    - dosis_total = dosis_por_ha * area_ha (producto, en su unidad).
    - agua_necesaria_l = tasa_aplicacion_l_ha * area_ha (caldo total).
    - cargas_tanque = tanques necesarios para preparar el caldo total.
    """
    agua_necesaria_l = tasa_aplicacion_l_ha * area_ha
    return {
        "dosis_total": dosis_por_ha * area_ha,
        "agua_necesaria_l": agua_necesaria_l,
        "cargas_tanque": (
            math.ceil(agua_necesaria_l / volumen_tanque_l)
            if volumen_tanque_l > 0 else 0
        ),
        "tasa_aplicacion_l_ha": tasa_aplicacion_l_ha,
    }


def calcular_dosis_frasco(dosis_bomba_ml: float) -> Dict[str, float]:
    """
    Conversión bomba 20L → frasco de referencia 500 ml.

    Fuente: knowledge/calculadora_proporciones.json
    (regla INIAP/FAO: dividir la dosis de bomba entre 40).
    """
    try:
        reglas = cargar_conocimiento(_CONOCIMIENTO_PROPORCIONES)[
            "calculadora_proporciones"
        ]
        factor = next(
            r["factor_division"]
            for r in reglas["algoritmo_conversion"]
            if r["de"] == "ml_por_Bomba_20L"
        )
    except (KeyError, StopIteration) as exc:
        raise KnowledgeUnavailableError(
            _CONOCIMIENTO_PROPORCIONES,
            details={"causa": f"regla de conversión incompleta ({exc})"},
        )
    return {
        "dosis_bomba_ml": dosis_bomba_ml,
        "dosis_frasco_ml": dosis_bomba_ml / factor,
        "volumen_frasco_ml": reglas["volumen_referencia_frasco_ml"],
        "equivalencias": reglas["manual_equivalencias"],
    }


# ============================================================================
# 2. FUNCIONES GANADERAS
# ============================================================================

def calcular_ugm(vacas: int = 0, toros: int = 0, terneros: int = 0) -> float:
    """
    Unidades de Ganado Mayor (UGM).

    vacas * 1.0 + toros * 1.2 + terneros * 0.5
    """
    return vacas * 1.0 + toros * 1.2 + terneros * 0.5


def calcular_gdp(
    peso_inicial_kg: float,
    peso_final_kg: float,
    dias: int,
) -> float:
    """Ganancia Diaria de Peso (kg/día)."""
    if dias <= 0:
        return 0.0
    return (peso_final_kg - peso_inicial_kg) / dias


# ============================================================================
# 3. FUNCIONES FORESTALES
# ============================================================================

def cubicar_smalian(dap1_cm: float, dap2_cm: float, longitud_m: float) -> float:
    """
    Volumen de madera (m³) por la fórmula de Smalian:
    promedio de las secciones transversales de ambos extremos.
    """
    area1 = math.pi * (dap1_cm / 200) ** 2
    area2 = math.pi * (dap2_cm / 200) ** 2
    return ((area1 + area2) / 2) * longitud_m


def estimar_carbono(
    volumen_madera_m3: float,
    factor_bef: float = 1.3,
    fraccion_carbono: float = 0.5,
) -> float:
    """
    Estimación de CO₂ capturado (tCO₂e).

    biomasa = volumen * BEF; carbono = biomasa * fracción;
    CO₂e = carbono * 3.67 (relación molar CO₂/C).
    """
    biomasa = volumen_madera_m3 * factor_bef
    return biomasa * fraccion_carbono * 3.67


# ============================================================================
# 4. LÓGICA INTELIGENTE
# ============================================================================

def recomendar_riego(agua_util_pct: float) -> Dict[str, str]:
    """Recomendación de riego según porcentaje de agua útil del suelo."""
    if agua_util_pct < 30:
        return {
            "nivel": "ALERTA",
            "mensaje": (
                "Agua útil menor al 30%. Se recomienda activar "
                "plan de riego inmediato."
            ),
        }
    if agua_util_pct < 50:
        return {
            "nivel": "PRECAUCION",
            "mensaje": (
                "Agua útil entre 30% y 50%. Ajuste frecuencia de "
                "monitoreo y riego preventivo."
            ),
        }
    return {
        "nivel": "OK",
        "mensaje": "Humedad adecuada. Mantenga monitoreo de rutina.",
    }


def evaluar_fertilidad(
    materia_organica_pct: Optional[float] = None,
    nitrogeno_mg_kg: Optional[float] = None,
    fosforo_mg_kg: Optional[float] = None,
    potasio_cmol_kg: Optional[float] = None,
    calcio_cmol_kg: Optional[float] = None,
    magnesio_cmol_kg: Optional[float] = None,
    ph_suelo: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evalúa niveles de fertilidad del suelo contra los niveles críticos
    de knowledge/calculadora_fertilidad_ec.json.

    Retorna un dict por nutriente: nivel (BAJO/OPTIMO/ALTO) + alerta.
    """
    try:
        niveles = cargar_conocimiento(_CONOCIMIENTO_FERTILIDAD)[
            "calculadora_fertilidad_ec"
        ]["niveles_criticos"]
    except KeyError as exc:
        raise KnowledgeUnavailableError(
            _CONOCIMIENTO_FERTILIDAD,
            details={"causa": f"niveles críticos incompletos ({exc})"},
        )

    entradas = {
        "materia_organica_pct": materia_organica_pct,
        "nitrogeno_mg_kg": nitrogeno_mg_kg,
        "fosforo_mg_kg": fosforo_mg_kg,
        "potasio_cmol_kg": potasio_cmol_kg,
        "calcio_cmol_kg": calcio_cmol_kg,
        "magnesio_cmol_kg": magnesio_cmol_kg,
    }

    resultado: Dict[str, Any] = {}
    for clave, valor in entradas.items():
        if valor is None:
            continue
        try:
            ref = niveles[clave]
        except KeyError:
            raise KnowledgeUnavailableError(
                _CONOCIMIENTO_FERTILIDAD,
                details={"causa": f"nivel crítico '{clave}' no definido"},
            )
        if valor < ref["bajo"]:
            nivel = "BAJO"
        elif valor <= ref["optimo_max"]:
            nivel = "OPTIMO"
        else:
            nivel = "ALTO"
        resultado[clave] = {
            "valor": valor,
            "nivel": nivel,
            "alerta": ref["alerta_app"] if nivel == "BAJO" else None,
        }

    if ph_suelo is not None:
        try:
            ref = niveles["ph_suelo"]
        except KeyError:
            raise KnowledgeUnavailableError(
                _CONOCIMIENTO_FERTILIDAD,
                details={"causa": "nivel crítico 'ph_suelo' no definido"},
            )
        nivel = "ACIDO" if ph_suelo < ref["acido"] else (
            "NEUTRO" if ph_suelo <= ref["neutro"] else "ALCALINO"
        )
        resultado["ph_suelo"] = {
            "valor": ph_suelo,
            "nivel": nivel,
            "alerta": ref["alerta_app"] if nivel == "ACIDO" else None,
        }

    return resultado
