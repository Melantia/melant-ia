# backend/modules/auth/controllers.py
"""
Autenticación de MELANTIA — F7a Fase ③.

/login, /registro y /refresh hablan con Supabase GoTrue por proxy
server-side (D4.2 §7–§8): la identidad fiscal se canoniza y se
deriva a un email sintético HMAC que jamás sale del backend; la
credencial vive solo en Supabase Auth; la autorización sigue
siendo usuarios.id (puente + sesión activa).

El emisor local HS256 sigue vigente SOLO para tokens ya emitidos
(get_current_user, flag AUTH_LEGACY_ISSUER_ENABLED) — muerte
natural por exp; estos endpoints ya no emiten tokens locales.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import get_current_user, get_db
from core.supabase_jwt import SupabaseTokenError
from modules.auth import auth_service
from modules.auth.identidad import IdentidadError
from modules.auth.sesion_service import SesionError
from modules.auth.supabase_client import SupabaseAuthError
from modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RefreshTokenResponse,
    RegistroRequest,
    RegistroResponse,
    TokenSupabaseResponse,
    UsuarioResponse,
)

router = APIRouter()

_CREDENCIALES_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Cédula o contraseña incorrecta.",
)


def _mapear_error(e: Exception) -> HTTPException:
    """
    Traduce los errores internos a HTTP sin exponer detalles
    (anti-oráculo D4.2 §8/§9 — nunca auth.users.id, email
    sintético ni motivos crudos de GoTrue).
    """
    if isinstance(e, IdentidadError):
        if e.motivo == "pepper_no_configurado":
            return HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Servicio de autenticación no disponible.",
            )
        return HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Identificación fiscal inválida.",
        )
    if isinstance(e, SupabaseAuthError):
        if e.motivo.endswith("_no_configurado"):
            return HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Servicio de autenticación no disponible.",
            )
        if e.motivo == "grant_rechazado" and e.status in (400, 401):
            return _CREDENCIALES_INVALIDAS
        return HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Servicio de autenticación no disponible.",
        )
    if isinstance(e, SesionError):
        if e.motivo == "puente_suspendido":
            return HTTPException(
                status.HTTP_403_FORBIDDEN, "Cuenta suspendida."
            )
        if e.motivo == "identidad_duplicada":
            return HTTPException(
                status.HTTP_409_CONFLICT,
                "Ya existe una cuenta con esa identificación.",
            )
        if e.motivo == "cuenta_requiere_reclamo":
            return HTTPException(
                status.HTTP_409_CONFLICT,
                "La cuenta existe y requiere activación.",
            )
        if e.motivo == "politicas_no_aceptadas":
            return HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Debe aceptar las políticas de uso.",
            )
        if e.motivo == "integridad_rota":
            return HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Error interno de cuenta.",
            )
        return _CREDENCIALES_INVALIDAS
    # SupabaseTokenError u otro fallo de verificación
    return _CREDENCIALES_INVALIDAS


@router.post("/login", response_model=TokenSupabaseResponse)
async def login(data: LoginRequest, db=Depends(get_db)):
    """
    Login server-side (D4.2 §8): cédula/RUC → canónico → email
    sintético → GoTrue password grant → JWT verificado → puente →
    sesión MELANTIA activa (30 d absolutos).
    """
    conn, _cursor = db
    try:
        return await auth_service.login(
            conn,
            cedula_ruc=data.cedula_ruc,
            password=data.password,
            dispositivo_id=data.dispositivo_id,
            dispositivo_nombre=data.dispositivo_nombre,
        )
    except (IdentidadError, SupabaseAuthError, SesionError,
            SupabaseTokenError) as e:
        raise _mapear_error(e)


@router.post(
    "/registro",
    response_model=RegistroResponse,
    status_code=status.HTTP_201_CREATED,
)
async def registro(data: RegistroRequest, db=Depends(get_db)):
    """
    Saga de registro (D4.2 §7.2/§22.5): usuarios → auth.users →
    puente, con compensación ante fallo remoto. Reintento
    idempotente: converge por clave natural canónica.
    """
    conn, _cursor = db
    try:
        return await auth_service.registrar(conn, data)
    except (IdentidadError, SupabaseAuthError, SesionError,
            SupabaseTokenError) as e:
        raise _mapear_error(e)


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(data: RefreshRequest, db=Depends(get_db)):
    """
    Refresh server-side (F7a.1 §4): rota el par en GoTrue y
    registra la rotación local — la colisión marca la sesión como
    sospechosa (Supabase no garantiza family-kill, I0.2).
    """
    conn, _cursor = db
    try:
        return await auth_service.refresh(conn, data.refresh_token)
    except (IdentidadError, SupabaseAuthError, SesionError,
            SupabaseTokenError) as e:
        raise _mapear_error(e)


@router.get("/me", response_model=UsuarioResponse)
async def perfil_actual(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Devuelve el perfil del usuario autenticado (verifica el JWT)."""
    conn, cursor = db

    await cursor.execute(
        """
        SELECT id, nombre, cedula_ruc, sector_comunidad
        FROM usuarios
        WHERE id = %s
        """,
        (usuario_id,),
    )
    usuario = await cursor.fetchone()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return {**usuario, "id": str(usuario["id"])}
