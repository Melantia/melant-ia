# Modal de bienvenida para sección Ganadería (PyQt5)
from PyQt5.QtWidgets import QApplication, QMessageBox
import sys
import json

PREFERENCIAS_FILE = "preferencias_usuario.json"

def cargar_preferencias():
    try:
        with open(PREFERENCIAS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"voz": False}

def guardar_preferencias(prefs):
    with open(PREFERENCIAS_FILE, "w", encoding="utf-8") as f:
        json.dump(prefs, f, ensure_ascii=False, indent=2)

def mostrar_modal_bienvenida():
    prefs = cargar_preferencias()
    if not prefs.get("ganaderia_modal_mostrado", False):
        app = QApplication(sys.argv)
        msg = QMessageBox()
        msg.setWindowTitle("Bienvenido a Ganadería")
        msg.setText("¿Deseas activar el Asistente de Voz para guiarte en tus prácticas? Puedes cambiar esto luego en configuración.")
        msg.setIcon(QMessageBox.Question)
        activar = msg.addButton("Activar", QMessageBox.AcceptRole)
        no_gracias = msg.addButton("No, gracias", QMessageBox.RejectRole)
        msg.exec_()
        if msg.clickedButton() == activar:
            prefs["voz"] = True
        else:
            prefs["voz"] = False
        prefs["ganaderia_modal_mostrado"] = True
        guardar_preferencias(prefs)
        app.quit()

if __name__ == "__main__":
    mostrar_modal_bienvenida()
