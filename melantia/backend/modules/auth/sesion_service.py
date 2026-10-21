# backend/modules/auth/sesion_service.py
"""
Servicio de sesión MELANTIA (F7a Fase ② — decisión doc 21).

Orquesta la frontera completa:

    JWT Supabase válido
      → claims.sub (auth.users.id)
      → puente (usuarios_auth_puente, estado='activo')
      → usuarios.id
      → sesión MELANTIA (sesiones, estado='activa')
      → dispositivo

Invariantes (no negociables):
- JWT válido = necesario, nunca suficiente: sin puente activo o sin
  sesión activa la request se rechaza aunque la firma sea válida.
- familia := auth_session_id (F7a.1 §3) — ya resuelto por
  sesiones.crear_sesion.
- Supabase NO da family-kill (CASO C, I0.2-B): la detección de
  replay es local — colisión de refresh en <ROTATION_MIN_GAP.
- Toda señal de seguridad se registra en audit_eventos; registrar
  un evento nunca bloquea por sí solo (la decisión es del servicio).
- Ningún token (AT/RT) se persiste ni se loguea; el RT transita en
  memoria — su custodia cifrada espera la decisión de gestión de
  claves (pendiente, reportado al usuario).
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from shared.repositories import audit, auth_puente, sesiones

# F7a.1 §4/§8: dos refresh del mismo session_id en <5 s = colisión
# (el patrón legítimo es ~1 refresh/hora).
ROTATION_MIN_GAP_S = 5


class SesionError(Exception):
    """Fallo del flujo de sesión. `motivo` se mapea a HTTP afuera."""

    def __init__(self, motivo: str):
        self.motivo = motivo
        super().__init__(motivo)


# ============================================================================
# RESOLUCIÓN JWT → usuarios.id (camino de cada request protegida)
# ============================================================================

async def _resolver_puente(conn, sub) -> Dict[str, Any]:
    """
    sub (auth.users.id) → fila del puente con estado='activo'.

    Es el paso compartido entre el camino de request (resolver_
    usuario_desde_claims, que además exige sesión activa) y el
    alta de sesión post-login (crear_sesion_post_login, donde la
    sesión todavía no existe — exigirla ahí haría imposible el
    primer login).

    motivos: sub_invalido · puente_inexistente · puente_suspendido
    """
    try:
        auth_user_id = uuid.UUID(sub)
    except (ValueError, AttributeError, TypeError):
        raise SesionError("sub_invalido")

    puente = await auth_puente.resolver_usuario_id(conn, auth_user_id)
    if puente is None:
        raise SesionError("puente_inexistente")
    if puente["estado"] != "activo":
        raise SesionError("puente_suspendido")
    return puente


async def resolver_usuario_desde_claims(
    conn, claims: Dict[str, Any]
) -> str:
    """
    Traduce claims de un JWT Supabase YA VERIFICADO a usuarios.id.

    Cadena fail-closed:
      sub → puente activo → sesión activa → usuario_id

    motivos de SesionError:
      puente_inexistente        → 401 (sin auto-provisión, ADR §12.2)
      puente_suspendido         → 403
      sesion_inexistente        → 401 (sesión no creada por MELANTIA)
      sesion_no_activa          → 401 (revocada/sospechosa/expirada)
    """
    puente = await _resolver_puente(conn, claims.get("sub"))

    # sesión MELANTIA: el claim session_id debe existir y estar activa
    sesion = await sesiones.obtener_sesion_por_auth_session_id(
        conn, claims["session_id"]
    )
    if sesion is None:
        raise SesionError("sesion_inexistente")
    if sesion["estado"] != "activa":
        raise SesionError("sesion_no_activa")

    return str(puente["usuario_id"])


# ============================================================================
# ALTA DE SESIÓN TRAS LOGIN (el login Supabase ocurre en supabase_client)
# ============================================================================

async def crear_sesion_post_login(
    conn,
    claims: Dict[str, Any],
    dispositivo_id: Optional[UUID] = None,
    dispositivo_nombre: Optional[str] = None,
    fingerprint_hash: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Crea la sesión MELANTIA tras un login Supabase exitoso.

    - dispositivo_id conocido (del propio usuario y activo) →
      reutiliza; None/ajeno/revocado → registra como DISPOSITIVO
      NUEVO (evento auditado; nunca bloquea — §6/F7a.1). El id
      jamás se confía tal cual: se verifica propiedad para que un
      cliente no pueda anclar su sesión al dispositivo de otro.
    - expires_at = created_at + 30 d fijos (SQL-side, §8 — sin
      deslizante).
    - Emite sesion.creada (+ dispositivo.nuevo si aplica) en
      audit_eventos, dentro de la misma transacción.
    - Resuelve solo hasta el PUENTE (no exige sesión activa: es
      precisamente esta función la que la crea en el primer login).
    """
    puente = await _resolver_puente(conn, claims.get("sub"))
    usuario_id = uuid.UUID(puente["usuario_id"])
    auth_session_id = uuid.UUID(claims["session_id"])

    # sesión ya registrada para este session_id → idempotente
    existente = await sesiones.obtener_sesion_por_auth_session_id(
        conn, auth_session_id
    )
    if existente is not None:
        return existente

    if dispositivo_id is not None:
        candidato = await sesiones.obtener_dispositivo(
            conn, dispositivo_id
        )
        if (
            candidato is None
            or str(candidato["usuario_id"]) != str(usuario_id)
            or candidato["estado"] != "activo"
        ):
            dispositivo_id = None     # → alta como dispositivo nuevo

    if dispositivo_id is None:
        disp = await sesiones.registrar_dispositivo(
            conn,
            usuario_id=usuario_id,
            nombre=dispositivo_nombre,
            fingerprint_hash=fingerprint_hash,
        )
        dispositivo_id = uuid.UUID(disp["id"]) if isinstance(
            disp["id"], str
        ) else disp["id"]
        await audit.auditar_sesion(
            conn,
            accion=audit.AccionSesion.DISPOSITIVO_NUEVO,
            sesion_id=auth_session_id,
            actor_id=usuario_id,
            dispositivo_id=dispositivo_id,
            detalle={"nombre": dispositivo_nombre},
        )

    sesion = await sesiones.crear_sesion(
        conn,
        usuario_id=usuario_id,
        dispositivo_id=dispositivo_id,
        auth_proveedor="supabase",
        auth_session_id=auth_session_id,
    )
    sesion_id = sesion["id"] if not isinstance(
        sesion["id"], str
    ) else uuid.UUID(sesion["id"])
    await audit.auditar_sesion(
        conn,
        accion=audit.AccionSesion.SESION_CREADA,
        sesion_id=sesion_id,
        actor_id=usuario_id,
        dispositivo_id=dispositivo_id,
        detalle={"auth_proveedor": "supabase"},
    )
    await auth_puente.registrar_acceso(conn, uuid.UUID(claims["sub"]))
    return sesion


# ============================================================================
# REFRESH — detección local de replay (CASO C: Supabase no protege)
# ============================================================================

async def registrar_refresh(
    conn, auth_session_id: UUID
) -> Dict[str, Any]:
    """
    Registra una rotación de refresh sobre la sesión.

    La custodia del RT en refresh_token_enc queda PENDIENTE de la
    decisión de gestión de claves — el RT transita por el backend
    hacia Supabase sin persistirse (jamás en texto plano).

    Colisión (F7a.1 §4): si el último refresh registrado fue hace
    menos de ROTATION_MIN_GAP_S segundos hay dos actores sobre la
    misma sesión → marca 'sospechosa' + evento posible_replay y
    rechaza. El re-auth posterior limpia la marca.
    """
    sesion = await sesiones.obtener_sesion_por_auth_session_id(
        conn, auth_session_id
    )
    if sesion is None:
        raise SesionError("sesion_inexistente")
    if sesion["estado"] == "revocada" or sesion["estado"] == "expirada":
        raise SesionError("sesion_no_activa")

    ultimo = sesion.get("ultimo_refresh_at")
    if ultimo is not None:
        if ultimo.tzinfo is None:
            ultimo = ultimo.replace(tzinfo=timezone.utc)
        gap = (datetime.now(timezone.utc) - ultimo).total_seconds()
        if gap < ROTATION_MIN_GAP_S:
            marcada = await sesiones.marcar_sospechosa(
                conn, sesion["id"], motivo="colision_refresh"
            )
            await audit.auditar_sesion(
                conn,
                accion=audit.AccionSesion.POSIBLE_REPLAY,
                sesion_id=sesion["id"],
                actor_id=None,
                dispositivo_id=sesion["dispositivo_id"],
                detalle={"gap_segundos": round(gap, 3)},
            )
            if marcada is not None or sesion["estado"] == "sospechosa":
                raise SesionError("sesion_sospechosa")

    rotacion = await sesiones.registrar_rotacion(conn, sesion["id"])
    if rotacion is None:
        raise SesionError("sesion_no_activa")
    return rotacion


# ============================================================================
# REVOCACIÓN (F7a.1 §5 — local inmediata; el efecto en Supabase es
# responsabilidad de la capa de integración, no de este servicio)
# ============================================================================

async def revocar_sesion_melantia(
    conn,
    sesion_id: UUID,
    revocado_por: Optional[UUID] = None,
    motivo: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Revoca una sesión individual con historial + auditoría.

    Inmediata en la capa de autorización: el próximo request con
    esa sesión cae en resolver_usuario_desde_claims aunque el AT
    siga criptográficamente válido (≤3600 s residual).
    """
    fila = await sesiones.revocar_sesion(
        conn, sesion_id, revocado_por=revocado_por, motivo=motivo
    )
    if fila is None:
        raise SesionError("sesion_no_activa")
    await audit.auditar_sesion(
        conn,
        accion=audit.AccionSesion.SESION_REVOCADA,
        sesion_id=sesion_id,
        actor_id=revocado_por,
        detalle={"motivo": motivo} if motivo else None,
    )
    return fila
