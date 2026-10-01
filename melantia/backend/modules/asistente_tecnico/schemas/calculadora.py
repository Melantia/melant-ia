# backend/modules/asistente_tecnico/schemas/calculadora.py
"""Schemas de entrada/salida para la Calculadora Agrícola (item 2)."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DensidadRequest(BaseModel):
    area_ha: float = Field(..., gt=0)
    distancia_filas_m: float = Field(..., gt=0)
    distancia_plantas_m: float = Field(..., gt=0)
    germinacion_pct: float = Field(100, ge=0, le=100)
    pureza_pct: float = Field(100, ge=0, le=100)
    cultivo: Optional[str] = None


class DensidadResponse(BaseModel):
    plantas_estimadas: int


class DosisRequest(BaseModel):
    dosis_por_ha: float = Field(..., ge=0)
    area_ha: float = Field(..., gt=0)
    volumen_tanque_l: float = Field(..., gt=0)
    tasa_aplicacion_l_ha: float = Field(
        200.0,
        gt=0,
        description="Litros de caldo aplicados por hectárea (estándar de bomba: 200 L/ha)",
    )


class DosisResponse(BaseModel):
    dosis_total: float
    agua_necesaria_l: float
    cargas_tanque: int
    tasa_aplicacion_l_ha: float


class DosisFrascoRequest(BaseModel):
    dosis_bomba_ml: float = Field(..., ge=0)


class DosisFrascoResponse(BaseModel):
    dosis_bomba_ml: float
    dosis_frasco_ml: float
    volumen_frasco_ml: int
    equivalencias: List[Dict[str, Any]]


class UGMRequest(BaseModel):
    vacas: int = Field(0, ge=0)
    toros: int = Field(0, ge=0)
    terneros: int = Field(0, ge=0)


class UGMResponse(BaseModel):
    ugm: float


class GDPRequest(BaseModel):
    peso_inicial_kg: float = Field(..., ge=0)
    peso_final_kg: float = Field(..., ge=0)
    dias: int = Field(..., gt=0)


class GDPResponse(BaseModel):
    gdp_kg_dia: float


class CarbonoRequest(BaseModel):
    dap1_cm: float = Field(..., gt=0)
    dap2_cm: float = Field(..., gt=0)
    longitud_m: float = Field(..., gt=0)
    factor_bef: float = Field(1.3, gt=0)
    fraccion_carbono: float = Field(0.5, gt=0, le=1)


class CarbonoResponse(BaseModel):
    volumen_madera_m3: float
    co2_estimado_t: float


class RiegoRequest(BaseModel):
    agua_util_pct: float = Field(..., ge=0, le=100)


class RiegoResponse(BaseModel):
    nivel: str
    mensaje: str


class NutrienteEvaluacion(BaseModel):
    """Evaluación de un nutriente: valor, nivel y alerta opcional."""
    valor: float
    nivel: str
    alerta: Optional[str] = None


class FertilidadRequest(BaseModel):
    materia_organica_pct: Optional[float] = None
    nitrogeno_mg_kg: Optional[float] = None
    fosforo_mg_kg: Optional[float] = None
    potasio_cmol_kg: Optional[float] = None
    calcio_cmol_kg: Optional[float] = None
    magnesio_cmol_kg: Optional[float] = None
    ph_suelo: Optional[float] = Field(None, ge=0, le=14)


class CultivoInfoResponse(BaseModel):
    id: str
    nombre: str
    distancia_filas_m: float
    distancia_plantas_m: float
    npk_kg_ha_min: float
    npk_kg_ha_max: float
    co2_t_ha_anio_min: float
    co2_t_ha_anio_max: float
