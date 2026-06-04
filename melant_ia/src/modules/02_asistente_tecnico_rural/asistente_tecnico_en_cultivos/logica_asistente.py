

import json

class AsistenteTecnicoRural:
    def __init__(self):
        # Carga datos técnicos (pH, Riego, Costos)
        with open('datos_suelos_referencia.json', 'r', encoding='utf-8') as f:
            self.datos_tecnicos = json.load(f)
        # Carga datos agronómicos (Luna, Épocas, Plagas)
        with open('data_cultivos.json', 'r', encoding='utf-8') as f:
            self.datos_agronomicos = json.load(f)["cultivos"]

    def buscar_cultivo(self, termino_busqueda):
        """
        Busca coincidencias en la lista de cultivos.
        """
        termino = termino_busqueda.lower()
        # Filtra las llaves del JSON que contienen lo que el usuario escribió
        coincidencias = [c for c in self.datos_tecnicos['cultivos'].keys() if termino in c]
        return coincidencias

    def obtener_comparativa(self, nombre_exacto, hectareas):
        """
        Genera el desglose de costos y técnicas una vez elegido el cultivo.
        """
        cultivo = self.datos_tecnicos['cultivos'].get(nombre_exacto)
        
        if not cultivo:
            return "Cultivo no encontrado."

        # Extraer datos de los dos mundos
        # Si los datos de costos no existen, omitir comparativa
        m_org = cultivo.get('calculos_agricultura', {}).get('organica_regenerativa', {})
        m_qui = cultivo.get('calculos_agricultura', {}).get('convencional', {})
        costo_org = m_org.get('costo_estimado_ha', 0) * hectareas if 'costo_estimado_ha' in m_org else 0
        costo_qui = m_qui.get('costo_estimado_ha', 0) * hectareas if 'costo_estimado_ha' in m_qui else 0
        ahorro = costo_qui - costo_org
        return {
            "cultivo": nombre_exacto.replace("_", " ").title(),
            "area": f"{hectareas} Ha",
            "regenerativo": {
                "inversion": f"${costo_org}",
                "fertilizacion": m_org.get('fertilizacion', ''),
                "plagas": m_org.get('plagas', ''),
                "plus": m_org.get('beneficio_extra', '')
            },
            "quimico": {
                "inversion": f"${costo_qui}",
                "fertilizacion": m_qui.get('fertilizacion', ''),
                "plagas": m_qui.get('plagas', ''),
                "plus": m_qui.get('beneficio_extra', '')
            },
            "mensaje_ahorro": f"¡Optando por lo regenerativo ahorras ${ahorro}!"
        }

    def consulta_integral(self, nombre_cultivo):
        tecnico = self.datos_tecnicos['cultivos'].get(nombre_cultivo)
        agronomico = self.datos_agronomicos.get(nombre_cultivo)
        if tecnico and agronomico:
            return {
                "luna": agronomico.get('calendario_lunar', ''),
                "siembra": agronomico.get('epoca_siembra_recomendada', ''),
                "riego": tecnico.get('riego_mm', ''),
                "ahorro_org": tecnico.get('calculos_agricultura', {}).get('organica_regenerativa', {}).get('costo_estimado_ha', '')
            }
        else:
            return {"error": "Cultivo no encontrado en ambos registros"}


def get_voice_summary():
    """Resumen del módulo Asistente Técnico Rural para el asistente de voz."""
    return (
        "Módulo Técnico Rural activo. "
        "Puedo analizar el pH del suelo según región, calcular planes de riego, "
        "recomendar control de plagas con métodos orgánicos o agroquímicos, "
        "y comparar costos entre agricultura regenerativa y convencional "
        "para cultivos como cacao, plátano, maíz, yuca, maracuyá y más."
    )