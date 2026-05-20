# Integración automática del contrato de carbono en el módulo Proyecto Carbono MELANTIA
# Este script debe ser llamado desde el flujo de registro del proyecto carbono
# para generar el PDF, guiar al usuario y asociar la evidencia visual.

from modules.11_evidencias_documentos.generar_contrato_carbono_pdf import generar_contrato_carbono_pdf
import os
from modules.06_proyectos.mensaje_destacado_carbono import mostrar_mensaje_destacado

def bienvenida_proyecto_carbono():
    print("\n=== BIENVENIDA AL PROYECTO DE CAPTURA DE CARBONO ===\n")
    mostrar_mensaje_destacado()
    print("\n¡Comienza tu registro y accede a los beneficios de la agricultura regenerativa y la reforestación!")

def flujo_registro_proyecto_carbono(productor, cedula, lote, proyecto, vigencia, porcentaje, carpeta_destino):
    # 1. Generar el contrato PDF personalizado
    nombre_pdf = f"contrato_carbono_{productor.replace(' ', '_').lower()}.pdf"
    ruta_pdf = os.path.join(carpeta_destino, nombre_pdf)
    generar_contrato_carbono_pdf(productor, cedula, lote, proyecto, vigencia, porcentaje, ruta_pdf)

    # 2. GUÍA: Solicitar al usuario que sostenga su cédula y grabe video/foto de aceptación
    print("\nINSTRUCCIONES PARA EL PRODUCTOR:")
    print("1. Sostenga su cédula frente a la cámara.")
    print("2. Exprese en voz alta: 'Acepto ser parte del Proyecto de Carbono y me comprometo a cumplir los requisitos y seguir las recomendaciones de Fabrizzio en prácticas regenerativas.'")
    print("3. El sistema tomará una foto/video y la asociará a su expediente digital.")
    print("4. Siga las instrucciones en pantalla para registrar evidencias de sus prácticas.")

    # 3. (A implementar) Captura de foto/video y asociación al expediente
    # Aquí se debe integrar el módulo de captura de evidencia fotográfica
    # Ejemplo: gestor_evidencia_fotos.capturar_evidencia(productor, tipo='aceptacion_contrato')
    print("[INFO] Falta integrar la captura automática de foto/video y su registro en el expediente digital.")
    print(f"Contrato PDF generado y listo para firmar: {ruta_pdf}")

# Ejemplo de uso:
# flujo_registro_proyecto_carbono('Juan Pérez', '1234567890', 'Lote 5', 'Proyecto MELANTIA Carbono', 2, 60, 'evidencias/')

# Llamar bienvenida_proyecto_carbono() al iniciar el módulo o flujo de registro
bienvenida_proyecto_carbono()
