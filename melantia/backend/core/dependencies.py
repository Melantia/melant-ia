# backend/core/dependencies.py
"""
Dependencias de FastAPI para MELANTIA.

Define las dependencias inyectables en los endpoints de FastAPI:
- Conexión a base de datos
- Autenticación y autorización
- Validación de usuario actual
- Verificación de permisos
"""
import base64
import json
from typing import Optional, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db_connection, get_db_connection_sync
from core.config import settings
from core.security import (
    verify_token,
    get_user_id_from_token,
    verify_password,
    get_password_hash
)
from core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    InvalidTokenError,
    TokenExpiredError,
    DatabaseConnectionError,
    MelantiaException
)


# ============================================================================
# DEPENDENCIA DE AUTENTICACIÓN HTTP
# ============================================================================

security = HTTPBearer(auto_error=False)


# ============================================================================
# DEPENDENCIA DE CONEXIÓN A BASE DE DATOS (ASYNC)
# ============================================================================

async def get_db():
    """
    Dependencia para obtener conexión asíncrona a base de datos.

    Uso en endpoints:
        @app.get("/users")
        async def get_users(db: Tuple[Connection, Cursor] = Depends(get_db)):
            # Usar db[0] para conexión, db[1] para cursor
            pass

    Returns:
        Tupla (conexión, cursor) configurada con dict_row
    """
    try:
        async with get_db_connection() as (conn, cursor):
            yield conn, cursor
    except (HTTPException, MelantiaException):
        # Errores HTTP previstos del endpoint (401/404/409/422...):
        # no son fallos de conexión, se propagan sin enmascarar.
        raise
    except Exception as e:
        raise DatabaseConnectionError(f"Error al obtener conexión a base de datos: {str(e)}")


# ============================================================================
# DEPENDENCIA DE CONEXIÓN A BASE DE DATOS (SYNC)
# ============================================================================

def get_db_sync():
    """
    Dependencia para obtener conexión síncrona a base de datos.

    Uso en endpoints:
        @app.get("/users")
        def get_users(db: Tuple[Connection, Cursor] = Depends(get_db_sync)):
            # Usar db[0] para conexión, db[1] para cursor
            pass

    Note:
        Esta versión es para compatibilidad temporal.
        Preferir get_db() async en nuevo código.

    Returns:
        Tupla (conexión, cursor) configurada con dict_row
    """
    try:
        with get_db_connection_sync() as (conn, cursor):
            yield conn, cursor
    except (HTTPException, MelantiaException):
        raise
    except Exception as e:
        raise DatabaseConnectionError(f"Error al obtener conexión síncrona a base de datos: {str(e)}")


# ============================================================================
# DEPENDENCIA DE USUARIO AUTENTICADO
# ============================================================================

def _leer_iss_sin_verificar(token: str) -> Optional[str]:
    """
    Lee el claim `iss` del payload JWT SIN verificar la firma.

    Solo discrimina el emisor para elegir validador (D4.2 §10 —
    los tokens locales HS256 no llevan iss y caen a la rama
    legacy); el claim en claro jamás se usa para autorizar: la
    verificación criptográfica ocurre después en el validador
    correspondiente. Un iss presente pero desconocido se rechaza —
    no hay fallback silencioso.
    """
    try:
        partes = token.split(".")
        if len(partes) != 3:
            return None
        payload = partes[1] + "=" * (-len(partes[1]) % 4)
        iss = json.loads(base64.urlsafe_b64decode(payload)).get("iss")
        return iss if isinstance(iss, str) else None
    except Exception:
        return None


async def _resolver_usuario_supabase(token: str) -> str:
    """
    Rama Supabase del discriminador (D4.2 §5.2/§9):

        JWKS ES256 → claims → puente (auth.users.id → usuarios.id)
        → sesiones.estado='activa' → str(usuarios.id)

    La verificación del estado de sesión hace que la revocación
    MELANTIA sea efectiva aunque el AT siga criptográficamente
    válido (residual ≤3600 s — F7a.1 §5).
    """
    from core.supabase_jwt import SupabaseTokenError, get_supabase_verifier
    from modules.auth.sesion_service import (
        SesionError, resolver_usuario_desde_claims,
    )

    try:
        claims = await get_supabase_verifier().verificar(token)
    except SupabaseTokenError as e:
        if e.motivo == "jwks_no_disponible":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de autenticación no disponible.",
            )
        raise InvalidTokenError(
            "Token de autenticación inválido o expirado"
        )

    async with get_db_connection() as (conn, _cursor):
        try:
            return await resolver_usuario_desde_claims(conn, claims)
        except SesionError as e:
            if e.motivo == "puente_suspendido":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cuenta suspendida.",
                )
            raise InvalidTokenError(
                "Token de autenticación inválido o expirado"
            )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """
    Dependencia para obtener el ID del usuario actual desde el token JWT.

    Transición dual (D4.2 §10): el `iss` del token elige el
    validador — ES256/JWKS+puente para Supabase, HS256 local para
    el legado (solo si AUTH_LEGACY_ISSUER_ENABLED). En ambas ramas
    el contrato es el mismo: devuelve str(usuarios.id).

    Uso en endpoints:
        @app.get("/profile")
        async def get_profile(user_id: str = Depends(get_current_user)):
            # user_id contiene el ID del usuario autenticado
            pass

    Args:
        credentials: Credenciales HTTP Bearer token

    Returns:
        ID del usuario autenticado

    Raises:
        AuthenticationError: Si no hay token o es inválido
    """
    if credentials is None:
        raise AuthenticationError("Token de autenticación no proporcionado")

    token = credentials.credentials
    iss = _leer_iss_sin_verificar(token)

    issuer_supabase = (
        f"{settings.supabase_url.rstrip('/')}/auth/v1"
        if settings.supabase_url else None
    )

    if issuer_supabase and iss == issuer_supabase:
        return await _resolver_usuario_supabase(token)
    if iss is not None:
        # emisor desconocido: sin fallback silencioso (§10)
        raise InvalidTokenError("Token de autenticación inválido o expirado")

    # Rama legacy — HS256 local, controlada por flag de transición
    if not settings.auth_legacy_issuer_enabled:
        raise InvalidTokenError("Emisor local deshabilitado")

    # Verificar token
    if not verify_token(token):
        raise InvalidTokenError("Token de autenticación inválido o expirado")

    # Extraer user ID
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise InvalidTokenError("No se pudo extraer el ID del usuario del token")

    return user_id


# ============================================================================
# DEPENDENCIA DE USUARIO AUTENTICADO (OPCIONAL)
# ============================================================================

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Dependencia opcional para obtener el ID del usuario actual.

    A diferencia de get_current_user, esta no lanza error si no hay token.
    Útil para endpoints que funcionan tanto para usuarios autenticados
    como para usuarios anónimos.

    Args:
        credentials: Credenciales HTTP Bearer token

    Returns:
        ID del usuario autenticado o None si no hay token
    """
    if credentials is None:
        return None

    if not settings.auth_legacy_issuer_enabled:
        return None  # OFF retira la rama legacy también aquí (§10)

    token = credentials.credentials

    if not verify_token(token):
        return None

    return get_user_id_from_token(token)


# ============================================================================
# DEPENDENCIA DE VERIFICACIÓN DE ROL
# ============================================================================

async def require_role(required_role: str):
    """
    Factoría de dependencia para verificar roles de usuario.

    Uso en endpoints:
        @app.get("/admin")
        async def admin_panel(
            user_id: str = Depends(get_current_user),
            _: None = Depends(require_role("admin"))
        ):
            pass

    Args:
        required_role: Rol requerido para acceder al endpoint

    Returns:
        Dependencia que verifica si el usuario tiene el rol requerido

    Raises:
        AuthorizationError: Si el usuario no tiene el rol requerido
    """
    async def role_checker(user_id: str = Depends(get_current_user)) -> None:
        # TODO: Implementar verificación real de roles en base de datos
        # Por ahora, esto es un placeholder

        # Ejemplo de implementación futura:
        # async with get_db_connection() as (conn, cursor):
        #     await cursor.execute(
        #         "SELECT role FROM usuarios WHERE id = %s",
        #         (user_id,)
        #     )
        #     result = await cursor.fetchone()
        #     if not result or result["role"] != required_role:
        #         raise AuthorizationError(
        #             f"Se requiere rol '{required_role}' para esta acción"
        #         )

        # Por ahora, permitimos todos los roles (placeholder)
        pass

    return role_checker


# ============================================================================
# DEPENDENCIA DE VERIFICACIÓN DE SUSCRIPCIÓN
# ============================================================================

async def require_subscription(required_plan: str = "standard"):
    """
    Factoría de dependencia para verificar el plan de suscripción.

    Uso en endpoints:
        @app.get("/premium-feature")
        async def premium_feature(
            user_id: str = Depends(get_current_user),
            _: None = Depends(require_subscription("premium"))
        ):
            pass

    Args:
        required_plan: Plan mínimo requerido (basic, standard, premium)

    Returns:
        Dependencia que verifica si el usuario tiene el plan requerido

    Raises:
        AuthorizationError: Si el usuario no tiene el plan requerido
    """
    async def subscription_checker(user_id: str = Depends(get_current_user)) -> None:
        # TODO: Implementar verificación real de suscripciones
        # Por ahora, esto es un placeholder

        # Ejemplo de implementación futura:
        # async with get_db_connection() as (conn, cursor):
        #     await cursor.execute(
        #         "SELECT plan_actual FROM usuarios_suscripciones WHERE usuario_id = %s",
        #         (user_id,)
        #     )
        #     result = await cursor.fetchone()
        #     if not result:
        #         raise AuthorizationError("Usuario sin suscripción")
        #
        #     # Definir jerarquía de planes
        #     plan_hierarchy = {"basic": 1, "standard": 2, "premium": 3}
        #     user_plan_level = plan_hierarchy.get(result["plan_actual"], 0)
        #     required_plan_level = plan_hierarchy.get(required_plan, 0)
        #
        #     if user_plan_level < required_plan_level:
        #         raise AuthorizationError(
        #             f"Se requiere plan '{required_plan}' para esta acción"
        #         )

        # Por ahora, permitimos todos los planes (placeholder)
        pass

    return subscription_checker


# ============================================================================
# DEPENDENCIA DE VERIFICACIÓN DE LÍMITES
# ============================================================================

async def check_resource_limit(resource_type: str, max_limit: int):
    """
    Factoría de dependencia para verificar límites de recursos del usuario.

    Uso en endpoints:
        @app.post("/fincas")
        async def create_finca(
            user_id: str = Depends(get_current_user),
            _: None = Depends(check_resource_limit("fincas", 1))
        ):
            pass

    Args:
        resource_type: Tipo de recurso a verificar (fincas, lotes, etc.)
        max_limit: Límite máximo permitido para el usuario

    Returns:
        Dependencia que verifica si el usuario no excede el límite

    Raises:
        AuthorizationError: Si el usuario excede el límite permitido
    """
    async def limit_checker(user_id: str = Depends(get_current_user)) -> None:
        # TODO: Implementar verificación real de límites
        # Por ahora, esto es un placeholder

        # Ejemplo de implementación futura:
        # async with get_db_connection() as (conn, cursor):
        #     await cursor.execute(
        #         f"SELECT COUNT(*) as count FROM {resource_type} WHERE usuario_id = %s",
        #         (user_id,)
        #     )
        #     result = await cursor.fetchone()
        #     current_count = result["count"] if result else 0
        #
        #     if current_count >= max_limit:
        #         raise AuthorizationError(
        #             f"Límite de {resource_type} excedido: {current_count}/{max_limit}"
        #         )

        # Por ahora, no verificamos límites (placeholder)
        pass

    return limit_checker


# ============================================================================
# DEPENDENCIA DE VERIFICACIÓN DE PROPIEDAD
# ============================================================================

async def verify_resource_ownership(resource_type: str, resource_id_param: str = "resource_id"):
    """
    Factoría de dependencia para verificar que un recurso pertenece al usuario.

    Uso en endpoints:
        @app.put("/fincas/{finca_id}")
        async def update_finca(
            finca_id: str,
            user_id: str = Depends(get_current_user),
            _: None = Depends(verify_resource_ownership("fincas", "finca_id"))
        ):
            pass

    Args:
        resource_type: Tipo de recurso (fincas, lotes, etc.)
        resource_id_param: Nombre del parámetro de ruta con el ID del recurso

    Returns:
        Dependencia que verifica la propiedad del recurso

    Raises:
        AuthorizationError: Si el recurso no pertenece al usuario
    """
    async def ownership_checker(
        user_id: str = Depends(get_current_user),
        **kwargs
    ) -> None:
        resource_id = kwargs.get(resource_id_param)
        if not resource_id:
            raise AuthorizationError("ID de recurso no proporcionado")

        # TODO: Implementar verificación real de propiedad
        # Por ahora, esto es un placeholder

        # Ejemplo de implementación futura:
        # async with get_db_connection() as (conn, cursor):
        #     await cursor.execute(
        #         f"SELECT usuario_id FROM {resource_type} WHERE id = %s",
        #         (resource_id,)
        #     )
        #     result = await cursor.fetchone()
        #
        #     if not result or result["usuario_id"] != user_id:
        #         raise AuthorizationError(
        #             f"El {resource_type} no pertenece al usuario"
        #         )

        # Por ahora, permitimos todo (placeholder)
        pass

    return ownership_checker


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    # Seguridad HTTP
    'security',
    # Conexión a base de datos
    'get_db',
    'get_db_sync',
    # Autenticación
    'get_current_user',
    'get_current_user_optional',
    # Autorización
    'require_role',
    'require_subscription',
    'check_resource_limit',
    'verify_resource_ownership',
]
