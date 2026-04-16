import sqlite3
import base64
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Configuración
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# --- CONFIGURACIÓN BASE DE DATOS ---
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    crop_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    image_data BLOB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    conn.commit()
    conn.close()

# Inicializar BD al arrancar
init_db()

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# --- RUTAS ---

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Sirve el Frontend HTML"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/v1/reports")
async def create_report(
    crop_type: str = Form(...),
    status: str = Form(...),
    image: UploadFile = File(...)
):
    """
    API: Recibe el reporte, guarda la imagen en SQLite como BLOB.
    """
    # Leer imagen en memoria
    image_bytes = await image.read()
    
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO reports (crop_type, status, image_data) VALUES (?, ?, ?)",
        (crop_type, status, image_bytes)
    )
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Datos guardados exitosamente"}

@app.get("/api/v1/reports")
async def get_reports():
    """
    API: Obtiene reportes para el Dashboard.
    Convierte BLOB a Base64 para enviar al Frontend.
    """
    conn = get_db_connection()
    # Limitamos a los últimos 20 para no saturar el navegador
    rows = conn.execute("SELECT * FROM reports ORDER BY id DESC LIMIT 20").fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        img_base64 = base64.b64encode(row['image_data']).decode('utf-8')
        reports.append({
            "id": row['id'],
            "crop_type": row['crop_type'],
            "status": row['status'],
            "timestamp": row['created_at'],
            "image": f"data:image/jpeg;base64,{img_base64}"
        })
    return reports

@app.get("/api/v1/stats")
async def get_stats():
    """API: Métricas rápidas"""
    conn = get_db_connection()
    total = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
    alerts = conn.execute("SELECT COUNT(*) FROM reports WHERE status IN ('Plagas', 'Sequia')").fetchone()[0]
    conn.close()
    return {"total": total, "alerts": alerts}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Servidor Melianta funcionando en http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)