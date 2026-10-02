# backend/modules/suscripciones/controllers.py
"""
Controlador del Módulo 1: Suscripciones & Melantios.

Expone los endpoints REST consumidos por el frontend
(api/suscripcionesApi.js): registro inteligente y renovación
de membresía.
"""
from fastapi import APIRouter, HTTPException, status

from modules.suscripciones.schemas import (
    RegistroRequest,
    RegistroResponse,
    RenovacionRequest,
    RenovacionResponse,
)
from modules.suscripciones.services import AuthSuscripcionesUnificado

router = APIRouter()

# Almacenamiento temporal en memoria para el MVP.
# NOTA: Será reemplazado por la tabla usuarios_suscripciones de PostgreSQL.
_db_perfiles: list = []


def _buscar_perfil(identificador: str):
    """Localiza un perfil por su identificador único."""
    return next(
        (p for p in _db_perfiles if p["identificador"] == identificador),
        None,
    )


@router.post(
    "/registro",
    response_model=RegistroResponse,
    summary="Registro inteligente de usuario",
)
def registrar_usuario(data: RegistroRequest):
    """
    Registra un usuario nuevo o actualiza uno existente.

    Exige la aceptación de la política de privacidad para auditar
    los datos del productor ante evaluaciones financieras.
    """
    resultado = AuthSuscripcionesUnificado.procesar_registro_inteligente(
        _db_perfiles,
        data.model_dump(),
    )

    if resultado.get("estado") == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resultado["mensaje"],
        )

    return resultado


@router.post(
    "/renovacion",
    response_model=RenovacionResponse,
    summary="Renovar membresía de suscripción",
)
def renovar_suscripcion(data: RenovacionRequest):
    """
    Renueva la membresía del productor por 30 días adicionales.

    Integra la pasarela de cobro local (Deuna/Payphone) para
    registrar el monto pagado en USD.
    """
    perfil = _buscar_perfil(data.identificador_unico)

    if perfil is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe un perfil registrado con ese identificador.",
        )

    resultado = AuthSuscripcionesUnificado.renovar_membresia_deuna(
        perfil,
        data.tipo_plan,
    )

    if resultado.get("estado") == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resultado["mensaje"],
        )

    return resultado
