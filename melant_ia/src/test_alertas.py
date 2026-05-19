from src.modules.gestion_productiva.gestor_automatico import SistemaAlertasEmpresarial
from utils.supervivencia import verificar_estado_celular, guardar_evidencia_offline

# 1. Iniciamos el sistema
gestor = SistemaAlertasEmpresarial()

# 2. Simulamos una detección de campo
datos_alerta = {
    "especie": "porcinos",
    "animal_id": "CERDO_01",
    "texto_voz": "El animal tiene manchas rojas y no quiere levantarse para comer",
    "ruta_foto": "src/storage/trazabilidad/porcinos/fotos/evidencia_test.jpg",
    "empleado_nombre": "Carlos Andrade"
}

# Antes de procesar, protegemos el celular
if not verificar_estado_celular():
    guardar_evidencia_offline(datos_alerta)
    print("[Don Eloy]: Evidencia guardada en modo offline por batería baja. Se enviará cuando sea seguro.")
else:
    resultado = gestor.registrar_alerta_critica(**datos_alerta)
    print(resultado["mensaje"])