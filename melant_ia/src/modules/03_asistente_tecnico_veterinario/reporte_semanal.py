import os
import json
from collections import Counter

def generar_ranking_empleados(especie):
    ruta = f"src/storage/trazabilidad/{especie}/alertas/"
    empleados_alertas = []

    for archivo in os.listdir(ruta):
        if archivo.endswith(".json"):
            with open(os.path.join(ruta, archivo), 'r') as f:
                data = json.load(f)
                empleados_alertas.append(data["empleado_reporta"])

    ranking = Counter(empleados_alertas)
    print(f"--- RANKING DE CUIDADO: {especie.upper()} ---")
    for nombre, total in ranking.items():
        print(f"Empleado: {nombre} | Alertas detectadas: {total}")

# generar_ranking_empleados("porcinos")