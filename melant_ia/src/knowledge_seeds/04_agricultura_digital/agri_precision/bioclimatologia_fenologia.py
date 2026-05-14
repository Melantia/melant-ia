"""
Módulo: bioclimatologia_fenologia.py
Lógica de IA para predicción de fenología y alertas climáticas en cultivos.
"""
from typing import List, Dict, Optional

def calcular_gdc(temperaturas: List[float], umbral: float = 10.0) -> float:
    """Calcula Grados Día Calor (GDC) acumulados sobre un umbral."""
    return sum(max(t - umbral, 0) for t in temperaturas)

def alerta_hongos(humedad: float, temperatura: float) -> Optional[str]:
    """Alerta de riesgo de hongos si humedad >80% y temperatura estable (20-28°C)."""
    if humedad > 80 and 20 <= temperatura <= 28:
        return "Riesgo de hongos: Recomendar fumigación preventiva."
    return None

def calcular_vpd(temp: float, hr: float) -> float:
    """Calcula el Déficit de Presión de Vapor (VPD) en kPa."""
    # Fórmula simplificada
    es = 0.6108 * 2.71828**((17.27*temp)/(temp+237.3))
    ea = es * (hr/100)
    return round(es - ea, 2)

def alerta_vpd(vpd: float) -> Optional[str]:
    """Alerta si el VPD es muy alto (>2 kPa)."""
    if vpd > 2:
        return "Alerta: VPD alto, la planta cierra estomas. Recomendar riego o sombreado."
    return None

def ventana_aplicacion(viento: float, lluvia_prob: float) -> Optional[str]:
    """Ventana de aplicación de insumos si viento <12 km/h y lluvia <20%."""
    if viento < 12 and lluvia_prob < 20:
        return "Buen momento para abonar/fumigar. No habrá lavado por lluvia ni deriva por viento."
    return None

def alerta_cosecha(sol_3dias: bool) -> Optional[str]:
    if sol_3dias:
        return "Inicie cosecha. El grano/fruta llegará seco y con mejor precio al centro de acopio."
    return None

def resumen_impacto_climatico(datos: Dict) -> str:
    """Traduce datos climáticos en recomendaciones económicas."""
    impacto = []
    if datos.get("gdc", 0) > 100:
        impacto.append("Contratar mano de obra para cosecha.")
    if datos.get("hongos"):
        impacto.append(datos["hongos"])
    if datos.get("vpd_alerta"):
        impacto.append(datos["vpd_alerta"])
    if datos.get("ventana"):
        impacto.append(datos["ventana"])
    if datos.get("cosecha"):
        impacto.append(datos["cosecha"])
    return " ".join(impacto) if impacto else "Condiciones normales."
