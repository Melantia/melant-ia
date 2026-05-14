"""
Módulo: valor_ahorro.py
Calculadora de Ahorro Estimado y Pérdida Evitada por recomendaciones climáticas y legales.
Genera reporte de ROI y exportación para créditos.
"""
from typing import List, Dict
from datetime import datetime

COSTO_FERTILIZANTE_HA = 120.0  # USD/Ha (referencial Ecuador)
EFICIENCIA_DERIVA = 0.3  # 30% de pérdida por deriva
MULTA_LABORAL = 400.0  # USD mínima
MULTA_LICENCIA = 120.0  # USD mínima

class ImpactoFinanciero:
    def __init__(self):
        self.ahorro = 0.0
        self.perdida_evitada = 0.0
        self.mensajes = []
        self.historial = []

    def registrar_ahorro_lavado(self, hectareas: float):
        ahorro = hectareas * COSTO_FERTILIZANTE_HA
        self.ahorro += ahorro
        self.mensajes.append(f"Ahorro detectado: ${ahorro:.2f} USD por evitar el lavado de fertilizante.")
        self.historial.append((datetime.now(), "lavado", ahorro))

    def registrar_ahorro_deriva(self, producto_usd: float):
        ahorro = producto_usd * EFICIENCIA_DERIVA
        self.ahorro += ahorro
        self.mensajes.append(f"Ahorro detectado: ${ahorro:.2f} USD en producto que no se desperdició en el aire.")
        self.historial.append((datetime.now(), "deriva", ahorro))

    def registrar_multa_evitable(self, tipo: str):
        multa = MULTA_LABORAL if tipo == "laboral" else MULTA_LICENCIA
        self.perdida_evitada += multa
        self.mensajes.append(f"Riesgo mitigado: Se evitó una posible sanción de ${multa:.2f} USD.")
        self.historial.append((datetime.now(), tipo, multa))

    def reporte_mensual(self) -> str:
        total = self.ahorro + self.perdida_evitada
        return f"Este mes has protegido: ${total:.2f} USD\n" + "\n".join(self.mensajes)

    def exportar_historial(self, ruta: str):
        with open(ruta, "w", encoding="utf-8") as f:
            for fecha, tipo, valor in self.historial:
                f.write(f"{fecha:%Y-%m-%d %H:%M}, {tipo}, ${valor:.2f}\n")

def calcular_ahorro_lavado_insumos(hectareas: float, costo_fertilizante_ha: float = COSTO_FERTILIZANTE_HA) -> str:
    ahorro = hectareas * costo_fertilizante_ha
    return f"Ahorro detectado: ${ahorro:.2f} USD por evitar el lavado de fertilizante."

def calcular_ahorro_deriva(producto_usd: float, eficiencia_deriva: float = EFICIENCIA_DERIVA) -> str:
    ahorro = producto_usd * eficiencia_deriva
    return f"Ahorro detectado: ${ahorro:.2f} USD en producto que no se desperdició en el aire."
