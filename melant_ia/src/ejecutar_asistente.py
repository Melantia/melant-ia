rom src.modules.asistente_tecnico_rural.voz_asistente import AsistenteVoz
from ultralytics import YOLO

def iniciar_sistema():
    print("Iniciando IA Agronómica...")
    voz = AsistenteVoz()
    voz.decir("Sistema iniciado. Buscando plagas en el cultivo.")
    
    # Esto descargará automáticamente un modelo pequeño para probar
    modelo = YOLO('yolov8n.pt') 
    modelo.predict(source="0", show=True, conf=0.5)

if _name_ == "_main_":
    iniciar_sistema()