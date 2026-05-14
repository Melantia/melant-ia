# Visor interactivo de cultivos y amenazas fitosanitarias para MELANT IA
# Requiere: pip install rich
import json
from rich.console import Console
from rich.table import Table

ARCHIVO = "cultivos_ecuador_extendido.json"
console = Console()

def mostrar_cultivos(data):
    table = Table(title="Cultivos registrados en Ecuador")
    table.add_column("#", justify="right")
    table.add_column("Cultivo")
    table.add_column("Especie")
    for i, c in enumerate(data["cultivos_ecuador"], 1):
        table.add_row(str(i), c["nombre"], c["especie"])
    console.print(table)

def mostrar_amenazas(cultivo):
    table = Table(title=f"Amenazas para {cultivo['nombre']}")
    table.add_column("Tipo")
    table.add_column("Nombre")
    table.add_column("Control biológico")
    table.add_column("Imagen")
    for tipo in ["plagas", "enfermedades"]:
        for a in cultivo["amenazas"].get(tipo, []):
            table.add_row(tipo.capitalize(), a["nombre"], a["control_biologico"], a["imagen"])
    console.print(table)

def main():
    with open(ARCHIVO, encoding="utf-8") as f:
        data = json.load(f)
    mostrar_cultivos(data)
    idx = console.input("\nSelecciona el número de cultivo para ver detalles: ")
    try:
        idx = int(idx) - 1
        cultivo = data["cultivos_ecuador"][idx]
        mostrar_amenazas(cultivo)
    except Exception:
        console.print("[red]Selección inválida.[/red]")

if __name__ == "__main__":
    main()
