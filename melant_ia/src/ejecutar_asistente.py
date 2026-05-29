
# === Servidor FastAPI para integración con frontend ===
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from src.modules.asistente_tecnico_rural.voz_asistente import AsistenteVoz  # Si usas voz, descomenta

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])


@app.get("/analizar")
def ejecutar_ia():
    # print("Iniciando IA Agronómica...")
    # voz = AsistenteVoz()
    # voz.decir("Sistema iniciado. (sin visión artificial offline)")
    # Aquí puedes agregar lógica de diagnóstico simple o simulada
    return {"status": "IA ejecutada", "resultado": "Diagnóstico simulado (sin visión artificial offline)"}

# Para ejecutar: uvicorn ejecutar_asistente:app --reload