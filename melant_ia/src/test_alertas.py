from src.modules.gestion_productiva.gestor_automatico import SistemaAlertasEmpresarial

# 1. Iniciamos el sistema
gestor = SistemaAlertasEmpresarial()

# 2. Simulamos una detección de campo
# Imagina que el trabajador 'Carlos' vio algo raro
resultado = gestor.registrar_alerta_critica(
    especie="porcinos", 
    animal_id="CERDO_01", 
    texto_voz="El animal tiene manchas rojas y no quiere levantarse para comer", 
    ruta_foto="src/storage/trazabilidad/porcinos/fotos/evidencia_test.jpg",
    empleado_nombre="Carlos Andrade"
)

print(resultado["mensaje"])