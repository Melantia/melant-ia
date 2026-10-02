# backend/modules/ecosistema_profesional/services/autorizacion.py
"""
Resolver de autorización contextual del EP (EP-4E-A).

Cadena de resolución (diseño aprobado §14.1, EP_MODELO_DATOS):

    usuario autenticado
      → participante del proyecto (ep_proyecto_participantes)
      → estado = 'activo'              (invitado/removido → ninguno)
      → permiso base de la matriz rol × recurso_tipo
      → + concesión activa aplicable   (instancia o tipo, vigente)
      → + 'asignada' vía responsable_id en actividades (E6)
      → min(…, techo del rol)          (E2 — anti-escalamiento)
      = permiso efectivo

Reglas embebidas:
- E1: un 'removido' nunca resuelve; las 'revocada' nunca resuelven
  (el repo las excluye en SQL); la reactivación recupera SOLO el nivel
  base del rol vigente — las concesiones revocadas no reviven.
- E2: techo duro por rol — una concesión jamás eleva por encima.
- E3: recurso_id es referencia suave; para tipos con vínculo físico
  (finca/lote/levantamiento/registro) la instancia debe estar vinculada
  al proyecto o el permiso sobre esa instancia es 'ninguno'.
- E5: este resolver solo alimenta endpoints EP; los endpoints del
  módulo origen (fincas, levantamientos…) no lo consultan.
- Sin DENY: las concesiones solo elevan (o no aplican), nunca rebajan.

Uso:

    nivel = await resolver_permiso(
        conn, usuario_id, proyecto_id, 'levantamiento', recurso_id
    )
    if not nivel_suficiente(nivel, 'consulta'):
        raise ResourceNotFoundError(...)   # 404 indistinguible
"""
from typing import Optional
from uuid import UUID

from shared.repositories import ep_autorizacion as repo


# ============================================================================
# NIVELES (orden estricto)
# ============================================================================

NINGUNO = "ninguno"
CONSULTA = "consulta"
CREAR = "crear"
EDITAR = "editar"
ADMINISTRAR = "administrar"

_ORDEN = [NINGUNO, CONSULTA, CREAR, EDITAR, ADMINISTRAR]


def nivel_suficiente(efectivo: str, minimo: str) -> bool:
    """True si el nivel efectivo alcanza el mínimo requerido."""
    return _ORDEN.index(efectivo) >= _ORDEN.index(minimo)


def _mayor(a: str, b: str) -> str:
    return a if _ORDEN.index(a) >= _ORDEN.index(b) else b


def _menor(a: str, b: str) -> str:
    return a if _ORDEN.index(a) <= _ORDEN.index(b) else b


# ============================================================================
# TECHOS DE ROL (E2 — anti-escalamiento)
# ============================================================================

TECHOS_ROL = {
    "propietario": ADMINISTRAR,
    "profesional_responsable": ADMINISTRAR,   # salvo propiedad (service)
    "tecnico": EDITAR,
    "colaborador": EDITAR,
    "auditor": CONSULTA,
    "cliente": CONSULTA,
}

# ============================================================================
# MATRIZ BASE rol × recurso_tipo (§14.2 — recursos existentes)
#
# 'proyecto'      datos/estado del proyecto
# 'participantes' gestión de participantes
# 'vinculo'       altas/bajas en ep_proyecto_<tipo>
# 'actividad'     actividades en contexto del proyecto
# 'agenda'        eventos de agenda ligados al proyecto
# 'historial'     audit_eventos del contexto proyecto
# 'finca'/'lote'/'levantamiento'/'registro'   instancia vinculada
# 'documento'/'presupuesto'/'resultado'       concesionables futuros
# ============================================================================

_P = "propietario"
_PR = "profesional_responsable"
_CL = "cliente"
_CO = "colaborador"
_TE = "tecnico"
_AU = "auditor"

MATRIZ_BASE = {
    _P: {
        "proyecto": ADMINISTRAR, "participantes": ADMINISTRAR,
        "vinculo": ADMINISTRAR, "actividad": ADMINISTRAR,
        "agenda": CONSULTA, "historial": CONSULTA,
        "finca": ADMINISTRAR, "lote": ADMINISTRAR,
        "levantamiento": ADMINISTRAR, "registro": ADMINISTRAR,
        "documento": ADMINISTRAR, "presupuesto": ADMINISTRAR,
        "resultado": ADMINISTRAR,
    },
    _PR: {
        # administrar salvo transferir propiedad y retirar/degradar al
        # propietario — esas excepciones las exige el service, no el nivel
        "proyecto": ADMINISTRAR, "participantes": ADMINISTRAR,
        "vinculo": ADMINISTRAR, "actividad": ADMINISTRAR,
        "agenda": CONSULTA, "historial": CONSULTA,
        "finca": ADMINISTRAR, "lote": ADMINISTRAR,
        "levantamiento": ADMINISTRAR, "registro": ADMINISTRAR,
        "documento": ADMINISTRAR, "presupuesto": ADMINISTRAR,
        "resultado": ADMINISTRAR,
    },
    _CL: {
        # consulta: avance, entregables compartidos, presupuesto
        # consolidado (D-D6); nunca internos — visible_cliente diferido E4
        "proyecto": CONSULTA, "participantes": CONSULTA,
        "vinculo": CONSULTA, "actividad": CONSULTA,
        "agenda": CONSULTA, "historial": NINGUNO,
        "finca": CONSULTA, "lote": CONSULTA,
        "levantamiento": CONSULTA, "registro": CONSULTA,
        "documento": CONSULTA, "presupuesto": CONSULTA,
        "resultado": CONSULTA,
    },
    _CO: {
        # actividad 'crear' en base (propias); editar propias llega por
        # responsable_id (E6)
        "proyecto": CONSULTA, "participantes": CONSULTA,
        "vinculo": CONSULTA, "actividad": CREAR,
        "agenda": CONSULTA, "historial": NINGUNO,
        "finca": CONSULTA, "lote": CONSULTA,
        "levantamiento": CONSULTA, "registro": CONSULTA,
        "documento": CREAR, "presupuesto": NINGUNO,
        "resultado": CREAR,
    },
    _TE: {
        "proyecto": CONSULTA, "participantes": CONSULTA,
        "vinculo": CONSULTA, "actividad": CONSULTA,
        "agenda": CONSULTA, "historial": NINGUNO,
        "finca": CONSULTA, "lote": CONSULTA,
        "levantamiento": CONSULTA, "registro": CONSULTA,
        "documento": CREAR, "presupuesto": NINGUNO,
        "resultado": CREAR,
    },
    _AU: {
        "proyecto": CONSULTA, "participantes": CONSULTA,
        "vinculo": CONSULTA, "actividad": CONSULTA,
        "agenda": CONSULTA, "historial": CONSULTA,
        "finca": CONSULTA, "lote": CONSULTA,
        "levantamiento": CONSULTA, "registro": CONSULTA,
        "documento": CONSULTA, "presupuesto": CONSULTA,
        "resultado": CONSULTA,
    },
}

# Nivel "asignada" (E6): responsable_id de la actividad eleva a editar
_NIVEL_ASIGNADA = EDITAR


# ============================================================================
# RESOLVER
# ============================================================================

async def resolver_permiso(
    conn,
    usuario_id: UUID,
    proyecto_id: UUID,
    recurso_tipo: str,
    recurso_id: Optional[UUID] = None,
) -> str:
    """
    Nivel de acceso efectivo del usuario sobre un recurso del proyecto.

    `recurso_tipo` es una clave de MATRIZ_BASE. `recurso_id` (opcional)
    identifica una instancia; para tipos con vínculo físico
    (finca/lote/levantamiento/registro) la instancia debe estar
    vinculada al proyecto o el resultado es 'ninguno' (E3/§14.4).
    Para 'actividad' con instancia, la actividad debe pertenecer al
    proyecto (contexto suave D9) y ser su responsable eleva a 'editar'
    (E6). Tipos sin vínculo físico ('documento','presupuesto',
    'resultado') no verifican existencia — un UUID solo no autoriza.

    Retorna uno de: 'ninguno' | 'consulta' | 'crear' | 'editar' |
    'administrar'. Nunca lanza excepción de autorización — la
    traducción a 404/403 la hace la capa que lo invoca.
    """
    participante = await repo.obtener_participante(
        conn, proyecto_id, usuario_id
    )
    if not participante or participante["estado"] != "activo":
        # Herencia única aprobada: propietario del workspace ancla,
        # lectura completa aunque no sea participante (D-C3/§14.4)
        propietario_ws = await repo.propietario_workspace_ancla(
            conn, proyecto_id
        )
        if propietario_ws and str(propietario_ws) == str(usuario_id):
            return CONSULTA
        return NINGUNO

    rol = participante["rol"]
    techo = TECHOS_ROL.get(rol, NINGUNO)
    efectivo = _menor(
        MATRIZ_BASE.get(rol, {}).get(recurso_tipo, NINGUNO), techo
    )

    if recurso_id is not None:
        # Instancia concreta: debe existir el vínculo contextual
        if recurso_tipo in repo.VINCULOS:
            if not await repo.existe_vinculo(
                conn, proyecto_id, recurso_tipo, recurso_id
            ):
                return NINGUNO
        elif recurso_tipo == "actividad":
            actividad = await repo.obtener_actividad_proyecto(
                conn, proyecto_id, recurso_id
            )
            if not actividad:
                return NINGUNO
            # E6 — responsable de la actividad: 'asignada' = editar
            responsable = actividad.get("responsable_id")
            if responsable and str(responsable) == str(usuario_id):
                efectivo = _mayor(efectivo, _NIVEL_ASIGNADA)

    # Concesiones activas y vigentes sobre instancia o tipo (E1: las
    # revocadas no llegan — el repo filtra estado='activa')
    concesiones = await repo.concesiones_aplicables(
        conn, participante["id"], recurso_tipo, recurso_id
    )
    for concesion in concesiones:
        efectivo = _mayor(efectivo, concesion["nivel"])

    return _menor(efectivo, techo)


async def tiene_acceso(
    conn,
    usuario_id: UUID,
    proyecto_id: UUID,
    recurso_tipo: str,
    nivel_minimo: str,
    recurso_id: Optional[UUID] = None,
) -> bool:
    """Atajo booleano: nivel efectivo ≥ nivel_minimo."""
    nivel = await resolver_permiso(
        conn, usuario_id, proyecto_id, recurso_tipo, recurso_id
    )
    return nivel_suficiente(nivel, nivel_minimo)
