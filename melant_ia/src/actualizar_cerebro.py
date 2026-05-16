# actualizar_cerebro.py
"""
Script para actualizar el "cerebro" de MELANTIA (medicina humana y veterinaria) en modo offline.
Permite copiar/actualizar todos los archivos JSON de conocimiento desde una carpeta USB o local a la estructura interna de la app.
Genera un log de cambios y valida la integridad de los datos.
"""

import os
import shutil
import json
import sys
from datetime import datetime

# Configuración
import argparse
parser = argparse.ArgumentParser(description='Actualizar el cerebro de MELANT IA (offline)')
parser.add_argument('--fuente', type=str, help='Ruta de la carpeta fuente (USB/actualización)', required=False)
args = parser.parse_args()

FUENTE = args.fuente or input('Ruta de la carpeta fuente (USB/actualización): ').strip()

# Destinos MELANTIA extendidos: incluye medicina, legal, seeds y módulos de la app
DESTINOS = [
    'medicina_veterinaria',
    'medicina_preventiva',
    'nutricion',
    'cursos',
    'protocolos',
    # Recursos MELANTIA
    os.path.join('knowledge_seeds', '10_comunidad_virtual', 'legal_data'),
    os.path.join('knowledge_seeds', 'config_voz.json'),
    os.path.join('knowledge_seeds', 'config.json'),
    os.path.join('knowledge_seeds', 'don_eloy_historias.json'),
    os.path.join('knowledge_seeds', 'modulo_seguridad.json'),
    os.path.join('knowledge_seeds', 'update.json'),
    os.path.join('knowledge_seeds', 'voces_melantia.json'),
    # Puedes agregar más rutas de módulos aquí
]
LOG_FILE = 'log_actualizacion_cerebro.txt'


def validar_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            json.load(f)
        return True
    except Exception as e:
        print(f"[ERROR] Archivo corrupto o mal formado: {path}\n{e}")
        return False



def copiar_actualizar():
    cambios = []
    for carpeta in DESTINOS:
        # Si es un archivo individual (ej: knowledge_seeds/config.json)
        if carpeta.endswith('.json'):
            src_file = os.path.join(FUENTE, carpeta)
            dst_file = os.path.join(os.getcwd(), carpeta)
            dst_dir = os.path.dirname(dst_file)
            if not os.path.exists(src_file):
                print(f"[AVISO] No se encontró {src_file}, se omite.")
                continue
            if not os.path.exists(dst_dir):
                os.makedirs(dst_dir)
            if validar_json(src_file):
                shutil.copy2(src_file, dst_file)
                cambios.append(carpeta)
                print(f"[OK] Actualizado: {carpeta}")
            else:
                print(f"[ERROR] No se copió: {carpeta}")
        else:
            # Es una carpeta (ej: medicina_veterinaria o knowledge_seeds/10_comunidad_virtual/legal_data)
            src_dir = os.path.join(FUENTE, carpeta)
            dst_dir = os.path.join(os.getcwd(), carpeta)
            if not os.path.exists(src_dir):
                print(f"[AVISO] No se encontró {src_dir}, se omite.")
                continue
            if not os.path.exists(dst_dir):
                os.makedirs(dst_dir)
            for fname in os.listdir(src_dir):
                if fname.endswith('.json'):
                    src_file = os.path.join(src_dir, fname)
                    dst_file = os.path.join(dst_dir, fname)
                    if validar_json(src_file):
                        shutil.copy2(src_file, dst_file)
                        cambios.append(f"{carpeta}/{fname}")
                        print(f"[OK] Actualizado: {carpeta}/{fname}")
                    else:
                        print(f"[ERROR] No se copió: {carpeta}/{fname}")
    return cambios


def registrar_log(cambios):
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Archivos actualizados:\n")
        for c in cambios:
            f.write(f"- {c}\n")


def main():
    import datetime
    fecha_hoy = datetime.date.today()
    dia_semana = fecha_hoy.weekday()  # 0 = lunes
    ruta_registro = "ultimo_update_semanal.txt"
    actualizar_hoy = False

    # Verifica si es lunes y si ya se actualizó hoy
    if dia_semana == 0:
        if os.path.exists(ruta_registro):
            with open(ruta_registro, "r") as f:
                ultima_fecha = datetime.datetime.strptime(f.read(), "%Y-%m-%d").date()
        else:
            ultima_fecha = fecha_hoy - datetime.timedelta(days=7)
        if ultima_fecha != fecha_hoy:
            actualizar_hoy = True
    if actualizar_hoy:
        print("=== Actualización automática semanal del cerebro MELANT IA (lunes) ===")
        cambios = copiar_actualizar()
        if cambios:
            registrar_log(cambios)
            print(f"\nActualización completada. {len(cambios)} archivos actualizados.")
            print(f"Ver log en: {LOG_FILE}")
        else:
            print("No se realizaron cambios.")
        with open(ruta_registro, "w") as f:
            f.write(str(fecha_hoy))
        # Consolidado de aprendizaje semanal
        print("\n>>> Ejecutando consolidación de aprendizaje semanal")
        generar_resumen_consolidado()
        print("\n>>> Ejecutando actualización de Su Entrenador (semanal)")
        os.system(f'python actualizar_su_entrenador.py')
    else:
        if dia_semana != 0:
            print("Hoy no es lunes. La actualización automática semanal se ejecuta solo los lunes.")
        else:
            print("La actualización automática ya se realizó este lunes.")

if __name__ == '__main__':
    main()

def generar_resumen_consolidado():
    feedback_path = os.path.join(os.getcwd(), 'feedback_local.json')
    prompt_path = os.path.join(os.getcwd(), 'prompt_resumen_dia10.txt')
    resumen_path = os.path.join(os.getcwd(), 'resumen_aprendizaje_dia10.txt')
    if os.path.exists(feedback_path) and os.path.exists(prompt_path):
        with open(prompt_path, 'r', encoding='utf-8') as f:
            prompt = f.read()
        with open(feedback_path, 'r', encoding='utf-8') as f:
            feedback = f.read()
        with open(resumen_path, 'w', encoding='utf-8') as f:
            f.write(prompt)
            f.write('\n\n---\n\nJSON de aprendizaje diario:\n')
            f.write(feedback)
        print(f"[OK] Resumen consolidado generado en: {resumen_path}")
    else:
        print("[AVISO] No se encontró feedback_local.json o prompt_resumen_dia10.txt. Solo se ejecutó la actualización técnica.")
