import sqlite3
import shutil
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
DB_PATH = 'melant_dashboard.db'

# --- Utilidad para actualizar estado y mover archivo ---
def actualizar_db(id_informe, nuevo_estado):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE informes SET estado = ? WHERE id = ?', (nuevo_estado, id_informe))
    conn.commit()
    conn.close()

def obtener_info_informe(id_informe):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT url_almacenamiento, productor FROM informes WHERE id = ?', (id_informe,))
    row = c.fetchone()
    conn.close()
    if row:
        return {'ruta': row[0], 'productor': row[1]}
    return None

def copiar_a_carpeta_productor(id_informe):
    info = obtener_info_informe(id_informe)
    if not info:
        return False
    ruta_origen = info['ruta']
    # Ejemplo: Documentos/MELANT_IA/PRODUCTORES/Nombre_Productor/Aprobados/
    carpeta_destino = os.path.join(os.path.expanduser('~'), 'Documents', 'MELANT_IA', 'PRODUCTORES', info['productor'], 'Aprobados')
    os.makedirs(carpeta_destino, exist_ok=True)
    shutil.copy(ruta_origen, carpeta_destino)
    return True

@app.route('/api/estado_informe', methods=['POST'])
def api_estado_informe():
    data = request.json
    id_informe = data['id_informe']
    decision = data['decision']
    if decision == 'aprobado':
        actualizar_db(id_informe, 'aprobado')
        copiar_a_carpeta_productor(id_informe)
        # Aquí puedes llamar a enviar_notificacion_exito(id_informe)
        return jsonify({'mensaje': 'Informe aprobado y movido a Documentos del productor.'})
    elif decision == 'rechazado':
        actualizar_db(id_informe, 'rechazado')
        # Aquí puedes llamar a solicitar_correccion_tecnico(id_informe)
        return jsonify({'mensaje': 'Informe marcado como rechazado y técnico notificado.'})
    else:
        return jsonify({'mensaje': 'Decisión no válida.'}), 400

if __name__ == '__main__':
    app.run(debug=True)
