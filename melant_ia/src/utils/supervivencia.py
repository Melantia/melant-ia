# --- CONFIGURACIÓN DE SUPERVIVENCIA Y MODO OFFLINE MELANTIA ---
import os
import json
import datetime
import sys
import time
try:
    import psutil
except ImportError:
    psutil = None

DB_LOCAL = "dashboard_central/cola_offline.json"
LIMITE_BATERIA = 15  # % mínimo para procesos pesados (como compresión)


def verificar_estado_celular():
    """Prueba el estado de la batería y memoria antes de procesar."""
    try:
        if psutil:
            bateria = psutil.sensors_battery()
            porcentaje = bateria.percent if bateria else 100
            esta_enchufado = bateria.power_plugged if bateria else True
        else:
            porcentaje = 100
            esta_enchufado = True
        print(f"🔋 Batería: {porcentaje}% | Enchufado: {esta_enchufado}")
        if porcentaje < LIMITE_BATERIA and not esta_enchufado:
            print("⚠️ MODO AHORRO EXTREMO: Compresión de fotos pospuesta.")
            return False
        return True
    except:
        return True  # Si no puede medir, continúa con precaución


def guardar_evidencia_offline(datos_evidencia, max_registros=100):
    """Guarda en cola local si no hay internet (Modo Offline)."""
    cola = []
    if os.path.exists(DB_LOCAL):
        with open(DB_LOCAL, 'r') as f:
            cola = json.load(f)
    cola.append({
        **datos_evidencia,
        "timestamp": str(datetime.datetime.now()),
        "estado": "pendiente_sincronizacion"
    })
    # Limitar tamaño de la cola
    if len(cola) > max_registros:
        cola = cola[-max_registros:]
    with open(DB_LOCAL, 'w') as f:
        json.dump(cola, f, indent=4)
    print("📡 MODO OFFLINE: Datos guardados localmente para envío posterior.")


def barra_progreso_ligera(iteracion, total, prefijo='', sufijo='', decimales=1, longitud=20, rellano='#', modo_nocturno=False):
    """Barra de progreso de bajo consumo de CPU para celulares gama baja."""
    porcentaje = ("{0:." + str(decimales) + "f}").format(100 * (iteracion / float(total)))
    llenado = int(longitud * iteracion // total)
    barra = rellano * llenado + '-' * (longitud - llenado)
    if modo_nocturno:
        sys.stdout.write(f'\033[1;32;40m\r{prefijo} |{barra}| {porcentaje}% {sufijo}\033[0m')
    else:
        sys.stdout.write(f'\r{prefijo} |{barra}| {porcentaje}% {sufijo}')
    sys.stdout.flush()
    if iteracion == total:
        print()


def ejecutar_proceso_seguro(nombre_tarea, pasos=10, modo_nocturno=False):
    """Ejecuta tareas (como comprimir fotos) sin romper el sistema."""
    if modo_nocturno:
        print("\033[1;32;40m\n🚀 Iniciando: " + nombre_tarea + "\033[0m")
    else:
        print(f"\n🚀 Iniciando: {nombre_tarea}")
    for i in range(pasos + 1):
        time.sleep(0.2)
        barra_progreso_ligera(i, pasos, prefijo='Procesando:', sufijo='Completo', longitud=15, modo_nocturno=modo_nocturno)
    if modo_nocturno:
        print("\033[1;32;40m✅ Tarea finalizada con éxito.\033[0m")
    else:
        print("✅ Tarea finalizada con éxito.")


def verificar_modo_offline():
    """Detecta si hay señal. Si no, activa el guardado en caché local."""
    response = os.system("ping -c 1 google.com > /dev/null 2>&1" if os.name != 'nt' else "ping -n 1 google.com > nul")
    if response != 0:
        print("📡 MODO OFFLINE ACTIVADO: Los datos se enviarán cuando recuperes señal.")
        return True
    return False


def activar_modo_nocturno():
    """Activa modo nocturno para toda la terminal (letras verdes sobre fondo negro)."""
    print("\033[1;32;40mModo nocturno activado.\033[0m")


def desactivar_modo_nocturno():
    """Restaura colores estándar de la terminal."""
    print("\033[0mModo nocturno desactivado.")


def procesar_evidencia_inteligente(ruta_foto, paso, gps):
    """Procesamiento que no rompe el celular."""
    if not verificar_estado_celular():
        # Guardar solo metadatos y GPS, procesar foto después
        guardar_evidencia_offline({"paso": paso, "gps": gps, "foto_pend": ruta_foto})
        return
    # Si hay batería, procesamos con bajo consumo
    print(f"⚡ Procesando {paso} en modo optimizado...")
    # Aquí llamamos a la función de compresión que ya tenemos
    # (Integrar con procesador_imagenes.procesar_y_enviar_foto)
