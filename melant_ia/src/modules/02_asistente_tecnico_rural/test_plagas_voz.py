# 1. Cargar el modelo YOLO (usamos el nano por ser más rápido)
modelo = YOLO('yolov8n.pt') 
// Archivo eliminado por limpieza de voces innecesarias.
# 2. Iniciar asistente de voz
asistente = AsistenteVoz()
asistente.decir("Sistema de detección de plagas iniciado.")

# 3. Abrir la cámara
cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, frame = cap.read()
    if success:
        # Ejecutar detección
        results = modelo(frame, conf=0.5)
        
        # Si detecta algo, que el asistente lo diga
        for r in results:
            for c in r.boxes.cls:
                nombre = modelo.names[int(c)]
                asistente.decir(f"He detectado un {nombre}")

        # Mostrar en pantalla
        annotated_frame = results[0].plot()
        cv2.imshow("IA Agronómica - El Carmen", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()