from datetime import datetime

TAREAS = [
    "Verificar que todos los pediluvios estén llenos y con la dosis correcta de amonio cuaternario (2000 ppm).",
    "Registrar en la bitácora cada ingreso de persona o vehículo a la finca.",
    "Inspeccionar semanalmente plantas con síntomas de amarillamiento en forma de 'falda'.",
    "Revisar que todas las herramientas sean desinfectadas entre planta y planta.",
    "Asegurar que no ingresen semillas ni herramientas de origen externo sin desinfección.",
    "Supervisar que la carga de fruta se realice fuera de la zona de cultivo.",
    "Revisar que la cerca perimetral esté cerrada y sin accesos no autorizados.",
    "Notificar cualquier planta sospechosa a Agrocalidad (1800 247 622) y aislarla inmediatamente.",
]

def generar_lista_tareas():
    fecha = datetime.now().strftime("%Y-%m-%d")
    print(f"\n📝 Lista de Tareas Diarias — Fusarium R4T ({fecha})\n")
    for i, tarea in enumerate(TAREAS, 1):
        print(f"{i}. {tarea}")

if __name__ == "__main__":
    generar_lista_tareas()
