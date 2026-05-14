"""
MELANT IA - Gestion Sanitaria y Nutricion de Precision (Ganado Vacuno)

Incluye:
1) Alertas de vacunacion (Aftosa, Brucelosis, Triple) con aviso 7 dias antes.
2) Formula de pago de leche con enfoque en Brown Swiss (bono por grasa/proteina).

Uso rapido:
    python gestion_sanitaria.py
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, Tuple


DATE_FMT = "%Y-%m-%d"
ALERT_DAYS_BEFORE = 7

# Intervalos por defecto (dias)
VACCINE_INTERVALS: Dict[str, int] = {
    "aftosa": 180,
    "brucelosis": 365,
    "triple": 180,
}


@dataclass
class VaccineSchedule:
    vacuna: str
    ultima_fecha: date
    proxima_fecha: date
    dias_restantes: int
    alerta_activa: bool
    mensaje: str


def parse_date(value: str) -> date:
    return datetime.strptime(value.strip(), DATE_FMT).date()


def calcular_proxima_vacuna(
    vacuna: str,
    ultima_fecha: date,
    hoy: date | None = None,
    intervalos: Dict[str, int] | None = None,
) -> VaccineSchedule:
    if hoy is None:
        hoy = date.today()

    nombre = vacuna.strip().lower()
    source = intervalos or VACCINE_INTERVALS
    if nombre not in source:
        validas = ", ".join(sorted(source.keys()))
        raise ValueError(f"Vacuna no valida: {vacuna}. Opciones: {validas}")

    proxima = ultima_fecha + timedelta(days=source[nombre])
    dias_restantes = (proxima - hoy).days
    alerta = dias_restantes <= ALERT_DAYS_BEFORE

    if dias_restantes < 0:
        mensaje = f"Vacuna vencida hace {abs(dias_restantes)} dias. Aplicar de inmediato."
    elif alerta:
        mensaje = f"Alerta: faltan {dias_restantes} dias para la vacuna de {nombre}."
    else:
        mensaje = f"Sin alerta. Proxima vacuna de {nombre} en {dias_restantes} dias."

    return VaccineSchedule(
        vacuna=nombre,
        ultima_fecha=ultima_fecha,
        proxima_fecha=proxima,
        dias_restantes=dias_restantes,
        alerta_activa=alerta,
        mensaje=mensaje,
    )


def calcular_precio_leche(
    litros: float,
    precio_base_por_litro: float,
    raza: str,
    grasa_pct: float,
    proteina_pct: float,
    bono_grasa_por_punto: float = 0.05,
    bono_proteina_por_punto: float = 0.03,
    base_grasa_ref: float = 3.5,
    base_proteina_ref: float = 3.2,
) -> Tuple[float, Dict[str, float]]:
    """
    Formula base:
        precio = (litros * base) + bono_grasa + bono_proteina

    Reglas:
    - Brown Swiss: prioriza calidad, aplica bonos completos por grasa/proteina.
    - Girolando: prioriza volumen/persistencia, bonos a la mitad.
    - Otras razas: aplica base sin bonificacion adicional.
    """

    if litros < 0 or precio_base_por_litro < 0:
        raise ValueError("Litros y precio base deben ser >= 0")

    raza_n = raza.strip().lower()
    base = litros * precio_base_por_litro

    exceso_grasa = max(0.0, grasa_pct - base_grasa_ref)
    exceso_proteina = max(0.0, proteina_pct - base_proteina_ref)

    if "brown" in raza_n and "swiss" in raza_n:
        factor_bono = 1.0
    elif "girolando" in raza_n:
        factor_bono = 0.5
    else:
        factor_bono = 0.0

    bono_grasa = litros * exceso_grasa * bono_grasa_por_punto * factor_bono
    bono_proteina = litros * exceso_proteina * bono_proteina_por_punto * factor_bono

    total = base + bono_grasa + bono_proteina
    detalle = {
        "base": round(base, 2),
        "bono_grasa": round(bono_grasa, 2),
        "bono_proteina": round(bono_proteina, 2),
        "total": round(total, 2),
    }
    return total, detalle


def _run_cli() -> None:
    print("=== MELANT IA | Gestion Sanitaria y Pago de Leche ===")

    vacuna = input("Vacuna (aftosa/brucelosis/triple): ").strip().lower()
    fecha_txt = input("Fecha de ultima vacuna (YYYY-MM-DD): ").strip()
    ultima = parse_date(fecha_txt)

    prog = calcular_proxima_vacuna(vacuna, ultima)
    print("\n--- Resultado sanitario ---")
    print(f"Vacuna: {prog.vacuna}")
    print(f"Ultima fecha: {prog.ultima_fecha}")
    print(f"Proxima fecha: {prog.proxima_fecha}")
    print(f"Dias restantes: {prog.dias_restantes}")
    print(f"Alerta activa (7 dias antes): {'SI' if prog.alerta_activa else 'NO'}")
    print(f"Mensaje: {prog.mensaje}")

    print("\n--- Calculador de calidad de leche ---")
    raza = input("Raza (Brown Swiss/Girolando/Otra): ").strip()
    litros = float(input("Litros entregados: ").strip())
    precio_base = float(input("Precio base por litro: ").strip())
    grasa = float(input("Grasa (%): ").strip())
    proteina = float(input("Proteina (%): ").strip())

    total, detalle = calcular_precio_leche(
        litros=litros,
        precio_base_por_litro=precio_base,
        raza=raza,
        grasa_pct=grasa,
        proteina_pct=proteina,
    )

    print("\nPago estimado")
    print(f"Base: {detalle['base']:.2f}")
    print(f"Bono grasa: {detalle['bono_grasa']:.2f}")
    print(f"Bono proteina: {detalle['bono_proteina']:.2f}")
    print(f"TOTAL: {total:.2f}")


if __name__ == "__main__":
    _run_cli()
