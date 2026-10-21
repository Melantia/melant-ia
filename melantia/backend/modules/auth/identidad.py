# backend/modules/auth/identidad.py
"""
Identidad fiscal y email sintético — D4.2 §6 + errata §22.3.

Pipeline obligatorio ANTES de derivar (la entrada nunca es el
string crudo del request):

    entrada (cedula_ruc)
      1. NORMALIZAR: trim, sin espacios/guiones/puntos, mayúsculas
      2. TIPO: 10 dígitos (cédula) vs 13 dígitos (RUC)
      3. ESTRUCTURA: provincia (2 primeros, 01–24) + tercer dígito
         · 10 dig., 3er 0–5                → CÉDULA natural
         · 13 dig., 3er 0–5 + sufijo "001" → RUC natural → COLAPSA
         · 13 dig., 3er 9                  → RUC privada  → JURÍDICA
         · 13 dig., 3er 6                  → RUC pública  → JURÍDICA
      4. DÍGITO VERIFICADOR: módulo-10 (cédula/RUC-natural) /
         módulo-11 (privado / público) — referencia normativa SRI
      5. IDENTIDAD CANÓNICA: "NAT:<cedula10>" | "JUR:<ruc13>"
      6. DERIVAR: email_sintetico =
         hex(HMAC_SHA256(PEPPER_IDENTIDAD, canonico))[0:24]
         + "@" + DOMINIO_SINTETICO

Invariantes:
- RUC natural colapsa a la cédula: UNA identidad por humano (§22.1).
- El email sintético es interno: determinista, no reversible, jamás
  sale del backend ni se persiste (se recalcula en cada login).
- PEPPER_IDENTIDAD vive solo en .env; si falta, la derivación falla
  cerrada (error de configuración, nunca degradación a hash sin
  clave).
"""
import hashlib
import hmac
from typing import Optional

from core.config import settings

# Dominio técnico reservado para identidades sintéticas (§6):
# nunca un dominio real de usuarios ni supabase.co.
DOMINIO_SINTETICO = "id.melantia.app"

# HMAC truncado a 24 hex = 96 bits (colisión despreciable, §6).
HMAC_PREFIX_LEN = 24


class IdentidadError(Exception):
    """Identidad fiscal inválida. `motivo` mapea a HTTP afuera."""

    def __init__(self, motivo: str):
        self.motivo = motivo
        super().__init__(motivo)


# ============================================================================
# DÍGITOS VERIFICADORES (algoritmos SRI Ecuador)
# ============================================================================

def _modulo10(digitos: str) -> int:
    """
    Verificador de cédula y RUC de persona natural.

    Coeficientes 2-1 alternados sobre los primeros 9 dígitos;
    producto ≥10 → resta 9; dv = (10 − suma % 10) % 10.
    """
    coef = (2, 1, 2, 1, 2, 1, 2, 1, 2)
    suma = 0
    for d, c in zip(digitos[:9], coef):
        prod = int(d) * c
        suma += prod - 9 if prod >= 10 else prod
    return (10 - suma % 10) % 10


def _modulo11_privado(digitos: str) -> int:
    """
    Verificador de RUC de sociedad privada / extranjero
    (3er dígito 9). Coeficientes 4,3,2,7,6,5,4,3,2 sobre los
    primeros 9 dígitos; el verificador es el dígito 10.
    Residuo 0 → dv 0; residuo 1 → dv 10 → RUC inválido (−1).
    """
    coef = (4, 3, 2, 7, 6, 5, 4, 3, 2)
    suma = sum(int(d) * c for d, c in zip(digitos[:9], coef))
    residuo = suma % 11
    dv = 11 - residuo
    if dv == 11:
        return 0
    if dv == 10:
        return -1                        # combinación inválida
    return dv


def _modulo11_publico(digitos: str) -> int:
    """
    Verificador de RUC de entidad pública (3er dígito 6).
    Coeficientes 3,2,7,6,5,4,3,2 sobre los primeros 8 dígitos;
    el verificador es el dígito 9. Residuo 0 → dv 0;
    residuo 1 → dv 10 → RUC inválido (−1).
    """
    coef = (3, 2, 7, 6, 5, 4, 3, 2)
    suma = sum(int(d) * c for d, c in zip(digitos[:8], coef))
    residuo = suma % 11
    dv = 11 - residuo
    if dv == 11:
        return 0
    if dv == 10:
        return -1
    return dv


# ============================================================================
# NORMALIZACIÓN FISCAL → IDENTIDAD CANÓNICA (§22.3 pasos 1–5)
# ============================================================================

def normalizar_identidad_fiscal(raw: str) -> str:
    """
    Devuelve la identidad canónica del sujeto:

        "NAT:dddddddddd"    persona natural (cédula o RUC cédula+001)
        "JUR:ddddddddddddd" persona jurídica (RUC privada/pública)

    Lanza IdentidadError en cualquier entrada que no pase el
    pipeline — fail-closed: nunca se deriva un sintético de una
    identidad mal validada.
    """
    limpio = "".join(
        ch for ch in (raw or "").strip().upper()
        if ch not in (" ", "-", ".", "_")
    )
    if not limpio or not limpio.isdigit():
        raise IdentidadError("formato_invalido")

    provincia = int(limpio[:2]) if len(limpio) >= 2 else 0
    if not 1 <= provincia <= 24:
        raise IdentidadError("provincia_invalida")
    tercero = int(limpio[2]) if len(limpio) >= 3 else -1

    if len(limpio) == 10:
        if tercero > 5:
            raise IdentidadError("tercer_digito_invalido")
        if int(limpio[9]) != _modulo10(limpio):
            raise IdentidadError("verificador_invalido")
        return f"NAT:{limpio}"

    if len(limpio) == 13:
        if limpio[10:] == "000":
            raise IdentidadError("establecimiento_invalido")
        if tercero <= 5:
            # RUC persona natural: solo el sufijo "001" colapsa a la
            # cédula (§22.3). Otros establecimientos no están
            # definidos por el diseño → rechazo conservador.
            if limpio[10:] != "001":
                raise IdentidadError("ruc_natural_sufijo_no_001")
            if int(limpio[9]) != _modulo10(limpio):
                raise IdentidadError("verificador_invalido")
            return f"NAT:{limpio[:10]}"
        if tercero == 9:
            if int(limpio[9]) != _modulo11_privado(limpio):
                raise IdentidadError("verificador_invalido")
            return f"JUR:{limpio}"
        if tercero == 6:
            if int(limpio[8]) != _modulo11_publico(limpio):
                raise IdentidadError("verificador_invalido")
            return f"JUR:{limpio}"
        raise IdentidadError("tercer_digito_invalido")

    raise IdentidadError("longitud_invalida")


# ============================================================================
# EMAIL SINTÉTICO — HMAC determinista, solo servidor (§6)
# ============================================================================

def derivar_email_sintetico(canonical: str) -> str:
    """
    email_sintetico = hex(HMAC_SHA256(PEPPER, canonico))[0:24]
                    + "@" + DOMINIO_SINTETICO

    Determinista (se recalcula por login, no se persiste), sin
    buzón, jamás devuelto al cliente ni almacenado en auditoría.
    """
    pepper: Optional[str] = settings.pepper_identidad
    if not pepper:
        raise IdentidadError("pepper_no_configurado")
    digest = hmac.new(
        pepper.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{digest[:HMAC_PREFIX_LEN]}@{DOMINIO_SINTETICO}"


def huella_identidad(canonical: str) -> str:
    """
    Identificador seguro para auditoría: prefijo del HMAC (12 hex),
    suficiente para correlacionar eventos de la misma identidad sin
    registrar la cédula ni el email sintético completo.
    """
    pepper: Optional[str] = settings.pepper_identidad
    if not pepper:
        return "n/a"
    return hmac.new(
        pepper.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:12]
