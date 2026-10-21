# backend/modules/auth/supabase_client.py
"""
Cliente server-side de Supabase Auth (GoTrue) — Fase ②.

Credenciales (decisión cerrada I0.1 / doc 20):
- `sb_secret_*`  → Admin API únicamente (crear/borrar/logout admin).
- `sb_publishable_*` → grants públicos server-side (password,
  refresh) — D4.2 §8.1.
- `service_role` y `anon` legacy: PROHIBIDAS — no se leen aquí.

El refresh token transita por este cliente en memoria hacia
GoTrue; jamás se persiste en claro (custodia cifrada pendiente de
decisión de gestión de claves — ver informe F7a.②).

Nada de lo devuelto por estas funciones debe loguearse: contienen
tokens. Los errores se reducen a motivo genérico.
"""
from typing import Any, Dict, Optional

import httpx

from core.config import settings

_TIMEOUT_S = 10.0


class SupabaseAuthError(Exception):
    """Error de GoTrue reducido a motivo seguro (sin body/tokens)."""

    def __init__(self, motivo: str, status: Optional[int] = None):
        self.motivo = motivo
        self.status = status
        super().__init__(motivo)


def _base() -> str:
    if not settings.supabase_url:
        raise SupabaseAuthError("supabase_no_configurado")
    return settings.supabase_url.rstrip("/")


def _headers_secret() -> Dict[str, str]:
    if not settings.supabase_secret_key:
        raise SupabaseAuthError("secret_no_configurado")
    return {"apikey": settings.supabase_secret_key,
            "Authorization": f"Bearer {settings.supabase_secret_key}"}


def _headers_publishable() -> Dict[str, str]:
    if not settings.supabase_publishable_key:
        raise SupabaseAuthError("publishable_no_configurado")
    return {"apikey": settings.supabase_publishable_key}


async def _request(method: str, path: str, headers: Dict[str, str],
                   payload: Optional[Dict[str, Any]] = None,
                   motivo_error: str = "grant_rechazado",
                   ) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_S) as client:
            resp = await client.request(
                method, f"{_base()}{path}",
                json=payload, headers=headers,
            )
    except httpx.HTTPError as exc:
        raise SupabaseAuthError("supabase_no_disponible") from exc
    if resp.status_code >= 400:
        # nunca devolver el body — puede contener datos de sesión;
        # el motivo genérico + status basta al caller
        raise SupabaseAuthError(motivo_error, resp.status_code)
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


async def _post(path: str, headers: Dict[str, str],
                payload: Dict[str, Any]) -> Dict[str, Any]:
    return await _request("POST", path, headers, payload)


# ============================================================================
# GRANTS PÚBLICOS (publishable — lo que supabase-js haría en browser)
# ============================================================================

async def password_grant(email: str, password: str) -> Dict[str, Any]:
    """
    signInWithPassword server-side (D4.2 §8). Devuelve el dict de
    GoTrue (access_token/refresh_token/expires_in/user) — el caller
    lo consume en memoria y nunca lo registra.
    """
    return await _post(
        "/auth/v1/token?grant_type=password",
        _headers_publishable(),
        {"email": email, "password": password},
    )


async def refresh_grant(refresh_token: str) -> Dict[str, Any]:
    """
    Refresh server-side (F7a.1 §4 — todo refresh pasa por el
    backend para que la rotación sea observable).
    """
    return await _post(
        "/auth/v1/token?grant_type=refresh_token",
        _headers_publishable(),
        {"refresh_token": refresh_token},
    )


# ============================================================================
# ADMIN API (sb_secret_* — backend únicamente)
# ============================================================================

async def admin_create_user(
    email_sintetico: str,
    password: str,
    cedula_canonica: str,
) -> Dict[str, Any]:
    """
    Crea el usuario Auth de la saga de registro (D4.2 §7.2 paso 4).

    `email_confirm: true` — el email sintético no tiene buzón; la
    contraseña la conoce el registrante (no hay verificación por
    correo que pueda completarse). El canónico va a user_metadata;
    `origen` a app_metadata para distinguir cuentas del sistema.

    Devuelve el objeto user de GoTrue (contiene `id` =
    auth.users.id). 422 → usuario ya existe (el caller reconcilia
    por email, §22.5).
    """
    return await _request(
        "POST", "/auth/v1/admin/users", _headers_secret(),
        {
            "email": email_sintetico,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"cedula_ruc": cedula_canonica},
            "app_metadata": {"origen": "registro-melantia"},
        },
        motivo_error="alta_rechazada",
    )


async def admin_delete_user(auth_user_id: str) -> None:
    """
    Compensación de la saga (§7.3): borra el auth.users creado
    cuando el paso local del puente falló — nunca deja un
    usuario Auth sin vínculo deliberadamente.
    """
    await _request(
        "DELETE", f"/auth/v1/admin/users/{auth_user_id}",
        _headers_secret(), motivo_error="borrado_rechazado",
    )


async def admin_update_user_password(
    auth_user_id: str, password: str
) -> None:
    """
    Sincroniza la contraseña al reutilizar un auth.users huérfano
    (§22.5): la credencial que el registrante acaba de teclear
    pasa a ser la de la cuenta — sin esto, reutilizar el id dejaría
    el signIn inmediato en fracaso.
    """
    await _request(
        "PUT", f"/auth/v1/admin/users/{auth_user_id}",
        _headers_secret(), {"password": password},
        motivo_error="actualizacion_rechazada",
    )


async def admin_find_user_by_email(email_sintetico: str) -> Optional[Dict[str, Any]]:
    """
    Reconciliación de la saga (§22.5): tras una respuesta ambigua
    del alta (5xx/red/422) consulta si el auth user existe para
    reutilizar su id. GoTrue no tiene get-by-email — se lista y se
    filtra client-side; el email sintético jamás se loguea.
    """
    pagina = 1
    while pagina <= 10:                  # tope defensivo de páginas
        data = await _request(
            "GET",
            f"/auth/v1/admin/users?page={pagina}&per_page=200",
            _headers_secret(), motivo_error="consulta_rechazada",
        )
        usuarios = data.get("users") or data.get("aud") or []
        if not isinstance(usuarios, list):
            usuarios = []
        for u in usuarios:
            if u.get("email") == email_sintetico:
                return u
        if len(usuarios) < 200:
            return None
        pagina += 1
    return None


async def admin_logout(auth_user_id: str, scope: str = "local") -> None:
    """
    Revoca refresh tokens server-side en GoTrue
    (scope: local|others|global — verificado 204/200 en I0.1).
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_S) as client:
            resp = await client.post(
                f"{_base()}/auth/v1/admin/users/{auth_user_id}/logout"
                f"?scope={scope}",
                headers=_headers_secret(),
            )
    except httpx.HTTPError as exc:
        raise SupabaseAuthError("supabase_no_disponible") from exc
    if resp.status_code >= 400:
        raise SupabaseAuthError("logout_rechazado", resp.status_code)
