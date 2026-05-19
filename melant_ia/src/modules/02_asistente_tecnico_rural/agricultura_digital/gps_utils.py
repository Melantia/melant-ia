from kivy.utils import platform

def obtener_coordenadas_gps():
    try:
        if platform == 'android':
            from plyer import gps
            # plyer requiere un callback, pero aquí devolvemos None si no está inicializado
            # En la app principal, se debe inicializar el GPS y manejar el callback
            return None
        else:
            # Simulación para pruebas en PC
            return (1.2345, -75.1234)
    except Exception as e:
        print(f"Error al obtener GPS: {e}")
        return None
