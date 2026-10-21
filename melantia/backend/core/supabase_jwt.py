# backend/core/supabase_jwt.py
"""
Validador de JWT de Supabase Auth (D4.2 §9 / F7a Fase ②).

Verifica access tokens ES256/Ed25519 contra el JWKS del proyecto:

    GET {SUPABASE_URL}/auth/v1/.well-known/jwks.json

Reglas (cerradas en D4.2 §9 e I0.2):
- El `alg` se resuelve desde el JWK del `kid` — nunca hardcodeado;
  se rechaza `alg=none`, HS256 y cualquier algoritmo fuera de la
  lista permitida (ES256, EdDSA).
- kid desconocido → un refresh forzado de JWKS (rotación de claves)
  con límite anti-DoS; sigue desconocido → rechazo.
- Caché de JWKS en memoria (~10 min): un JWT ya verificable no
  depende de que GoTrue esté en línea; JWKS caído con caché vacío
  → fail-closed (el caller mapea a 503).
- Claims obligatorios: iss, aud=authenticated, exp, sub,
  session_id (F7a.1 §3 — ancla sesión↔dispositivo).
- Fail-closed en todo: ninguna rama tolerante a ambigüedad.

Este módulo jamás registra ni devuelve el token recibido.
"""
import asyncio
import base64
import json
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, ed25519
from cryptography.hazmat.primitives.asymmetric.utils import (
    encode_dss_signature,
)

ALGORITMOS_PERMITIDOS = {"ES256", "EdDSA"}
JWKS_CACHE_TTL_S = 600            # ~10 min (D4.2 §9)
JWKS_MAX_REFRESHES_POR_MIN = 3    # anti-DoS ante kid desconocido
_TIMEOUT_S = 10.0


class SupabaseTokenError(Exception):
    """
    Fallo de validación de token Supabase.

    `motivo` es la única información que sale del validador —
    el caller la traduce a 401/503 sin exponer detalles (anti-oráculo
    D4.2 §9). El token jamás aparece en el mensaje.
    """

    def __init__(self, motivo: str):
        self.motivo = motivo
        super().__init__(motivo)


def _b64url_decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _jwk_to_public_key(jwk: Dict[str, Any]):
    """Construye la clave pública desde el JWK (EC P-256 o Ed25519)."""
    kty = jwk.get("kty")
    if kty == "EC" and jwk.get("crv") == "P-256":
        x = int.from_bytes(_b64url_decode(jwk["x"]), "big")
        y = int.from_bytes(_b64url_decode(jwk["y"]), "big")
        return ec.EllipticCurvePublicNumbers(x, y, ec.SECP256R1()).public_key()
    if kty == "OKP" and jwk.get("crv") == "Ed25519":
        return ed25519.Ed25519PublicKey.from_public_bytes(
            _b64url_decode(jwk["x"])
        )
    raise SupabaseTokenError("jwk_no_soportado")


@dataclass
class SupabaseJWTVerifier:
    """
    Verificador con caché de JWKS. Instancia única por proceso
    (ver get_supabase_verifier); inyectable en tests.
    """

    issuer: str
    jwks_url: str
    audience: str = "authenticated"
    _jwks: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    _jwks_ts: float = 0.0
    _refresh_ts: list = field(default_factory=list)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def _download_jwks(self) -> Dict[str, Dict[str, Any]]:
        """Descarga el JWKS (único punto de red). Aislado para tests."""
        async with httpx.AsyncClient(timeout=_TIMEOUT_S) as client:
            resp = await client.get(self.jwks_url)
        resp.raise_for_status()
        keys = resp.json().get("keys", [])
        return {
            k["kid"]: k for k in keys if isinstance(k, dict) and "kid" in k
        }

    async def _fetch_jwks(self) -> None:
        async with self._lock:
            # anti-DoS: máx N refreshes por minuto, aunque lleguen
            # kids desconocidos en ráfaga
            ahora = time.monotonic()
            self._refresh_ts = [
                t for t in self._refresh_ts if ahora - t < 60
            ]
            if len(self._refresh_ts) >= JWKS_MAX_REFRESHES_POR_MIN:
                return  # rate-limited: se sirve del caché existente
            self._refresh_ts.append(ahora)

            self._jwks = await self._download_jwks()
            self._jwks_ts = ahora

    async def _resolver_jwk(self, kid: str) -> Dict[str, Any]:
        ahora = time.monotonic()
        if not self._jwks or ahora - self._jwks_ts > JWKS_CACHE_TTL_S:
            try:
                await self._fetch_jwks()
            except Exception as exc:
                raise SupabaseTokenError("jwks_no_disponible") from exc
        jwk = self._jwks.get(kid)
        if jwk is not None:
            return jwk
        # kid desconocido → rotación de claves posible: refresh forzado
        try:
            await self._fetch_jwks()
        except Exception as exc:
            raise SupabaseTokenError("jwks_no_disponible") from exc
        jwk = self._jwks.get(kid)
        if jwk is None:
            raise SupabaseTokenError("kid_desconocido")
        return jwk

    @staticmethod
    def _verificar_firma(
        jwk: Dict[str, Any], signing_input: bytes, signature: bytes
    ) -> None:
        alg = jwk.get("alg")
        if alg not in ALGORITMOS_PERMITIDOS:
            raise SupabaseTokenError("algoritmo_no_permitido")
        pubkey = _jwk_to_public_key(jwk)
        try:
            if alg == "ES256":
                if len(signature) != 64:
                    raise InvalidSignature
                # JWT ES256 = R||S (64 B) → DER ASN.1 para cryptography
                der = encode_dss_signature(
                    int.from_bytes(signature[:32], "big"),
                    int.from_bytes(signature[32:], "big"),
                )
                pubkey.verify(der, signing_input, ec.ECDSA(hashes.SHA256()))
            else:  # EdDSA — firma cruda de 64 B
                pubkey.verify(signature, signing_input)
        except InvalidSignature as exc:
            raise SupabaseTokenError("firma_invalida") from exc

    async def verificar(self, token: str) -> Dict[str, Any]:
        """
        Verifica un access token de Supabase. Devuelve los claims si es
        válido; lanza SupabaseTokenError en cualquier otro caso.

        Orden fail-closed: forma → alg del header vs JWKS → kid →
        firma → iss → aud → exp/nbf → claims obligatorios.
        """
        try:
            header_b64, payload_b64, firma_b64 = token.split(".")
            header = json.loads(_b64url_decode(header_b64))
            claims = json.loads(_b64url_decode(payload_b64))
            signature = _b64url_decode(firma_b64)
        except Exception as exc:
            raise SupabaseTokenError("malformado") from exc

        kid = header.get("kid")
        if not isinstance(kid, str) or not kid:
            raise SupabaseTokenError("kid_ausente")
        if header.get("alg") not in ALGORITMOS_PERMITIDOS:
            raise SupabaseTokenError("algoritmo_no_permitido")

        jwk = await self._resolver_jwk(kid)
        # el alg declarado por el JWK manda sobre el del header
        if header["alg"] != jwk.get("alg"):
            raise SupabaseTokenError("algoritmo_no_permitido")
        self._verificar_firma(
            jwk, f"{header_b64}.{payload_b64}".encode(), signature
        )

        if claims.get("iss") != self.issuer:
            raise SupabaseTokenError("issuer_incorrecto")
        aud = claims.get("aud")
        if aud != self.audience and not (
            isinstance(aud, list) and self.audience in aud
        ):
            raise SupabaseTokenError("audience_incorrecta")

        ahora = time.time()
        exp = claims.get("exp")
        if not isinstance(exp, (int, float)) or exp <= ahora:
            raise SupabaseTokenError("expirado")
        nbf = claims.get("nbf")
        if nbf is not None and (
            not isinstance(nbf, (int, float)) or nbf > ahora
        ):
            raise SupabaseTokenError("no_antes_de")

        if not isinstance(claims.get("sub"), str) or not claims["sub"]:
            raise SupabaseTokenError("sub_ausente")
        if not isinstance(claims.get("session_id"), str) or not claims[
            "session_id"
        ]:
            raise SupabaseTokenError("session_id_ausente")

        return claims


_verifier: Optional[SupabaseJWTVerifier] = None


def get_supabase_verifier() -> SupabaseJWTVerifier:
    """
    Singleton por proceso, construido desde settings.

    Requiere `supabase_url` configurada — el issuer es literal:
    `{SUPABASE_URL}/auth/v1` (verificado en I0.1/I0.2).
    """
    global _verifier
    if _verifier is None:
        from core.config import settings

        if not settings.supabase_url:
            raise SupabaseTokenError("supabase_no_configurado")
        base = settings.supabase_url.rstrip("/")
        _verifier = SupabaseJWTVerifier(
            issuer=f"{base}/auth/v1",
            jwks_url=f"{base}/auth/v1/.well-known/jwks.json",
        )
    return _verifier
