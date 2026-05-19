class AsistenteAcompañamiento:
    def __init__(self, tipo_produccion):
        self.tipo = tipo_produccion # Ejemplo: 'CRIOLLA' o 'GRANJA'

    def iniciar_guia(self):
        if self.tipo == 'CRIOLLA':
            return {
                "paso_1": "Preparar área de pastoreo con sombra y agua limpia.",
                "alerta_dinero": "Evite pérdidas: El exceso de humedad causa parásitos. Revise el suelo.",
                "trazabilidad": "Suba foto del lote hoy para iniciar seguimiento."
            }
        elif self.tipo == 'GRANJA':
            return {
                "paso_1": "Verificar ventilación y densidad de aves por metro cuadrado.",
                "alerta_dinero": "Pérdida detectada: Si el consumo de agua baja, hay riesgo de enfermedad.",
                "trazabilidad": "Registre mortalidad diaria para ajustar costos."
            }

# El sistema consulta al productor:
# guia = AsistenteAcompañamiento('CRIOLLA')
# print(guia.iniciar_guia())