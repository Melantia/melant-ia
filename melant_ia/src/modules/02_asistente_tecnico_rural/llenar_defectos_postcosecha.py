import openpyxl

def crear_defectos_excel(ruta):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Defectos Postcosecha"
    ws.append(["Defecto", "Descripción", "¿Rechazo?", "Recomendación"])
    datos = [
        ["Mancha de látex", "Manchas oscuras causadas por el látex al cortar el racimo.", "Sí", "Evitar golpes y limpiar con agua y alumbre inmediatamente."],
        ["Moretones", "Daño físico por golpes durante la cosecha o transporte.", "Sí", "Usar cunas acolchadas y manipular con cuidado."],
        ["Dedos deformes", "Fruta con formas anormales, dedos dobles o cortos.", "Sí", "Eliminar durante el saneo en empacadora."],
        ["Pudrición de corona", "Descomposición en el extremo del racimo.", "Sí", "Aplicar fungicida o extracto cítrico en la corona."],
        ["Fruta sobremadura", "Color amarillo o manchas de madurez avanzada.", "Sí", "Cosechar en el punto óptimo y evitar demoras."],
        ["Residuos de pesticida", "Presencia de residuos visibles o mal olor químico.", "Sí", "Cumplir con los periodos de carencia y lavar bien la fruta."],
        ["Cáscara rota", "Corte o rotura en la piel del plátano.", "Sí", "Manipular con cuidado y revisar fundas antes de empaque."],
        ["Manchas superficiales leves", "Manchas menores que no afectan la calidad interna.", "No", "Se acepta si no afecta la presentación general."]
    ]
    for fila in datos:
        ws.append(fila)
    wb.save(ruta)
    print(f"Archivo Excel de defectos guardado en: {ruta}")

if __name__ == "__main__":
    crear_defectos_excel("defectos_postcosecha.xlsx")
