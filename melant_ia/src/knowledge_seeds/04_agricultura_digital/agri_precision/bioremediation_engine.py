"""
Motor de Biorremediación — MELANT IA

Calcula dosis de probióticos y enmiendas para piscinas camaroneras
y suelos degradados, basado en parámetros fisicoquímicos.
"""

from __future__ import annotations


# ─────────────────────────────────────────────
# CONSTANTES DE REFERENCIA (ACUICULTURA)
# ─────────────────────────────────────────────

# Rangos ideales para piscina de camarón (Litopenaeus vannamei)
RANGO_PH_PISCINA = (7.5, 8.5)
RANGO_OD_MG_L = (4.0, 8.0)       # Oxígeno disuelto mg/L
RANGO_SALINIDAD_PPT = (15, 25)    # Partes por mil

# Dosis base de probiótico comercial (g por hectárea-espejo)
DOSIS_BASE_PROBIOTICO_G_HA = 500


def calcular_tratamiento_piscina(
    area_m2: float,
    densidad_pl_m2: float,
    ph_actual: float,
    oxigeno_disuelto: float = 5.0,
    salinidad_ppt: float = 20.0,
) -> dict:
    """
    Calcula la dosis de probiótico y enmiendas para una piscina camaronera.

    Parámetros
    ----------
    area_m2 : superficie de la piscina en m².
    densidad_pl_m2 : post-larvas por m².
    ph_actual : pH medido del agua.
    oxigeno_disuelto : OD en mg/L.
    salinidad_ppt : salinidad en partes por mil.

    Retorna
    -------
    dict con dosis recomendadas y alertas.
    """
    hectareas = area_m2 / 10_000
    alertas = []

    # --- Ajuste de dosis de probiótico por densidad ---
    factor_densidad = 1.0
    if densidad_pl_m2 > 80:
        factor_densidad = 1.5
        alertas.append("Densidad alta: incrementar frecuencia de aplicación")
    elif densidad_pl_m2 > 120:
        factor_densidad = 2.0
        alertas.append("Densidad muy alta: riesgo de estrés; considerar recambio")

    dosis_probiotico_g = DOSIS_BASE_PROBIOTICO_G_HA * hectareas * factor_densidad

    # --- Verificar pH ---
    cal_kg = 0.0
    if ph_actual < RANGO_PH_PISCINA[0]:
        deficit = RANGO_PH_PISCINA[0] - ph_actual
        cal_kg = deficit * 50 * hectareas  # 50 kg cal/ha por unidad de pH
        alertas.append(f"pH bajo ({ph_actual}): aplicar {cal_kg:.1f} kg de cal agrícola")
    elif ph_actual > RANGO_PH_PISCINA[1]:
        alertas.append(f"pH alto ({ph_actual}): verificar fuente de agua y aplicar melaza")

    # --- Verificar oxígeno ---
    if oxigeno_disuelto < RANGO_OD_MG_L[0]:
        alertas.append(
            f"OD bajo ({oxigeno_disuelto} mg/L): activar aireadores o reducir alimentación"
        )

    # --- Verificar salinidad ---
    if salinidad_ppt < RANGO_SALINIDAD_PPT[0]:
        alertas.append(f"Salinidad baja ({salinidad_ppt} ppt): riesgo de vibriosis")
    elif salinidad_ppt > RANGO_SALINIDAD_PPT[1]:
        alertas.append(f"Salinidad alta ({salinidad_ppt} ppt): aumentar recambio de agua")

    resultado = {
        "area_ha": round(hectareas, 2),
        "densidad_pl_m2": densidad_pl_m2,
        "dosis_probiotico_g": round(dosis_probiotico_g, 1),
        "cal_agricola_kg": round(cal_kg, 1),
        "ph_actual": ph_actual,
        "oxigeno_disuelto": oxigeno_disuelto,
        "salinidad_ppt": salinidad_ppt,
        "alertas": alertas if alertas else ["✅ Parámetros dentro de rango óptimo"],
    }

    # Resumen para consola
    print(f"\n🦐 Tratamiento para piscina de {resultado['area_ha']} ha:")
    print(f"   Probiótico: {resultado['dosis_probiotico_g']} g")
    if cal_kg > 0:
        print(f"   Cal agrícola: {resultado['cal_agricola_kg']} kg")
    for a in resultado["alertas"]:
        print(f"   → {a}")

    return resultado
