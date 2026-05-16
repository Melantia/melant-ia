# Lógica para registrar y reordenar módulos según frecuencia de uso
import json
import os

MODULOS_PATH = os.path.join(os.path.dirname(__file__), '../data/modulos_usuario.json')

def cargar_modulos_usuario():
    with open(MODULOS_PATH, encoding='utf-8') as f:
        return json.load(f)["modulos"]

def guardar_modulos_usuario(modulos):
    with open(MODULOS_PATH, 'w', encoding='utf-8') as f:
        json.dump({"modulos": modulos}, f, ensure_ascii=False, indent=2)

def registrar_uso_modulo(id_modulo):
    modulos = cargar_modulos_usuario()
    for modulo in modulos:
        if modulo["id"] == id_modulo:
            modulo["frecuencia_uso"] = modulo.get("frecuencia_uso", 0) + 1
            break
    guardar_modulos_usuario(modulos)
    return modulos

def reordenar_modulos():
    modulos = cargar_modulos_usuario()
    modulos_ordenados = sorted(modulos, key=lambda x: x.get("frecuencia_uso", 0), reverse=True)
    return modulos_ordenados

# Ejemplo de uso:
if __name__ == "__main__":
    registrar_uso_modulo(6)  # Simula que el usuario entra a "Negocios Rurales"
    registrar_uso_modulo(4)  # Simula que entra a "Agricultura Digital"
    registrar_uso_modulo(6)
    print(reordenar_modulos())
