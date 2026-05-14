import sqlite3
import os
import zlib

def cargar_datos():
    conexion = sqlite3.connect('melantia_data.db')
    cursor = conexion.cursor()

    # Ruta donde están tus carpetas de módulos
    ruta_base = 'src/modules' 

    for carpeta in os.listdir(ruta_base):
        ruta_modulo = os.path.join(ruta_base, carpeta)
        
        if os.path.isdir(ruta_modulo):
            print(f"Procesando módulo: {carpeta}...")
            
            for archivo in os.listdir(ruta_modulo):
                ruta_archivo = os.path.join(ruta_modulo, archivo)
                nombre, extension = os.path.splitext(archivo)
                extension = extension.lower()

                contenido_texto = None
                archivo_binario = None

                # Si es Markdown o JSON, leemos el texto
                if extension in ['.md', '.json']:
                    with open(ruta_archivo, 'r', encoding='utf-8') as f:
                        contenido_texto = f.read()
                
                # Si es PDF, lo comprimimos para ahorrar espacio
                elif extension == '.pdf':
                    with open(ruta_archivo, 'rb') as f:
                        archivo_binario = zlib.compress(f.read())

                # Insertamos en la tabla
                cursor.execute('''
                    INSERT INTO contenidos (modulo, titulo, tipo, contenido_texto, archivo_binario)
                    VALUES (?, ?, ?, ?, ?)
                ''', (carpeta, nombre, extension.replace('.', ''), contenido_texto, archivo_binario))

    conexion.commit()
    conexion.close()
    print("¡Toda la información ha sido centralizada en melantia_data.db!")
if __name__ == "__main__":
    cargar_datos()
