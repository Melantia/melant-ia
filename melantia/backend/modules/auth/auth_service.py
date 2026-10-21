# backend/modules/auth/auth_service.py
"""
Flujos de autenticación F7a Fase ③: login, registro (saga), refresh.

Frontera completa por flujo:

  LOGIN (D4.2 §8)
    cédula/RUC → normalización fiscal (§22.3) → canónico
      → HMAC-SHA256(PEPPER_IDENTIDAD) → email sintético
      → GoTrue password grant (sb_publishable_*)
      → verificar JWT (ES256/JWKS) → claims
      → puente → sesión MELANTIA → respuesta (sin sintético)

  REGISTRO (saga §7.2 + estados §22.5)
    dedup 3 estados → TX1 usuarios → Admin API create (sb_secret_*)
      → reconciliación por email si respuesta ambigua
      → TX2 puente → signIn inmediato → sesión
    compensaciones: fallo remoto → DELETE usuarios;
                    fallo puente → admin DELETE auth.users.

  REFRESH (F7a.1 §4 — todo refresh pasa por el backend)
    refresh_token → GoTrue refresh grant → nuevo par
      → verificar JWT → registrar rotación (colisión <5 s
        → 'sospechosa' + posible_replay — CASO C: Supabase no
        da family-kill, la defensa es local)

Invariantes:
- El RT transita en memoria hacia el cliente; NUNCA se persiste
  (refresh_token_enc sigue NULL — su custodia cifrada con
  MELANTIA_SESSION_VAULT_KEY es decisión pendiente).
- familia_id = auth_session_id lo fija sesiones.crear_sesion
  (F7a.1 §3); este módulo no lo toca.
- Nada aquí loguea ni devuelve: email sintético, auth.users.id,
  tokens, passwords ni secretos.
- Los eventos de rechazo se commitean ANTES de levantar el error:
  si el evento quedara dentro de la transacción que aborta, la
  evidencia de seguridad desaparecería con el rollback.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row

from core.supabase_jwt import SupabaseTokenError, get_supabase_verifier
from modules.auth import sesion_service, supabase_client
from modules.auth.identidad import (
    IdentidadError,
    derivar_email_sintetico,
    huella_identidad,
    normalizar_identidad_fiscal,
)
from modules.auth.supabase_client import SupabaseAuthError
from shared.repositories import audit, auth_puente, sesiones

# §22.5: un usuario huérfano recién creado por ESTA saga (fallo en el
# paso remoto) puede continuar el registro en un retry — la ventana
# acota el "intento propio reciente". Un huérfano más viejo es un
# dato histórico → reclamo asistido (§22.4-C), nunca auto-claim.
RECLAMO_AUTO_MIN = 10


# ============================================================================
# HELPERS LOCALES (SQL directo — mismas convenciones que controllers.py)
# ============================================================================

async def _buscar_usuario_por_canonico(
    conn, canonico: str
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, nombre, created_at
            FROM usuarios
            WHERE cedula_ruc = %s
            """,
            (canonico,),
        )
        return await cursor.fetchone()


async def _obtener_usuario_basico(
    conn, usuario_id: UUID
) -> Optional[Dict[str, Any]]:
    """nombre para la respuesta — §9: puente apuntando a usuario
    inexistente es integridad rota (500), no 401."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT id, nombre FROM usuarios WHERE id = %s",
            (str(usuario_id),),
        )
        return await cursor.fetchone()


async def _insertar_usuario(conn, data, canonico: str) -> Dict[str, Any]:
    """TX1 de la saga. `cedula_ruc` almacena el CANÓNICO (§22.3);
    sin password_hash — la credencial vive solo en Supabase Auth."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO usuarios (
                nombre, cedula_ruc, sector_comunidad, contacto,
                provincia_id, canton_id, parroquia_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, nombre
            """,
            (
                data.nombre,
                canonico,
                data.sector_comunidad,
                data.contacto,
                data.provincia_id,
                data.canton_id,
                data.parroquia_id,
            ),
        )
        return await cursor.fetchone()


async def _eliminar_usuario_compensacion(conn, usuario_id: UUID) -> None:
    """Compensación §7.3 paso 4: borrar el usuarios que quedó
    huérfano cuando falló el alta remota."""
    async with conn.cursor() as cursor:
        await cursor.execute(
            "DELETE FROM usuarios WHERE id = %s", (str(usuario_id),)
        )


async def _crear_o_reconciliar_auth_user(
    email: str, password: str, canonico: str
) -> str:
    """
    Paso remoto de la saga con reconciliación (§22.5):

    - 200 → auth_user_id nuevo.
    - error GoTrue (4xx/5xx/red) → la respuesta es ambigua: el
      usuario pudo haberse creado. Se reconcilia por email
      sintético; si existe, se reutiliza su id y se sincroniza la
      contraseña con la de este request (la cuenta queda con la
      credencial que el registrante acaba de teclear).
    """
    try:
        user = await supabase_client.admin_create_user(
            email, password, canonico
        )
        return user["id"]
    except SupabaseAuthError as original:
        try:
            existente = await supabase_client.admin_find_user_by_email(
                email
            )
        except SupabaseAuthError:
            existente = None
        if not existente:
            raise original
        await supabase_client.admin_update_user_password(
            existente["id"], password
        )
        return existente["id"]


# ============================================================================
# HELPERS LOCALES
# ============================================================================

def _uuid_o_none(valor: Optional[str]) -> Optional[UUID]:
    """dispositivo_id llega del cliente como str; un valor malformado
    no aborta el flujo — se registra un dispositivo nuevo."""
    if not valor:
        return None
    try:
        return uuid.UUID(valor)
    except (ValueError, AttributeError, TypeError):
        return None


# ============================================================================
# LOGIN — POST /api/auth/login
# ============================================================================

async def login(
    conn,
    cedula_ruc: str,
    password: str,
    dispositivo_id: Optional[str] = None,
    dispositivo_nombre: Optional[str] = None,
) -> Dict[str, Any]:
    canonico = normalizar_identidad_fiscal(cedula_ruc)   # 400
    email = derivar_email_sintetico(canonico)            # 503 si falta pepper
    huella = huella_identidad(canonico)

    try:
        grant = await supabase_client.password_grant(email, password)
    except SupabaseAuthError as e:
        # mismo 401 para inexistente/password malo — sin oráculo (§8)
        await _auditar_rechazo(conn, audit.AccionAuth.LOGIN_RECHAZADO,
                               huella, e.motivo)
        raise

    try:
        claims = await get_supabase_verifier().verificar(
            grant["access_token"]
        )                                                    # 401
        sesion = await sesion_service.crear_sesion_post_login(
            conn, claims,
            dispositivo_id=_uuid_o_none(dispositivo_id),
            dispositivo_nombre=dispositivo_nombre,
        )
    except SupabaseTokenError as e:
        # un AT recién emitido por GoTrue que no verifica es una
        # anomalía grave — queda evidencia igual que un rechazo
        await _auditar_rechazo(conn, audit.AccionAuth.LOGIN_RECHAZADO,
                               huella, e.motivo)
        raise
    except sesion_service.SesionError as e:
        await _auditar_rechazo(conn, audit.AccionAuth.LOGIN_RECHAZADO,
                               huella, e.motivo)
        raise

    usuario = await _obtener_usuario_basico(conn, sesion["usuario_id"])
    if usuario is None:
        raise sesion_service.SesionError("integridad_rota")  # → 500

    await audit.auditar_sesion(
        conn, accion=audit.AccionAuth.LOGIN,
        sesion_id=uuid.UUID(str(sesion["id"])),
        actor_id=uuid.UUID(str(usuario["id"])),
        dispositivo_id=uuid.UUID(str(sesion["dispositivo_id"])),
        detalle={"huella": huella},
    )
    return {
        "access_token": grant["access_token"],
        "refresh_token": grant["refresh_token"],
        "expires_in": grant.get("expires_in", 3600),
        "usuario_id": str(usuario["id"]),
        "nombre": usuario["nombre"],
        "dispositivo_id": str(sesion["dispositivo_id"]),
    }


# ============================================================================
# REGISTRO — POST /api/auth/registro (saga §7.2/§22.5)
# ============================================================================

async def registrar(conn, data) -> Dict[str, Any]:
    canonico = normalizar_identidad_fiscal(data.cedula_ruc)
    if not data.acepto_politicas:
        raise sesion_service.SesionError("politicas_no_aceptadas")
    email = derivar_email_sintetico(canonico)
    huella = huella_identidad(canonico)

    # --- dedup en 3 estados (§22.5) -------------------------------------
    usuario = await _buscar_usuario_por_canonico(conn, canonico)
    puente_row = await auth_puente.buscar_puente_por_cedula(
        conn, canonico
    )
    if puente_row is not None:
        raise sesion_service.SesionError("identidad_duplicada")  # 409

    reclamo_asistido = False
    if usuario is not None:
        # ESTADO 2 — huérfano local: ¿intento propio reciente o
        # cuenta histórica que requiere reclamo asistido?
        creado = usuario["created_at"]
        if creado.tzinfo is None:
            creado = creado.replace(tzinfo=timezone.utc)
        reciente = (
            datetime.now(timezone.utc) - creado
            <= timedelta(minutes=RECLAMO_AUTO_MIN)
        )
        if not reciente:
            raise sesion_service.SesionError("cuenta_requiere_reclamo")
        reclamo_asistido = True               # continúa en paso 4
        usuario_id = usuario["id"]
        nombre = usuario["nombre"]
    else:
        # --- TX1: usuarios ------------------------------------------------
        try:
            fila = await _insertar_usuario(conn, data, canonico)
        except UniqueViolation:
            await conn.rollback()
            raise sesion_service.SesionError("identidad_duplicada")
        except Exception:
            await conn.rollback()
            raise
        await conn.commit()
        usuario_id = fila["id"]
        nombre = fila["nombre"]

    # --- paso remoto: alta (o reconciliación) en GoTrue -------------------
    try:
        auth_user_id = await _crear_o_reconciliar_auth_user(
            email, data.password, canonico
        )
    except SupabaseAuthError as e:
        if not reclamo_asistido:
            # compensación §7.3: el usuarios huérfano se borra para
            # que el retry del mismo request converja a ESTADO 3
            await _eliminar_usuario_compensacion(conn, usuario_id)
        await _auditar_rechazo(
            conn, audit.AccionAuth.REGISTRO_COMPENSADO,
            huella, f"remoto:{e.motivo}", actor_id=usuario_id,
        )
        raise sesion_service.SesionError("supabase_no_disponible")

    # --- TX2: puente ------------------------------------------------------
    try:
        await auth_puente.crear_vinculo(
            conn,
            auth_user_id=uuid.UUID(auth_user_id),
            usuario_id=uuid.UUID(str(usuario_id)),
            cedula_ruc=canonico,
            vinculado_por="registro",
        )
        await conn.commit()             # TX2 cerrada: cuenta completa
    except Exception:
        await conn.rollback()
        # compensación §7.3: sin puente el auth user es inalcanzable;
        # usuarios se conserva (dato de negocio idempotente — el
        # retry lo reutiliza dentro de la ventana de reclamo)
        try:
            await supabase_client.admin_delete_user(auth_user_id)
        except SupabaseAuthError:
            pass                        # reconciliación posterior
        await _auditar_rechazo(
            conn, audit.AccionAuth.REGISTRO_COMPENSADO,
            huella, "puente_fallido", actor_id=usuario_id,
        )
        raise sesion_service.SesionError("supabase_no_disponible")

    # --- signIn inmediato + sesión ---------------------------------------
    try:
        grant = await supabase_client.password_grant(
            email, data.password
        )
        claims = await get_supabase_verifier().verificar(
            grant["access_token"]
        )
        sesion = await sesion_service.crear_sesion_post_login(
            conn, claims,
            dispositivo_id=_uuid_o_none(data.dispositivo_id),
            dispositivo_nombre=data.dispositivo_nombre,
        )
    except (SupabaseAuthError, SupabaseTokenError,
            sesion_service.SesionError):
        # §7.3: cuenta completa pero el signIn final falló → el
        # registro es válido; el cliente hará /login.
        await audit.registrar_evento(
            conn, accion=audit.AccionAuth.REGISTRO,
            actor_id=uuid.UUID(str(usuario_id)),
            objeto_tipo="usuario",
            objeto_id=uuid.UUID(str(usuario_id)),
            detalle={"huella": huella, "login_inmediato": False},
        )
        return {
            "usuario_id": str(usuario_id),
            "nombre": nombre,
            "requiere_login": True,
        }

    await audit.registrar_evento(
        conn, accion=audit.AccionAuth.REGISTRO,
        actor_id=uuid.UUID(str(usuario_id)),
        objeto_tipo="sesion",
        objeto_id=uuid.UUID(str(sesion["id"])),
        contexto_tipo="dispositivo",
        contexto_id=uuid.UUID(str(sesion["dispositivo_id"])),
        detalle={"huella": huella, "login_inmediato": True},
    )
    return {
        "usuario_id": str(usuario_id),
        "nombre": nombre,
        "requiere_login": False,
        "access_token": grant["access_token"],
        "refresh_token": grant["refresh_token"],
        "expires_in": grant.get("expires_in", 3600),
        "dispositivo_id": str(sesion["dispositivo_id"]),
    }


# ============================================================================
# REFRESH — POST /api/auth/refresh
# ============================================================================

async def refresh(conn, refresh_token: str) -> Dict[str, Any]:
    # grant remoto primero: un RT inválido ni siquiera toca la BD
    try:
        grant = await supabase_client.refresh_grant(refresh_token)
    except SupabaseAuthError as e:
        await _auditar_rechazo(conn, audit.AccionAuth.REFRESH_RECHAZADO,
                               None, e.motivo)
        raise

    claims = await get_supabase_verifier().verificar(
        grant["access_token"]
    )
    auth_session_id = uuid.UUID(claims["session_id"])

    # rotación con detección local de replay (CASO C): una colisión
    # marca la sesión 'sospechosa' + posible_replay ANTES de
    # rechazar — la marca debe commitearse o el rollback la borraría
    try:
        rotacion = await sesion_service.registrar_refresh(
            conn, auth_session_id
        )
    except sesion_service.SesionError:
        await conn.commit()             # persiste sospechosa/evento
        raise

    await audit.auditar_sesion(
        conn, accion=audit.AccionAuth.REFRESH,
        sesion_id=uuid.UUID(str(rotacion["id"])),
        actor_id=None,                  # sistema: refresh observado
        detalle={
            "rotacion": rotacion["rotaciones_observadas"],
        },
    )
    return {
        "access_token": grant["access_token"],
        "refresh_token": grant["refresh_token"],
        "expires_in": grant.get("expires_in", 3600),
    }


# ============================================================================
# AUDITORÍA DE RECHAZOS — commit propio antes de propagar el error
# ============================================================================

async def _auditar_rechazo(
    conn,
    accion: str,
    huella: Optional[str],
    motivo: str,
    actor_id: Optional[UUID] = None,
) -> None:
    """
    Persiste el evento de rechazo en SU PROPIA transacción: el
    llamador elevará el error y el context manager haría rollback,
    borrando la evidencia — por eso aquí sí hay commit explícito
    (única excepción al patrón "sin commit en repos").
    """
    await audit.registrar_evento(
        conn,
        accion=accion,
        actor_id=actor_id,
        objeto_tipo="autenticacion",
        detalle={"huella": huella, "motivo": motivo},
        actor_tipo="sistema" if actor_id is None else "usuario",
    )
    await conn.commit()
