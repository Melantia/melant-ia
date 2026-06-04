# Curso Práctico de Postcosecha y Empaque de Plátano Barraganete
# Escuela de Campo MELANTIA — Acceso libre y gratuito

CURSO = {
    "titulo": "Curso Práctico de Postcosecha y Empaque de Plátano Barraganete",
    "descripcion": "Entrenamiento gratuito para operarios, técnicos y productores sobre los pasos críticos para exportar fruta de calidad.",
    "modulos": [
        {
            "nombre": "Módulo 1: El punto de corte y calibre",
            "texto": (
                "El punto de corte es fundamental para la calidad de exportación. "
                "Debes medir el calibre del dedo central de la segunda mano, que debe estar entre 39 y 46 grados (32avos de pulgada). "
                "Utiliza la cinta de color de la semana para identificar la edad del racimo: roja para semana 1, azul para semana 2, verde para semana 3. "
                "Esto permite planificar la cosecha y evitar fruta sobremadura o rechazada."
            )
        },
        {
            "nombre": "Módulo 2: Operación de Cuna",
            "texto": (
                "La operación de cuna consiste en bajar el racimo sin que toque el suelo. "
                "Se requieren dos personas: el puntero y el colero. "
                "El puntero realiza un corte en el pseudotallo y el colero recibe el racimo en una cuna acolchada o garrucha. "
                "Esto previene golpes, manchas de látex y moretones, asegurando la calidad de la fruta."
            )
        },
        {
            "nombre": "Módulo 3: Sanidad en Tina",
            "texto": (
                "En la empacadora, el racimo se desmane y se separan las manos usando cuchillos curvos. "
                "Luego, se realiza el lavado y desleche en tanques con agua y alumbre para eliminar el látex. "
                "El tratamiento de corona se hace con fungicidas o extractos cítricos para evitar pudrición. "
                "Finalmente, se etiqueta y se empaca en cajas de 50 libras con protectores de polietileno."
            )
        },
        {
            "nombre": "Módulo 4: Estándar de Caja y Defectos",
            "texto": (
                "El estándar de caja exige acomodar los clústeres de manera que no se maltraten durante el viaje. "
                "Los principales defectos de rechazo son: cicatriz de roce, daño de thrips, dedo corto, punta de cigarro, manchas de látex, moretones y cuello roto. "
                "Consulta la tabla de defectos para saber qué se acepta y qué se rechaza. "
                "El registro y la trazabilidad son clave para cumplir con las Buenas Prácticas Agrícolas."
            )
        }
    ],
    "certificado": "Al finalizar el curso, puedes solicitar tu certificado digital gratuito emitido por la Escuela de Campo MELANTIA."
}

def mostrar_contenido():
    print(f"\n{CURSO['titulo']}\n{CURSO['descripcion']}\n")
    for i, modulo in enumerate(CURSO['modulos'], 1):
        print(f"{modulo['nombre']}")
        print(f"  {modulo['texto']}\n")
    print(f"{CURSO['certificado']}")

def leer_modulo_en_voz_alta(indice):
    """Lee en voz alta el módulo seleccionado usando pyttsx3."""
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    texto = CURSO['modulos'][indice]['texto']
    print(f"Leyendo: {CURSO['modulos'][indice]['nombre']}")
    engine.say(texto)
    engine.runAndWait()

if __name__ == "__main__":
    mostrar_contenido()
    print("\n¿Quieres escuchar un módulo en voz alta? Ingresa el número (1-4) o 0 para salir.")
    try:
        while True:
            opcion = int(input("Módulo: "))
            if opcion == 0:
                break
            if 1 <= opcion <= 4:
                leer_modulo_en_voz_alta(opcion-1)
            else:
                print("Opción no válida.")
    except Exception:
        print("Finalizado.")
# Curso Práctico de Entrenamiento en Postcosecha de Plátano Barraganete
# Escuela de Campo MELANTIA — Acceso libre y gratuito

CURSO = {
    "titulo": "Curso Práctico de Postcosecha y Empaque de Plátano Barraganete",
    "descripcion": "Entrenamiento gratuito para operarios, técnicos y productores sobre los pasos críticos para exportar fruta de calidad.",
    "modulos": [
        {
            "nombre": "Manejo del Enfundado",
            "temas": [
                "Momento y técnica de enfunde",
                "Tipos de fundas y repelentes",
                "Cintado y calendario de colores"
            ]
        },
        {
            "nombre": "Cosecha y Transporte",
            "temas": [
                "Calibración y corte seguro",
                "Uso de cunas y garruchas",
                "Prevención de daños físicos"
            ]
        },
        {
            "nombre": "Postcosecha en Empacadora",
            "temas": [
                "Desmane y saneo",
                "Lavado y desleche",
                "Tratamiento de corona y empaque"
            ]
        },
        {
            "nombre": "Control de Calidad y Defectos",
            "temas": [
                "Principales defectos y criterios de rechazo",
                "Registro y trazabilidad",
                "Buenas Prácticas Agrícolas (BPA)"
            ]
        },
        {
            "nombre": "Simulador de Evaluación",
            "temas": [
                "Preguntas de opción múltiple",
                "Casos prácticos de clasificación de fruta"
            ]
        }
    ],
    "certificado": "Al finalizar el curso, puedes solicitar tu certificado digital gratuito emitido por la Escuela de Campo MELANTIA."
}

def mostrar_contenido():
    print(f"\n{CURSO['titulo']}\n{CURSO['descripcion']}\n")
    for i, modulo in enumerate(CURSO['modulos'], 1):
        print(f"Módulo {i}: {modulo['nombre']}")
        for tema in modulo['temas']:
            print(f"  - {tema}")
    print(f"\n{CURSO['certificado']}")

if __name__ == "__main__":
    mostrar_contenido()
