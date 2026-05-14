import os
import glob

class TrazabilidadManager:
    def __init__(self):
        # Definimos la ruta donde organizamos las fotos anteriormente
        self.base_path = os.path.join('src', 'storage', 'trazabilidad')

    def obtener_fotos_animal(self, animal_id):
        """
        Busca todas las fotos relacionadas a un animal específico.
        Formato esperado de archivo: ID_Animal_*.jpg
        """
        # Creamos el patrón de búsqueda (Ej: 101_*.jpg)
        patron = os.path.join(self.base_path, f"{animal_id}_*.jpg")
        
        # Buscamos los archivos que coincidan
        lista_fotos = glob.glob(patron)
        
        if not lista_fotos:
            return f"No se encontraron fotos para el animal con ID: {animal_id}"
        
        # Ordenamos por nombre para que la trazabilidad sea cronológica
        lista_fotos.sort()
        return lista_fotos

# Ejemplo de uso para la App
if __name__ == "__main__":
    gestor = TrazabilidadManager()
    # Supongamos que el usuario hace clic en el animal con ID 05
    fotos = gestor.obtener_fotos_animal("05")
    print(f"Evidencias encontradas: {fotos}")