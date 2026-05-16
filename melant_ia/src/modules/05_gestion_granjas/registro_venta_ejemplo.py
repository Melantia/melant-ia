# Ejemplo: Registro de una venta desde el módulo de Gestión Empresarial/Granjas

def registrar_venta(producto, cantidad, precio_unitario, cliente, fecha, usuario_id, finca_id):
    venta = {
        'producto': producto,
        'cantidad': cantidad,
        'precio_unitario': precio_unitario,
        'total': cantidad * precio_unitario,
        'cliente': cliente,
        'fecha': fecha,
        'usuario_id': usuario_id,
        'finca_id': finca_id
    }
    # Aquí se guardaría en la base de datos (Supabase o local)
    print(f"Venta registrada: {venta}")
    return venta

# Ejemplo de uso
if __name__ == "__main__":
    venta = registrar_venta(
        producto='Cerdo en pie',
        cantidad=2,
        precio_unitario=180.0,
        cliente='Carlos Jiménez',
        fecha='2026-05-15',
        usuario_id=101,
        finca_id=1
    )
