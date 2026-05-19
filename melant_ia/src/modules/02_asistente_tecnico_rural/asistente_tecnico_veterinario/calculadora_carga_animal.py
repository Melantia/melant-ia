_fuente_ = "Manual de Pasturas INIAP 2024"

def obtener_recomendacion(superficie, clima):
    valor_base = superficie * 1.5  # Ejemplo simple
    if clima == "seco":
        return {
            "ideal": valor_base * 0.8,
            "maximo": valor_base,
            "nota_humana": "Debido a la sequía, te sugiero no sobrecargar el potrero para que el pasto se recupere pronto."
        }
    return {
        "ideal": valor_base,
        "maximo": valor_base * 1.2,
        "nota_humana": "Con este clima, tus animales estarán muy cómodos."
    }
"""
Calculadora de Carga Animal - Ganado Vacuno

Pide:
1) tamano del potrero en hectareas
2) tipo de pasto

Entrega una recomendacion conservadora de cuantas vacas adultas
puede soportar el potrero sin degradar el suelo.
"""

from __future__ import annotations

import math

# Produccion anual estimada de materia seca por hectarea (kg MS/ha/ano)
PASTO_MS_ANUAL = {
    "brachiaria brizantha": 12000,
    "brachiaria decumbens": 9500,
    "pasto estrella": 14500,
    "kikuyo": 16000,
    "ryegrass": 13000,
    "angleton": 11000,
    "sabana natural": 7000,
}

# Requerimiento de una vaca adulta equivalente (kg de MS por dia)
MS_DIARIA_VACA = 12.0

# Factores conservadores para no degradar el suelo
FACTOR_UTILIZACION_PASTO = 0.45
FACTOR_PROTECCION_SUELO = 0.85


def calcular_carga_animal(area_ha: float, tipo_pasto: str) -> tuple[int, float]:
    if area_ha <= 0:
        raise ValueError("El tamano del potrero debe ser mayor a 0.")

    pasto_key = tipo_pasto.strip().lower()
    if pasto_key not in PASTO_MS_ANUAL:
        pastos_validos = ", ".join(sorted(PASTO_MS_ANUAL.keys()))
        raise ValueError(f"Tipo de pasto no reconocido. Opciones: {pastos_validos}")

    ms_anual_ha = PASTO_MS_ANUAL[pasto_key]

    ms_disponible_total = (
        area_ha
        * ms_anual_ha
        * FACTOR_UTILIZACION_PASTO
        * FACTOR_PROTECCION_SUELO
    )

    requerimiento_anual_vaca = MS_DIARIA_VACA * 365
    capacidad_float = ms_disponible_total / requerimiento_anual_vaca

    capacidad_recomendada = math.floor(capacidad_float)
    return capacidad_recomendada, capacidad_float


def mostrar_pastos() -> None:
    print("\nTipos de pasto disponibles:")
    for idx, nombre in enumerate(sorted(PASTO_MS_ANUAL.keys()), start=1):
        print(f"  {idx}. {nombre}")


def main() -> None:
    print("=== Calculadora de Carga Animal (Bovinos) ===")
    print("Recomendacion conservadora para proteger el suelo y el pasto.")

    try:
        area_texto = input("\nIngrese el tamano del potrero en hectareas: ").strip()
        area_ha = float(area_texto)

        mostrar_pastos()
        tipo_pasto = input("\nIngrese el tipo de pasto (escriba el nombre): ").strip()

        capacidad_entera, capacidad_real = calcular_carga_animal(area_ha, tipo_pasto)

        print("\n--- Resultado ---")
        print(f"Potrero: {area_ha:.2f} ha")
        print(f"Pasto: {tipo_pasto}")
        print(f"Capacidad tecnica estimada: {capacidad_real:.2f} vacas equivalentes")
        print(f"Recomendacion sin degradar suelo: {capacidad_entera} vacas adultas")

        if capacidad_entera <= 0:
            print(
                "Advertencia: con este tamano y tipo de pasto, "
                "se recomienda no cargar vacas adultas permanentes."
            )

    except ValueError as exc:
        print(f"\nError: {exc}")


if __name__ == "__main__":
    main()
