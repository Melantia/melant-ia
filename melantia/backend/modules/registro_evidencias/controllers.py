# backend/modules/registro_evidencias/controllers.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database import get_db_connection_sync

router = APIRouter()

class EvidenciaActivoInput(BaseModel):
    usuario_id: str
    categoria_bien: str              # 'Cosecha', 'Bienes Raíces', 'Vehículos', 'Maquinaria'
    nombre_documento: str
    monto_total: float
    url_foto_evidencia_firmas: str   # Foto del apretón de manos o contrato manuscrito
    url_foto_soporte_legal: str      # Foto de la ESCRITURA o MATRÍCULA
    hash_transaccion: str

@router.post("/custodiar", status_code=status.HTTP_201_CREATED, summary="Registrar activo en custodia transparente")
def custodiar_activo_comercial(data: EvidenciaActivoInput):
    """
    Almacena las evidencias documentales físicas del negocio.
    Exige de forma obligatoria la foto de la escritura o matrícula para bienes raíces/vehículos.
    """
    if data.categoria_bien in ["Bienes Raíces", "Vehículos"] and not data.url_foto_soporte_legal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transparencia denegada: La venta de {data.categoria_bien} exige la foto nítida de la Escritura o Matrícula."
        )

    comision = data.monto_total * 0.03
    monto_liberado = data.monto_total - comision

    try:
        with get_db_connection_sync() as (conn, cursor):
            sql = """
                INSERT INTO evidencias_documentos
                (usuario_id, categoria_bien, nombre_documento, monto_total, comision_app, monto_liberado, url_foto_evidencia_firmas, url_foto_soporte_legal, estado_pago, hash_transaccion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'En Custodia', %s) RETURNING id;
            """
            cursor.execute(sql, (
                data.usuario_id, data.categoria_bien, data.nombre_documento, data.monto_total,
                comision, monto_liberado, data.url_foto_evidencia_firmas, data.url_foto_soporte_legal, data.hash_transaccion
            ))
            row = cursor.fetchone()

            return {
                "contrato_uuid": row["id"],
                "estado": "En Custodia Seguro",
                "retencion_plataforma_3pct": comision,
                "neto_por_liberar": monto_liberado,
                "sello_verificacion_qr": f"MEL-TX-{data.hash_transaccion[:8].upper()}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al blindar el registro de evidencias: {e}")

@router.post("/confirmar/{contrato_id}/{rol}", summary="Confirmación de conformidad de firmas de las partes")
def confirmar_acuerdo_partes(contrato_id: str, rol: str):
    """
    Registra el visto bueno del 'vendedor' o 'comprador'. Cuando ambos son TRUE, libera los fondos.
    """
    if rol not in ["vendedor", "comprador"]:
        raise HTTPException(status_code=400, detail="Rol de confirmación no válido.")

    columna_update = "confirmacion_vendedor" if rol == "vendedor" else "confirmacion_comprador"

    try:
        with get_db_connection_sync() as (conn, cursor):
            cursor.execute(f"UPDATE evidencias_documentos SET {columna_update} = TRUE WHERE id = %s RETURNING confirmacion_vendedor, confirmacion_comprador, monto_liberado;", (contrato_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Registro documental de custodia no encontrado.")

            if row["confirmacion_vendedor"] and row["confirmacion_comprador"]:
                cursor.execute("UPDATE evidencias_documentos SET estado_pago = 'Fondos Liberados al Vendedor' WHERE id = %s;", (contrato_id,))
                return {
                    "status": "Transacción Completada",
                    "estado_pago": "Fondos Liberados al Vendedor",
                    "monto_transferido": float(row["monto_liberado"])
                }

            return {"status": "Aceptación Parcial", "estado_pago": "En Custodia"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el proceso de firmas: {e}")
