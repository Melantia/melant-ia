# -*- coding: utf-8 -*-
"""
Limpia asistente_veterinario.json:
  - Elimina referencias con ok=false (errores HTTP, conexión, SSL, etc.)
  - Elimina referencias con título "Redirecting" (DOIs con paywall/suscripción)
  - Elimina referencias donde la URL redirigió a una página equivocada
"""
import json

RUTA = r"e:\Desktop\MELANTIA\melant_ia\src\knowledge_seeds\asistente_veterinario.json"

# Archivos donde la URL devolvió contenido de otra página (redireccionamiento incorrecto)
ARCHIVOS_CONTENIDO_INCORRECTO = {
    "Lucas_2020_tipificacion_sistemas_caprinos_UPS",   # devolvió artículo de Quishuar
    "Procampo_paso_a_paso_cuyera_nutricion",           # devolvió artículo de forraje/leche
    "FAO_sanidad_cuyes_cap7_mortalidad_prevencion",    # devolvió índice general FAO, no cap.7
}

def es_valida(ref: dict) -> bool:
    # Eliminar si falló
    if not ref.get("ok", False):
        return False
    # Eliminar si el título indica redirección a paywall
    titulo = ref.get("titulo_web", "").strip().lower()
    if titulo in ("redirecting", ""):
        # titulo vacío y ok=true puede ser página equivocada; verificar resumen
        resumen = ref.get("resumen", "")
        if not resumen or resumen.startswith("[ERROR]") or resumen.startswith("[PDF]"):
            pass  # los PDF con ok=true se conservan
        elif not resumen:
            return False
    if titulo == "redirecting":
        return False
    # Eliminar archivos con contenido incorrecto detectados manualmente
    if ref.get("archivo", "") in ARCHIVOS_CONTENIDO_INCORRECTO:
        return False
    return True

with open(RUTA, "r", encoding="utf-8") as f:
    data = json.load(f)

CATEGORIAS = ["ganado_bovino", "aves", "cerdos", "cabras", "cuyes"]

print(f"\n{'='*55}")
print("  Limpieza de asistente_veterinario.json")
print(f"{'='*55}")

total_antes = 0
total_despues = 0

for cat in CATEGORIAS:
    if cat not in data or "referencias" not in data[cat]:
        continue
    refs = data[cat]["referencias"]
    antes = len(refs)
    data[cat]["referencias"] = [r for r in refs if es_valida(r)]
    despues = len(data[cat]["referencias"])
    eliminadas = antes - despues
    total_antes += antes
    total_despues += despues
    print(f"  {cat:20s}: {antes:>2} → {despues:>2}  ({eliminadas} eliminadas)")

print(f"{'─'*55}")
print(f"  {'TOTAL':20s}: {total_antes:>2} → {total_despues:>2}  ({total_antes - total_despues} eliminadas)")
print(f"{'='*55}\n")

with open(RUTA, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✓ JSON guardado en:\n  {RUTA}\n")

# Mostrar lo que quedó por categoría
print("Referencias válidas conservadas:")
for cat in CATEGORIAS:
    if cat not in data or "referencias" not in data[cat]:
        continue
    print(f"\n  [{cat.upper()}]")
    for r in data[cat]["referencias"]:
        print(f"    ✓ {r['archivo'][:65]}")
