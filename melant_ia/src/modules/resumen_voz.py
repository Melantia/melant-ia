"""
resumen_voz.py
Generador del Reporte Gerencial de MELANT IA.
Integra: ImpactoFinanciero, DetectorFitopatologico y AsistenteCultivosIA.
"""
import os
from src.modules.asistente_tecnico_rural.valor_ahorro import ImpactoFinanciero
from src.modules.asistente_tecnico_rural.detector_ligero import DetectorFitopatologico
from src.modules.asistente_tecnico_rural.asistente_cultivos import AsistenteCultivosIA


def generar_reporte_gerencial(productor_id: int) -> dict:
    """
    Reúne datos de los tres módulos principales y genera el
    resumen de voz + datos para el Dashboard (DashboardMelantia).

    Args:
        productor_id: ID del productor en la tabla productores.

    Returns:
        dict con claves 'voz' (texto para TTS) y 'datos' (para el frontend).
    """
    # 1. Ahorros financieros
    impacto = ImpactoFinanciero()
    reporte_ahorro = impacto.reporte_mensual()

    # 2. Hallazgos fitosanitarios (modelo TFLite offline)
    ruta_modelo = os.path.join(
        os.path.dirname(__file__),
        "asistente_tecnico_rural",
        "modelo_ligero.tflite"
    )
    detector = DetectorFitopatologico(ruta_modelo)
    hallazgos = detector.obtener_resumen_hallazgos()

    # 3. Estado del cultivo / instrucciones proactivas
    cultivos_ia = AsistenteCultivosIA()
    estado_cultivo = cultivos_ia.obtener_instrucciones_proactivas("cacao")

    mensaje_voz = (
        f"Hola productor {productor_id}, aquí está tu resumen. "
        f"{reporte_ahorro}. "
        f"Diagnóstico fitosanitario: {hallazgos}. "
        f"Estado actual: {estado_cultivo.get('ia_dice', 'Sin novedades')}."
    )

    return {
        "voz": mensaje_voz,
        "datos": {
            "ahorro_acumulado": reporte_ahorro,
            "hallazgos":        hallazgos,
            "cultivo":          estado_cultivo,
        }
    }
