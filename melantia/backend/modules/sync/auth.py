# backend/modules/sync/auth.py
"""
Identidad de sincronización — vínculo token → sesión (H-1).

El push exige más que "un usuario autenticado": la sesión MELANTIA
exacta del token presentado, porque la procedencia (device_id) y la
revocación deben actuar sobre ESA sesión — no sobre cualquier sesión
activa del usuario en ese dispositivo.

Cadena (solo rama Supabase):
    Bearer AT (ES256/JWKS, verificado criptográficamente)
      → claims.session_id  (claim firmado: el verifier lo exige;
                            jamás se decodifica sin verificar)
      → resolver_usuario_desde_claims (puente + sesión activa)
      → SyncIdentity(usuario_id, session_id)

El resto del vínculo — expires_at vigente, usuario propietario de la
sesión, sesiones.dispositivo_id == device_id del sobre y dispositivo
activo — se comprueba en el service contra la sesión EXACTA.

Legacy HS256: sus tokens no llevan session_id ni ningún identificador
persistido y criptográficamente verificable que permita construir el
vínculo token→sesión — se rechazan con 401 controlado. La
autenticación global de los demás endpoints no se toca.
"""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from core.config import settings
from core.dependencies import (
    _leer_iss_sin_verificar,
    get_db,
    security,
)
from core.exceptions import AuthenticationError, InvalidTokenError
from core.supabase_jwt import SupabaseTokenError, get_supabase_verifier
from modules.auth.sesion_service import (
    SesionError,
    resolver_usuario_desde_claims,
)


@dataclass(frozen=True)
class SyncIdentity:
    """Identidad del push: usuario + la sesión exacta del token."""

    usuario_id: str
    session_id: UUID


async def get_sync_identity(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db),
) -> SyncIdentity:
    """
    Dependencia de autenticación del push. Recorre la verificación
    criptográfica real del token y devuelve la sesión del token para
    que el service la ate al dispositivo declarado en el sobre.

    Rechazos (mismo mapeo que get_current_user):
    - sin token / inválido / expirado       → 401
    - emisor desconocido                    → 401 (sin fallback)
    - legacy HS256 (sin session_id)         → 401 controlado
    - puente inexistente / sesión inactiva  → 401
    - puente suspendido                     → 403
    - JWKS caído sin caché                  → 503
    """
    if credentials is None:
        raise AuthenticationError(
            "Token de autenticación no proporcionado"
        )

    token = credentials.credentials
    iss = _leer_iss_sin_verificar(token)

    issuer_supabase = (
        f"{settings.supabase_url.rstrip('/')}/auth/v1"
        if settings.supabase_url
        else None
    )

    if not (issuer_supabase and iss == issuer_supabase):
        # Emisor desconocido o legacy (iss ausente): para push no hay
        # vínculo criptográfico token→sesión — rechazo controlado que
        # no revela nada sobre sesiones ni dispositivos.
        if iss is not None:
            raise InvalidTokenError(
                "Token de autenticación inválido o expirado"
            )
        raise AuthenticationError(
            "La sincronización requiere una credencial con sesión "
            "verificable"
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

    conn, _cursor = db
    try:
        usuario_id = await resolver_usuario_desde_claims(conn, claims)
    except SesionError as e:
        if e.motivo == "puente_suspendido":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cuenta suspendida.",
            )
        raise InvalidTokenError(
            "Token de autenticación inválido o expirado"
        )

    return SyncIdentity(
        usuario_id=usuario_id,
        session_id=UUID(claims["session_id"]),
    )
