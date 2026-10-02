# backend/tests/test_ep_autorizacion.py
"""Pruebas del resolver de autorización contextual EP (EP-4E-A).

Sin base de datos: conexión falsa que encola filas por orden de
consulta del repository y captura SQL/params. La lógica física de
concesiones (estado='activa', vigente_hasta, índices parciales E9) ya
se verificó sobre PostgreSQL real en la fase de migración.

Orden de consultas que consume resolver_permiso:
    1. obtener_participante          (fetchone → dict | None)
    2. propietario_workspace_ancla   (solo si no hay participante activo)
    3. existe_vinculo                (instancia de tipo vinculable)
       | obtener_actividad_proyecto  (instancia 'actividad')
    4. concesiones_aplicables        (fetchall → lista)
"""
import asyncio
import uuid
from datetime import datetime, timezone

from modules.ecosistema_profesional.services import autorizacion as svc

NOW = datetime.now(timezone.utc)

PROYECTO = str(uuid.uuid4())
OTRO_PROYECTO = str(uuid.uuid4())
USUARIO = str(uuid.uuid4())
PART_ID = str(uuid.uuid4())
LOTE = str(uuid.uuid4())
OTRO_LOTE = str(uuid.uuid4())
ACTIVIDAD = str(uuid.uuid4())
WS_OWNER = str(uuid.uuid4())


def _part(rol="tecnico", estado="activo", usuario=USUARIO,
          proyecto=PROYECTO):
    return {
        "id": PART_ID, "proyecto_id": proyecto, "usuario_id": usuario,
        "rol": rol, "estado": estado, "created_at": NOW,
    }


def _concesion(nivel="editar", recurso_id=None, recurso_tipo="lote"):
    return {
        "id": str(uuid.uuid4()), "recurso_tipo": recurso_tipo,
        "recurso_id": recurso_id, "nivel": nivel,
        "vigente_hasta": None,
    }


class _FakeCursor:
    def __init__(self, conn):
        self._conn = conn
        self._result = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def execute(self, sql, params=None):
        self._conn.queries.append((sql, params))
        item = self._conn.results.pop(0) if self._conn.results else []
        if isinstance(item, Exception):
            raise item
        self._result = item

    async def fetchone(self):
        if isinstance(self._result, dict):
            return self._result
        return self._result[0] if self._result else None

    async def fetchall(self):
        return list(self._result) if isinstance(self._result, list) else []


class _FakeConn:
    def __init__(self, results=None):
        self.results = list(results or [])
        self.queries = []

    def cursor(self, row_factory=None):
        return _FakeCursor(self)


def run(coro):
    return asyncio.run(coro)


def resolver(conn, recurso_tipo="proyecto", recurso_id=None,
             usuario=USUARIO, proyecto=PROYECTO):
    return run(svc.resolver_permiso(
        conn, usuario, proyecto, recurso_tipo, recurso_id
    ))


# ============================================================================
# PERMISO BASE POR ROL (matriz §14.2)
# ============================================================================

import pytest


@pytest.mark.parametrize("rol,esperado", [
    ("propietario", "administrar"),
    ("profesional_responsable", "administrar"),
    ("cliente", "consulta"),
    ("colaborador", "consulta"),
    ("tecnico", "consulta"),
    ("auditor", "consulta"),
])
def test_base_proyecto_por_rol(rol, esperado):
    conn = _FakeConn([_part(rol=rol), []])   # sin concesiones
    assert resolver(conn, "proyecto") == esperado


def test_colaborador_crea_actividad():
    conn = _FakeConn([_part(rol="colaborador"), []])
    assert resolver(conn, "actividad") == "crear"


def test_auditor_historial_consulta():
    conn = _FakeConn([_part(rol="auditor"), []])
    assert resolver(conn, "historial") == "consulta"


def test_cliente_historial_ninguno():
    conn = _FakeConn([_part(rol="cliente"), []])
    assert resolver(conn, "historial") == "ninguno"


def test_tecnico_presupuesto_ninguno():
    conn = _FakeConn([_part(rol="tecnico"), []])
    assert resolver(conn, "presupuesto") == "ninguno"


def test_recurso_desconocido_ninguno():
    conn = _FakeConn([_part(rol="propietario"), []])
    assert resolver(conn, "tipo_inexistente") == "ninguno"


# ============================================================================
# ESTADOS DEL PARTICIPANTE (E1)
# ============================================================================

def test_invitado_sin_acceso():
    conn = _FakeConn([_part(estado="invitado"),
                      {"propietario_id": str(uuid.uuid4())}])
    assert resolver(conn, "proyecto") == "ninguno"


def test_removido_sin_acceso_aun_con_historial():
    # Aunque exista fila histórica de concesión, 'removido' → ninguno
    conn = _FakeConn([_part(estado="removido"),
                      {"propietario_id": str(uuid.uuid4())}])
    assert resolver(conn, "lote", LOTE) == "ninguno"
    # No debe ni consultar vínculo ni concesiones: solo 2 queries
    assert len(conn.queries) == 2


def test_sin_participacion_ninguno():
    conn = _FakeConn([[], {"propietario_id": str(uuid.uuid4())}])
    assert resolver(conn, "proyecto") == "ninguno"


def test_propietario_workspace_ancla_consulta():
    # PW: propietario del workspace ancla sin ser participante → consulta
    conn = _FakeConn([[], {"propietario_id": WS_OWNER}])
    assert resolver(conn, "proyecto", usuario=WS_OWNER) == "consulta"


# ============================================================================
# CONCESIONES (E1/E2/E9)
# ============================================================================

def test_concesion_activa_instancia_eleva():
    conn = _FakeConn([
        _part(rol="tecnico"),           # 1 participante
        {"?column?": 1},                # 2 vínculo lote existe
        [_concesion("editar", LOTE)],   # 3 concesión activa
    ])
    assert resolver(conn, "lote", LOTE) == "editar"


def test_concesion_por_tipo_aplica_a_instancia():
    conn = _FakeConn([
        _part(rol="tecnico"),
        {"?column?": 1},
        [_concesion("editar")],         # recurso_id NULL = todo 'lote'
    ])
    assert resolver(conn, "lote", LOTE) == "editar"


def test_concesion_instancia_no_aplica_a_otra():
    # El repo filtra por recurso_id: otra instancia → lista vacía
    conn = _FakeConn([_part(rol="tecnico"), {"?column?": 1}, []])
    assert resolver(conn, "lote", OTRO_LOTE) == "consulta"


def test_concesion_revocada_no_resuelve():
    # El SQL filtra estado='activa': revocada jamás llega (lista [])
    conn = _FakeConn([_part(rol="tecnico"), {"?column?": 1}, []])
    assert resolver(conn, "lote", LOTE) == "consulta"
    sql = conn.queries[-1][0]
    assert "estado = 'activa'" in sql


def test_concesion_expirada_no_resuelve():
    # El SQL exige vigente_hasta NULL o futura
    conn = _FakeConn([_part(rol="tecnico"), {"?column?": 1}, []])
    assert resolver(conn, "lote", LOTE) == "consulta"
    assert "vigente_hasta" in conn.queries[-1][0]


def test_concesion_limitada_por_techo_cliente():
    # cliente (techo consulta) + concesión 'editar' → sigue consulta
    conn = _FakeConn([
        _part(rol="cliente"), {"?column?": 1},
        [_concesion("editar", LOTE)],
    ])
    assert resolver(conn, "lote", LOTE) == "consulta"


def test_concesion_limitada_por_techo_tecnico():
    # tecnico (techo editar): la concesión puede llegar a editar,
    # pero 'administrar' no existe como nivel de concesión (CHECK)
    conn = _FakeConn([
        _part(rol="tecnico"), {"?column?": 1},
        [_concesion("editar", LOTE)],
    ])
    assert resolver(conn, "lote", LOTE) == "editar"


def test_ausencia_de_concesion_da_base():
    conn = _FakeConn([_part(rol="auditor"), {"?column?": 1}, []])
    assert resolver(conn, "lote", LOTE) == "consulta"


# ============================================================================
# VÍNCULO CONTEXTUAL (E3/D-D7) Y RESPONSABLE (E6)
# ============================================================================

def test_instancia_sin_vinculo_ninguno():
    # Lote no vinculado al proyecto: ni base ni grant
    conn = _FakeConn([_part(rol="propietario"), []])
    assert resolver(conn, "lote", LOTE) == "ninguno"
    # No consulta concesiones tras fallar el vínculo
    assert len(conn.queries) == 2


def test_actividad_ajena_al_proyecto_ninguno():
    conn = _FakeConn([_part(rol="tecnico"), []])   # sin actividad
    assert resolver(conn, "actividad", ACTIVIDAD) == "ninguno"


def test_responsable_actividad_edita():
    # E6: tecnico responsable de la actividad → editar sin concesión
    conn = _FakeConn([
        _part(rol="tecnico"),
        {"id": ACTIVIDAD, "responsable_id": USUARIO},
        [],
    ])
    assert resolver(conn, "actividad", ACTIVIDAD) == "editar"


def test_no_responsable_solo_consulta():
    conn = _FakeConn([
        _part(rol="tecnico"),
        {"id": ACTIVIDAD, "responsable_id": str(uuid.uuid4())},
        [],
    ])
    assert resolver(conn, "actividad", ACTIVIDAD) == "consulta"


def test_recurso_soft_sin_verificacion():
    # 'documento' sin tabla de vínculo: un UUID solo no autoriza más
    # que el nivel base del rol; grant por id sí aplica (E3)
    conn = _FakeConn([_part(rol="tecnico"), []])
    assert resolver(conn, "documento", str(uuid.uuid4())) == "crear"


# ============================================================================
# AISLAMIENTO Y CICLO DE VIDA (E1)
# ============================================================================

def test_aislamiento_entre_proyectos():
    # Participante de PROYECTO no tiene fila en OTRO_PROYECTO → ninguno
    conn = _FakeConn([[], {"propietario_id": str(uuid.uuid4())}])
    assert resolver(conn, "proyecto", proyecto=OTRO_PROYECTO) == "ninguno"


def test_reactivacion_solo_recupera_base():
    # Reactivado (activo otra vez): sus concesiones quedaron 'revocada'
    # → el repo devuelve [] y solo aplica el nivel base del rol (E1)
    conn = _FakeConn([
        _part(rol="tecnico", estado="activo"),
        {"?column?": 1},
        [],   # todas sus concesiones están revocadas
    ])
    assert resolver(conn, "lote", LOTE) == "consulta"


# ============================================================================
# HELPERS
# ============================================================================

def test_nivel_suficiente():
    assert svc.nivel_suficiente("editar", "consulta")
    assert svc.nivel_suficiente("editar", "crear")
    assert not svc.nivel_suficiente("consulta", "editar")
    assert svc.nivel_suficiente("administrar", "administrar")


def test_tiene_acceso():
    conn = _FakeConn([_part(rol="propietario"), []])
    assert run(svc.tiene_acceso(
        conn, USUARIO, PROYECTO, "proyecto", "administrar"
    )) is True


# ============================================================================
# DEPENDENCIA require_ep_access (EP-4E)
#
# App mínima de test: la dependencia lee proyecto_id/recurso_id de
# request.path_params — se ejercita con rutas reales de una app
# FastAPI local al test (no se toca el router de producción).
# ============================================================================

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from core.dependencies import get_current_user, get_db
from core.exceptions import MelantiaException
from modules.ecosistema_profesional.dependencies import require_ep_access

_app = FastAPI()


@_app.exception_handler(MelantiaException)
async def _melantia_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@_app.get("/ep/proyectos/{proyecto_id}")
async def _ver_proyecto(
    nivel: str = Depends(require_ep_access("proyecto", "consulta")),
):
    return {"nivel": nivel}


@_app.get("/ep/proyectos/{proyecto_id}/lotes/{lote_id}")
async def _ver_lote(
    nivel: str = Depends(require_ep_access(
        "lote", "consulta", recurso_id_param="lote_id")),
):
    return {"nivel": nivel}


@_app.delete("/ep/proyectos/{proyecto_id}/lotes/{lote_id}")
async def _borrar_lote(
    nivel: str = Depends(require_ep_access(
        "lote", "editar", recurso_id_param="lote_id")),
):
    return {"nivel": nivel}


_dep_client = TestClient(_app, raise_server_exceptions=False)


def _montar(conn, usuario=USUARIO):
    async def _db():
        yield conn, None
    _app.dependency_overrides[get_db] = _db
    _app.dependency_overrides[get_current_user] = lambda: usuario


@pytest.fixture(autouse=True)
def _limpiar_overrides():
    yield
    _app.dependency_overrides.clear()


def test_dep_consulta_ok_devuelve_nivel():
    _montar(_FakeConn([_part(rol="propietario"), []]))
    r = _dep_client.get(f"/ep/proyectos/{PROYECTO}")
    assert r.status_code == 200
    assert r.json()["nivel"] == "administrar"


def test_dep_ajeno_404_indistinguible():
    _montar(_FakeConn([[], {"propietario_id": str(uuid.uuid4())}]))
    assert _dep_client.get(f"/ep/proyectos/{PROYECTO}").status_code == 404


def test_dep_instancia_sin_vinculo_404():
    _montar(_FakeConn([_part(rol="tecnico"), []]))   # sin vínculo
    r = _dep_client.get(f"/ep/proyectos/{PROYECTO}/lotes/{LOTE}")
    assert r.status_code == 404


def test_dep_nivel_insuficiente_403():
    # tecnico consulta el lote OK pero borrar exige 'editar' → 403
    conn_consulta = _FakeConn([_part(rol="tecnico"), {"?column?": 1}, []])
    _montar(conn_consulta)
    r = _dep_client.get(f"/ep/proyectos/{PROYECTO}/lotes/{LOTE}")
    assert r.status_code == 200

    conn_editar = _FakeConn([_part(rol="tecnico"), {"?column?": 1}, []])
    _montar(conn_editar)
    r = _dep_client.delete(f"/ep/proyectos/{PROYECTO}/lotes/{LOTE}")
    assert r.status_code == 403


def test_dep_concesion_permite_delete():
    _montar(_FakeConn([
        _part(rol="tecnico"), {"?column?": 1},
        [_concesion("editar", LOTE)],
    ]))
    r = _dep_client.delete(f"/ep/proyectos/{PROYECTO}/lotes/{LOTE}")
    assert r.status_code == 200


def test_dep_sin_jwt_401():
    # Sin override de get_current_user ni token → 401
    r = _dep_client.get(f"/ep/proyectos/{PROYECTO}")
    assert r.status_code in (401, 403)
