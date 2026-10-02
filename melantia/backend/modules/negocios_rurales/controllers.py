# backend/modules/negocios_rurales/controllers.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database import get_db_connection_sync, single_flight

router = APIRouter()

# --- Schemas de Validación Interna ---
class OfertaBolsaInput(BaseModel):
    usuario_id: str
    tipo_oferta: str  # 'compra' o 'transporte'
    rol_emisor: str   # 'Comprador', 'Transportista Carga Pesada/Liviana'
    rubro_o_ruta: str # Ej: 'Plátano' o 'Ruta: El Carmen -> Guayaquil'
    cantidad_volumen: str
    precio_sugerido: float

# --- Función Auxiliar para SingleFlight (Consulta Real a la DB) ---
def _db_consultar_ofertas_abiertas():
    with get_db_connection_sync() as (conn, cursor):
        cursor.execute(
            "SELECT id, usuario_id, tipo_oferta, rol_emisor, rubro_o_ruta, cantidad_volumen, precio_sugerido, comision_app, valor_neto, estado FROM bolsa_ofertas WHERE estado = 'Abierta' ORDER BY created_at DESC;"
        )
        return cursor.fetchall()

# --- Endpoints del Módulo 4 ---

@router.get("/ofertas", summary="Listar ofertas abiertas en la bolsa con Request Coalescing")
async def listar_ofertas_bolsa():
    """
    Retorna las ofertas comerciales activas. Protegido con SingleFlight para evitar
    el efecto Cache Stampede si cientos de agricultores consultan al mismo tiempo.
    """
    # Colapsa múltiples peticiones concurrentes en una única consulta física a la base de datos
    return await single_flight.ejecutar("bolsa_ofertas_abiertas_cache", _db_consultar_ofertas_abiertas)


@router.post("/crear", status_code=status.HTTP_201_CREATED, summary="Publicar oferta de compra o transporte")
def crear_oferta_comercial(data: OfertaBolsaInput):
    """
    Inserta una oferta en el nodo local. El TRIGGER SQL inyectará el cobro del 3% de forma nativa.
    Invalida la caché del SingleFlight para mantener los datos del mercado frescos.
    """
    try:
        with get_db_connection_sync() as (conn, cursor):
            sql = """
                INSERT INTO bolsa_ofertas (usuario_id, tipo_oferta, rol_emisor, rubro_o_ruta, cantidad_volumen, precio_sugerido, estado)
                VALUES (%s, %s, %s, %s, %s, %s, 'Abierta') RETURNING id, comision_app, valor_neto;
            """
            cursor.execute(sql, (data.usuario_id, data.tipo_oferta, data.rol_emisor, data.rubro_o_ruta, data.cantidad_volumen, data.precio_sugerido))
            row = cursor.fetchone()

            # Invalida de inmediato el caché local para forzar actualización del mercado en el próximo get
            single_flight.invalidar_clave("bolsa_ofertas_abiertas_cache")

            return {
                "status": "success",
                "oferta_id": row["id"],
                "comision_calculada_3pct": float(row["comision_app"]),
                "liquidacion_neto_productor": float(row["valor_neto"])
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en la persistencia del trato comercial: {e}")


@router.post("/aceptar/{oferta_id}/{usuario_acepta_id}", summary="Cerrar el trato comercial en la app")
def aceptar_trato_bolsa(oferta_id: str, usuario_acepta_id: str):
    """
    Cambia el estatus de la oferta a 'Aceptada'. Registra qué productor o comprador
    asumió el trato para iniciar los procesos de conciliación financiera y evidencias.
    """
    with get_db_connection_sync() as (conn, cursor):
        sql_update = """
            UPDATE bolsa_ofertas
            SET estado = 'Aceptada', comprador_o_productor_acepta_id = %s
            WHERE id = %s AND estado = 'Abierta' RETURNING id;
        """
        cursor.execute(sql_update, (usuario_acepta_id, oferta_id))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="La oferta no existe o ya fue aceptada por otro operador.")

        single_flight.invalidar_clave("bolsa_ofertas_abiertas_cache")
        return {"status": "success", "mensaje": "Trato cerrado con éxito. Proceder al registro de evidencias fotográficas."}
