import json
import os

def calcular_fertilizacion(cultivo_nombre, toneladas_esperadas):
    # 1. Cargar los datos offline
    ruta_json = os.path.join(os.path.dirname(__file__), "data_cultivos.json")
    
    with open(ruta_json, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    if cultivo_nombre not in datos["requerimientos"]:
        return "Cultivo no encontrado en la base de datos offline."

    req = datos["requerimientos"][cultivo_nombre]
    
    # 2. Lógica de cálculo (Extracción nutricional)
    n_total = req["N"] * toneladas_esperadas
    p_total = req["P"] * toneladas_esperadas
    k_total = req["K"] * toneladas_esperadas

    # 3. Formatear resultado para el usuario
    resultado = f"""
    📊 PLAN DE FERTILIZACIÓN (Estimado)
    ----------------------------------
    Cultivo: {req['nombre']}
    Meta de Producción: {toneladas_esperadas} Toneladas
    
    Necesidad total de Nutrientes:
    - Nitrógeno (N): {n_total:.2f} kg
    - Fósforo (P): {p_total:.2f} kg
    - Potasio (K): {k_total:.2f} kg
    
    Nota: Consulte con un técnico para ajustar según su análisis de suelo.
    """
    return resultado

# Prueba rápida
if __name__ == "__main__":
    print(calcular_fertilizacion("naranja", 10))
