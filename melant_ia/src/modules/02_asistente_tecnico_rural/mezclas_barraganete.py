import openpyxl

# Datos de referencia para mezcla física (por hectárea)
# Valores ejemplo, puedes ajustarlos según tu análisis de suelo y meta
REQUERIMIENTOS = {
    "N": 180,   # kg/ha/año
    "P2O5": 40, # kg/ha/año
    "K2O": 500, # kg/ha/año
    "MgO": 70   # kg/ha/año
}
FERTILIZANTES = {
    "Urea": {"N": 46, "P2O5": 0, "K2O": 0, "MgO": 0},
    "DAP": {"N": 18, "P2O5": 46, "K2O": 0, "MgO": 0},
    "Muriato de Potasio": {"N": 0, "P2O5": 0, "K2O": 60, "MgO": 0},
    "Sulfato de Magnesio": {"N": 0, "P2O5": 0, "K2O": 0, "MgO": 16}
}

# Cálculo simple para mezcla física
# (No optimiza, solo reparte por orden de nutrientes)
def calcular_mezcla():
    # Inicializar cantidades
    cantidades = {f: 0 for f in FERTILIZANTES}
    # 1. Urea para N
    cantidades["Urea"] = REQUERIMIENTOS["N"] / FERTILIZANTES["Urea"]["N"] * 100
    # 2. DAP para P2O5
    cantidades["DAP"] = REQUERIMIENTOS["P2O5"] / FERTILIZANTES["DAP"]["P2O5"] * 100
    # 3. Muriato de Potasio para K2O
    cantidades["Muriato de Potasio"] = REQUERIMIENTOS["K2O"] / FERTILIZANTES["Muriato de Potasio"]["K2O"] * 100
    # 4. Sulfato de Magnesio para MgO
    cantidades["Sulfato de Magnesio"] = REQUERIMIENTOS["MgO"] / FERTILIZANTES["Sulfato de Magnesio"]["MgO"] * 100
    return cantidades

def exportar_a_excel(ruta):
    cantidades = calcular_mezcla()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Mezcla Barraganete"
    ws.append(["Fertilizante", "Cantidad (kg/ha/año)"])
    for fert, kg in cantidades.items():
        ws.append([fert, round(kg, 2)])
    wb.save(ruta)
    print(f"Archivo Excel guardado en: {ruta}")

if __name__ == "__main__":
    exportar_a_excel("tabla_mezclas_barraganete.xlsx")
