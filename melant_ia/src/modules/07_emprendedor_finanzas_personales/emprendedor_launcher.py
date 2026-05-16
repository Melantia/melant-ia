# Lógica de activación y acompañamiento del módulo Emprendedor
import json
import os

PERFIL_USUARIO_PATH = os.path.join(os.path.dirname(__file__), '../../data/perfil_usuario.json')
EMPRENDEDOR_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'emprendedor_config.json')

# Verifica si el usuario tiene un emprendimiento activo
def usuario_es_emprendedor():
    with open(PERFIL_USUARIO_PATH, encoding='utf-8') as f:
        perfil = json.load(f)
    return perfil.get('registro_inicial', {}).get('es_emprendedor', False)

# Flujo de acompañamiento integral
def activar_modulo_emprendedor():
    if not usuario_es_emprendedor():
        print("El usuario no ha activado la opción de emprendimiento.")
        return
    with open(EMPRENDEDOR_CONFIG_PATH, encoding='utf-8') as f:
        config = json.load(f)
    print("Bienvenido al Módulo Emprendedor MELANTIA!")
    print("1. Portafolio de Producto Estrella: hasta 4 productos, PDF+QR, WhatsApp, impresión.")
    print("2. Agenda de Ferias/Eventos: información filtrada por ubicación, recordatorios.")
    print("3. Simulador de Precio Real: Angel te ayuda a calcular el valor justo.")
    print("4. Asistente de Negociación: frases ganadoras, voces, motivación.")
    print("5. Asesoría Legal: Dr. Pablo te orienta en requisitos para Registro Sanitario y marca.")
    # Aquí puedes lanzar las pantallas o flujos correspondientes
    # Ejemplo: mostrar_portafolio(), mostrar_agenda_ferias(), etc.

# Ejemplo de integración
if __name__ == '__main__':
    activar_modulo_emprendedor()
