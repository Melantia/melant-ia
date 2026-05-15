import json
import os

from datetime import datetime

class TrazabilidadManager:
    def __init__(self, finca_json_path):
        with open(finca_json_path, 'r', encoding='utf-8') as f:
            self.finca = json.load(f)

    def cargar_fases_cultivo(self, cultivo):
        info = self.finca['trazabilidad'].get(cultivo)
        if not info:
            print(f"No hay trazabilidad para {cultivo}")
            return []
        archivo = info['archivo']
        ruta = os.path.join(os.path.dirname(__file__), archivo)
        with open(ruta, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data['fases']

    def mostrar_fases(self, cultivo):
        fases = self.cargar_fases_cultivo(cultivo)
        print(f"Fases de trazabilidad para {cultivo} en {self.finca['nombre']}:")
        for fase in fases:
            estado = fase.get('estado', '-')
            print(f"- {fase['paso']}. {fase['titulo']} [{estado}]\n  Detalles: {', '.join(fase['detalles'])}")

    def actualizar_estado_fase(self, cultivo, paso, nuevo_estado):
        info = self.finca['trazabilidad'].get(cultivo)
        if not info:
            print(f"No hay trazabilidad para {cultivo}")
            return
        archivo = info['archivo']
        ruta = os.path.join(os.path.dirname(__file__), archivo)
        with open(ruta, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for fase in data['fases']:
            if fase['paso'] == paso:
                fase['estado'] = nuevo_estado
                break
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Fase {paso} de {cultivo} actualizada a '{nuevo_estado}'")

    def exportar_fases_a_evidencia(self, cultivo, evidencia_path):
        fases = self.cargar_fases_cultivo(cultivo)
        evidencia = {
            "finca": self.finca['nombre'],
            "cultivo": cultivo,
            "fecha_exportacion": datetime.now().isoformat(),
            "fases": fases
        }
        with open(evidencia_path, 'w', encoding='utf-8') as f:
            json.dump(evidencia, f, ensure_ascii=False, indent=2)
        print(f"Evidencia exportada a {evidencia_path}")

# Ejemplo de uso:
# manager = TrazabilidadManager('data/finca_ejemplo.json')
# manager.actualizar_estado_fase('cafe', 2, 'completado')
# manager.exportar_fases_a_evidencia('cafe', 'data/evidencia_cafe.json')
