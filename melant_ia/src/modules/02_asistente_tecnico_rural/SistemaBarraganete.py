import json
import os

class SistemaBarraganete:
    def __init__(self):
        # Carga los datos estructurados al iniciar (Modo Offline)
        with open('config_cultivo.json', 'r', encoding='utf-8') as f:
            self.datos = json.load(f)
        self.doc_path = "memoria_ia.md"

    def consulta_rapida(self, categoria, item):
        """Devuelve datos exactos del JSON"""
        return self.datos.get(categoria, {}).get(item, "Dato no encontrado")

    def consultar_ia_local(self):
        """Instrucción para que abras el archivo MD y la IA lo procese"""
        print(f"📖 Abre {self.doc_path} en tu editor y usa @ para que la IA lo analice.")
        os.startfile(self.doc_path) # Abre el archivo automáticamente

if __name__ == "__main__":
    app = SistemaBarraganete()
    # Ejemplo: Consultar precio de sustentación
    precio = app.consulta_rapida("exportacion", "precio_pms_2026")
    print(f"💰 Precio Oficial: ${precio}")
