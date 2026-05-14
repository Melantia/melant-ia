from flask import Flask, request, send_file, jsonify
import sqlite3
import os
from generar_reporte_institucional import generar_reporte_institucional

app = Flask(__name__)
DB_PATH = 'melant_dashboard.db'
LOGO_PATH = os.path.join('assets', 'logo_melant_ia.png')

@app.route('/api/generar_reporte', methods=['POST'])
def api_generar_reporte():
    # Opcional: recibir filtros desde el frontend
    # filtros = request.json.get('filtros', {})
    # 1. Extraer datos aprobados de la base
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT provincia, canton, productor FROM informes WHERE estado = "aprobado"')
    rows = c.fetchall()
    conn.close()
    # 2. Clasificar jerárquicamente
    datos = {}
    for provincia, canton, productor in rows:
        datos.setdefault(provincia, {}).setdefault(canton, []).append(productor)
    # 3. Generar PDF
    nombre_pdf = 'reporte_institucional_melant.pdf'
    generar_reporte_institucional(datos, nombre_pdf, logo_path=LOGO_PATH)
    # 4. Enviar PDF al frontend
    return send_file(nombre_pdf, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
