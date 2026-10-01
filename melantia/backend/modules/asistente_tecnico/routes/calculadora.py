# backend/modules/asistente_tecnico/routes/calculadora.py
"""
Endpoints del Item 2 — Calculadora Agrícola.

Lógica pura, sin persistencia: funciona igual online/offline
(la app móvil puede replicar estos cálculos con la misma
semilla de conocimiento descargada).
"""
from typing import Dict

from fastapi import APIRouter

from modules.asistente_tecnico.schemas.calculadora import (
    CarbonoRequest,
    CarbonoResponse,
    CultivoInfoResponse,
    DensidadRequest,
    DensidadResponse,
    DosisFrascoRequest,
    DosisFrascoResponse,
    DosisRequest,
    DosisResponse,
    FertilidadRequest,
    GDPRequest,
    NutrienteEvaluacion,
    GDPResponse,
    RiegoRequest,
    RiegoResponse,
    UGMRequest,
    UGMResponse,
)
from modules.asistente_tecnico.services import calculadora as svc

router = APIRouter(prefix="/calculadora", tags=["Asistente: Calculadora Agrícola"])


@router.get("/cultivos", response_model=list[CultivoInfoResponse])
def listar_cultivos():
    """Parámetros técnicos de cultivos de Ecuador (marcos, NPK, CO₂)."""
    return [
        {"id": clave, **datos} for clave, datos in svc.obtener_cultivos().items()
    ]


@router.post("/densidad", response_model=DensidadResponse)
def densidad(data: DensidadRequest):
    plantas = svc.calcular_densidad(
        area_ha=data.area_ha,
        distancia_filas_m=data.distancia_filas_m,
        distancia_plantas_m=data.distancia_plantas_m,
        germinacion=data.germinacion_pct / 100,
        pureza=data.pureza_pct / 100,
    )
    return {"plantas_estimadas": plantas}


@router.post("/dosis", response_model=DosisResponse)
def dosis(data: DosisRequest):
    """Dosis total, volumen de caldo y cargas de tanque para la aplicación."""
    return svc.calcular_dosis_mezcla(
        dosis_por_ha=data.dosis_por_ha,
        area_ha=data.area_ha,
        volumen_tanque_l=data.volumen_tanque_l,
        tasa_aplicacion_l_ha=data.tasa_aplicacion_l_ha,
    )


@router.post("/dosis-frasco", response_model=DosisFrascoResponse)
def dosis_frasco(data: DosisFrascoRequest):
    """Conversión bomba 20L → frasco 500 ml (calibración INIAP/FAO)."""
    return svc.calcular_dosis_frasco(data.dosis_bomba_ml)


@router.post("/ugm", response_model=UGMResponse)
def ugm(data: UGMRequest):
    return {"ugm": svc.calcular_ugm(data.vacas, data.toros, data.terneros)}


@router.post("/gdp", response_model=GDPResponse)
def gdp(data: GDPRequest):
    return {
        "gdp_kg_dia": svc.calcular_gdp(
            data.peso_inicial_kg, data.peso_final_kg, data.dias
        )
    }


@router.post("/carbono", response_model=CarbonoResponse)
def carbono(data: CarbonoRequest):
    volumen = svc.cubicar_smalian(data.dap1_cm, data.dap2_cm, data.longitud_m)
    co2 = svc.estimar_carbono(volumen, data.factor_bef, data.fraccion_carbono)
    return {"volumen_madera_m3": volumen, "co2_estimado_t": co2}


@router.post("/riego", response_model=RiegoResponse)
def riego(data: RiegoRequest):
    return svc.recomendar_riego(data.agua_util_pct)


@router.post("/fertilidad", response_model=Dict[str, NutrienteEvaluacion])
def fertilidad(data: FertilidadRequest):
    """Evalúa niveles de nutrientes del suelo vs. rangos críticos INIAP."""
    return svc.evaluar_fertilidad(**data.model_dump())
