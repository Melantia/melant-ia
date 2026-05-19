# Ejemplo de validación de compra en MELANTIA

def validar_compra(datos_compra):
    """
    Valida que el comprador ingrese la cédula o licencia. Si no tiene ninguna, la foto es obligatoria.
    """
    if not (datos_compra.get('cedula') or datos_compra.get('licencia')):
        if not datos_compra.get('foto_comprador'):
            raise ValueError("Debe ingresar cédula, licencia o tomar una foto para realizar la compra.")
        else:
            print("[INFO] No se ingresó cédula ni licencia, se usará la foto del comprador como respaldo.")
    else:
        if datos_compra.get('foto_comprador'):
            print("[INFO] Foto del comprador recibida y asociada a la compra.")
        else:
            print("[INFO] Validación por documento, foto opcional.")
    # Continúa el flujo de compra...
    return True

# Ejemplo de uso
if __name__ == "__main__":
    compra = {
        'producto': 'Fertilizante Orgánico',
        'precio': 35.5,
        'moneda': 'USD',
        'cliente_nombre': 'María López',
        'cedula': '',
        'licencia': '',
        'foto_comprador': 'data:image/jpeg;base64,...'
    }
    validar_compra(compra)
