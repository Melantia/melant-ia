# server.py
import os
import sqlite3
import uvicorn
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Cargar configuración segura
load_dotenv()
API_KEY = os.getenv("API_KEY")
DB_NAME = os.getenv("DB_NAME", "agricloud.db")
API_KEY_HEADER = APIKeyHeader(name="X-API-KEY")

app = FastAPI(title="Agricloud API")

# --- 1. CONFIGURACIÓN BASE DE DATOS (SQLite) ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    crop_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    image_blob BLOB,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    image_size_kb INTEGER
                )''')
    conn.commit()
    conn.close()

init_db()

# --- 2. MODELOS Y SEGURIDAD ---
class ReportModel(BaseModel):
    crop_type: str
    status: str

# Asegúrate de que 'String' esté importado de sqlalchemy
from sqlalchemy import Column, Integer, String 

class ReportModel(Base):
    _tablename_ = "reports"

    id = Column(Integer, primary_key=True, index=True) # Este es el que ya tienes
    
    # AGREGA ESTA LÍNEA:
    id_celular = Column(String, nullable=True, index=True)

    local_id = Column(String, index=True) # El UUID del celular
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    if api_key != API_KEY:
        raise HTTPException(
            detail="Clave API inválida"
            crop_type = Column(String)
            status = Column(String)
    image_data = Column(LargeBinary)
        )
    return api_key

# CORS para permitir que la App Python se conecte
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. ENDPOINTS DE LA API ---

@app.post("/api/v1/reports")
async def create_report(
    crop_type: str = Form(...),
    status: str = Form(...),
    image: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Recibe el reporte del campo, guarda la imagen en SQLite.
    """
    try:
        # Leer contenido de la imagen
        image_data = await image.read()
        size_kb = round(len(image_data) / 1024, 2)

        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO reports (crop_type, status, image_blob, image_size_kb) VALUES (?, ?, ?, ?)",
                  (crop_type, status, image_data, size_kb))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Reporte guardado en servidor"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/stats")
async def get_stats(api_key: str = Depends(verify_api_key)):
    """
    Devuelve métricas para el Dashboard.
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("SELECT COUNT(*) FROM reports")
    total = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM reports WHERE status IN ('Plagas', 'Sequia')")
    alerts = c.fetchone()[0]
    
    # Cultivo top
    c.execute("SELECT crop_type, COUNT(*) as cnt FROM reports GROUP BY crop_type ORDER BY cnt DESC LIMIT 1")
    top_crop_raw = c.fetchone()
    top_crop = top_crop_raw[0] if top_crop_raw else "Ninguno"
    
    conn.close()
    return {"total": total, "alerts": alerts, "top_crop": top_crop}

@app.get("/api/v1/reports")
async def get_reports(limit: int = 10, api_key: str = Depends(verify_api_key)):
    """
    Devuelve los últimos reportes para la tabla del dashboard.
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Para acceder por nombre de columna
    c = conn.cursor()
    c.execute("SELECT * FROM reports ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        # Convertir BLOB a Base64 para enviar al HTML
        import base64
        img_base64 = base64.b64encode(row['image_blob']).decode('utf-8')
        reports.append({
            "id": row['id'],
            "timestamp": row['timestamp'],
            "crop_type": row['crop_type'],
            "status": row['status'],
            "image": f"data:image/jpeg;base64,{img_base64}",
            "size_kb": row['image_size_kb']
        })
    return reports

# --- 4. DASHBOARD (VISTA HTML) ---
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard Agrícola</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f6f8; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
        .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
        .bg-red { background: #e53935; } .bg-green { background: #43a047; } .bg-orange { background: #fb8c00; }
    </style>
</head>
<body>
    <h1>📊 Dashboard Monitoreo</h1>
    <div class="grid">
        <div class="card">
            <h3>Total Reportes</h3>
            <h1 id="total">-</h1>
        </div>
        <div class="card">
            <h3>Alertas Activas</h3>
            <h1 id="alerts" style="color: #e53935">-</h1>
        </div>
        <div class="card">
            <h3>Cultivo Principal</h3>
            <h1 id="topCrop">-</h1>
        </div>
    </div>
    
    <div class="card">
        <h3>Últimos Registros (Base de Datos SQLite)</h3>
        <table>
            <thead>
                <tr>
                    <th>Foto</th>
                    <th>Fecha</th>
                    <th>Cultivo</th>
                    <th>Estado</th>
                    <th>Tamaño</th>
                </tr>
            </thead>
            <tbody id="tableBody"></tbody>
        </table>
    </div>

    <script>
        async function load() {
            const statsRes = await fetch('/api/v1/stats', { headers: { 'X-API-KEY': 'super_secret_agri_key_2024' }});
            const stats = await statsRes.json();
            document.getElementById('total').innerText = stats.total;
            document.getElementById('alerts').innerText = stats.alerts;
            document.getElementById('topCrop').innerText = stats.top_crop;

            const repRes = await fetch('/api/v1/reports', { headers: { 'X-API-KEY': 'super_secret_agri_key_2024' }});
            const reports = await repRes.json();
            
            const tbody = document.getElementById('tableBody');
            reports.forEach(r => {
                let badgeClass = r.status === 'Plagas' || r.status === 'Sequia' ? 'bg-red' : 'bg-green';
                if(r.status === 'Listo') badgeClass = 'bg-orange';
                
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${r.image}"></td>
                        <td>${r.timestamp}</td>
                        <td>${r.crop_type}</td>
                        <td><span class="badge ${badgeClass}">${r.status}</span></td>
                        <td>${r.size_kb} KB</td>
                    </tr>
                `;
            });
        }
        load();
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    return DASHBOARD_HTML

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)