# backend/tests/test_supabase_jwt.py
"""Pruebas del validador JWT ES256/JWKS de Supabase (F7a Fase ②,
D4.2 §9).

Todo se genera en memoria: par de claves P-256, tokens firmados
con jose y JWKS simulado inyectado en _download_jwks — ninguna
llamada real a Supabase, ningún secreto real ni persistido.
"""
import asyncio
import base64
import json
import time
import uuid

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from jose import jwt as jose_jwt

from core.supabase_jwt import (
    SupabaseJWTVerifier,
    SupabaseTokenError,
    JWKS_MAX_REFRESHES_POR_MIN,
)

ISSUER = "https://lizqreiyysrqgkzyddff.supabase.co/auth/v1"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"
KID = "c55ca967-0a08-43b5-a0c8-7782573d62ba"   # kid real visto en I0

SUB = str(uuid.uuid4())
SESSION_ID = str(uuid.uuid4())


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _generar_par_ec():
    priv = ec.generate_private_key(ec.SECP256R1())
    pem = priv.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    nums = priv.public_key().public_numbers()
    jwk = {
        "kty": "EC", "crv": "P-256", "alg": "ES256", "use": "sig",
        "kid": KID,
        "x": _b64url(nums.x.to_bytes(32, "big")),
        "y": _b64url(nums.y.to_bytes(32, "big")),
    }
    return pem, jwk


PEM, JWK = _generar_par_ec()
PEM_OTRA, JWK_OTRA = _generar_par_ec()
JWK_OTRA = {**JWK_OTRA, "kid": "otro-kid-rotado"}


def _verifier(keys=None):
    v = SupabaseJWTVerifier(issuer=ISSUER, jwks_url=JWKS_URL)
    fuente = keys if keys is not None else [JWK]

    async def fake_download():
        return {k["kid"]: k for k in fuente}

    v._download_jwks = fake_download      # sin red
    return v


def _firmar(claims=None, pem=PEM, kid=KID, alg="ES256", header_extra=None):
    ahora = int(time.time())
    base = {
        "iss": ISSUER, "aud": "authenticated", "sub": SUB,
        "session_id": SESSION_ID, "role": "authenticated",
        "iat": ahora, "exp": ahora + 3600,
    }
    base.update(claims or {})
    headers = {"kid": kid, "typ": "JWT"}
    headers.update(header_extra or {})
    return jose_jwt.encode(base, pem, algorithm=alg, headers=headers)


def run(coro):
    return asyncio.run(coro)


def _motivo(coro):
    with pytest.raises(SupabaseTokenError) as e:
        run(coro)
    return e.value.motivo


# ============================================================================
# CAMINO FELIZ
# ============================================================================

def test_jwt_es256_valido_devuelve_claims():
    token = _firmar()
    claims = run(_verifier().verificar(token))
    assert claims["sub"] == SUB
    assert claims["session_id"] == SESSION_ID
    assert claims["iss"] == ISSUER


def test_jwks_cacheado_verifica_offline_sin_descarga():
    v = _verifier()
    run(v.verificar(_firmar()))                    # pobla caché

    async def explotar_si_se_llama():
        raise AssertionError("no debe descargar JWKS con caché válida")

    v._download_jwks = explotar_si_se_llama
    run(v.verificar(_firmar()))                    # pasa sin red


# ============================================================================
# FIRMA Y CLAVES
# ============================================================================

def test_firma_invalida_rechazada():
    token = _firmar()
    h, p, s = token.split(".")
    firma_corrupta = _b64url(b"\x00" * 64)
    assert _motivo(
        _verifier().verificar(f"{h}.{p}.{firma_corrupta}")
    ) == "firma_invalida"


def test_firma_con_otra_clave_rechazada():
    token = _firmar(pem=PEM_OTRA)                  # firma válida pero
    assert _motivo(                                # de otra clave
        _verifier().verificar(token)
    ) == "firma_invalida"


def test_kid_desconocido_dispara_refresh_y_rechaza():
    token = _firmar(kid="kid-inexistente")
    v = _verifier()
    assert _motivo(v.verificar(token)) == "kid_desconocido"
    assert len(v._refresh_ts) >= 1                 # refresh forzado


def test_kid_desconocido_resuelto_tras_rotacion_jwks():
    # la clave llega en el segundo JWKS (rotación) → acepta
    token = _firmar(pem=PEM_OTRA, kid=JWK_OTRA["kid"])
    v = _verifier(keys=[])                         # caché vacía inicial

    async def segunda_descarga():
        return {JWK_OTRA["kid"]: JWK_OTRA}         # ya rotada

    v._download_jwks = segunda_descarga
    claims = run(v.verificar(token))
    assert claims["sub"] == SUB


def test_refresh_jwks_rate_limited():
    token = _firmar(kid="kid-inexistente")
    v = _verifier(keys=[])
    for _ in range(JWKS_MAX_REFRESHES_POR_MIN + 2):
        _motivo(v.verificar(token))
    assert len(v._refresh_ts) == JWKS_MAX_REFRESHES_POR_MIN


def test_jwks_caido_con_cache_vacia_fail_closed():
    v = _verifier()

    async def caida():
        raise RuntimeError("jwks caído")

    v._download_jwks = caida
    assert _motivo(v.verificar(_firmar())) == "jwks_no_disponible"


# ============================================================================
# CLAIMS
# ============================================================================

def test_issuer_incorrecto():
    token = _firmar({"iss": "https://otro-proyecto.supabase.co/auth/v1"})
    assert _motivo(_verifier().verificar(token)) == "issuer_incorrecto"


def test_audience_incorrecta():
    token = _firmar({"aud": "service_role"})
    assert _motivo(
        _verifier().verificar(token)
    ) == "audience_incorrecta"


def test_audience_lista_con_authenticated_acepta():
    token = _firmar({"aud": ["authenticated"]})
    claims = run(_verifier().verificar(token))
    assert claims["aud"] == ["authenticated"]


def test_token_expirado():
    token = _firmar({"exp": int(time.time()) - 10,
                     "iat": int(time.time()) - 3700})
    assert _motivo(_verifier().verificar(token)) == "expirado"


def test_nbf_futuro_rechazado():
    token = _firmar({"nbf": int(time.time()) + 3600})
    assert _motivo(_verifier().verificar(token)) == "no_antes_de"


def test_sub_ausente():
    token = _firmar({"sub": None})
    # claims.update con None deja sub=None → sub_ausente
    assert _motivo(_verifier().verificar(token)) == "sub_ausente"


def test_session_id_ausente():
    token = _firmar({"session_id": None})
    assert _motivo(
        _verifier().verificar(token)
    ) == "session_id_ausente"


# ============================================================================
# ALGORITMO — lista blanca estricta (FASE 3.4 / D4.2 §9)
# ============================================================================

def test_alg_none_rechazado():
    token = _firmar(header_extra={"alg": "none"})
    assert _motivo(
        _verifier().verificar(token)
    ) == "algoritmo_no_permitido"


def test_alg_hs256_rechazado():
    token = _firmar(header_extra={"alg": "HS256"})
    assert _motivo(
        _verifier().verificar(token)
    ) == "algoritmo_no_permitido"


def test_alg_header_distinto_del_jwk_rechazado():
    token = _firmar(header_extra={"alg": "EdDSA"})   # JWK dice ES256
    assert _motivo(
        _verifier().verificar(token)
    ) == "algoritmo_no_permitido"


def test_token_malformado():
    assert _motivo(_verifier().verificar("abc.def")) == "malformado"
    assert _motivo(
        _verifier().verificar("no-es-jwt")
    ) == "malformado"
