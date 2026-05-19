# Ejemplo de gestión de granjas/fincas en MELANTIA

# Registro de una finca
def registrar_finca(nombre, ubicacion, responsable_id):
    return {
        'finca_id': 1,
        'nombre': nombre,
        'ubicacion': ubicacion,
        'responsable_id': responsable_id
    }

# Asociación de usuario a finca (permiso)
def asociar_usuario_finca(usuario_id, finca_id, rol):
    return {
        'usuario_id': usuario_id,
        'finca_id': finca_id,
        'rol': rol
    }

# Registro de actividad/productividad
def registrar_actividad(finca_id, usuario_id, fecha, tipo, descripcion):
    return {
        'actividad_id': 1,
        'finca_id': finca_id,
        'usuario_id': usuario_id,
        'fecha': fecha,
        'tipo': tipo,
        'descripcion': descripcion
    }

# Registro de documento/reporte
def registrar_documento(finca_id, usuario_id, tipo, fecha, archivo):
    return {
        'doc_id': 1,
        'finca_id': finca_id,
        'usuario_id': usuario_id,
        'tipo': tipo,
        'fecha': fecha,
        'archivo': archivo
    }

# Ejemplo de uso
if __name__ == "__main__":
    finca = registrar_finca('Granja El Progreso', 'Latacunga', 101)
    print('Finca registrada:', finca)
    permiso = asociar_usuario_finca(102, finca['finca_id'], 'tecnico')
    print('Usuario asociado:', permiso)
    actividad = registrar_actividad(finca['finca_id'], 101, '2026-05-15', 'Siembra', 'Siembra de maíz en lote 2')
    print('Actividad registrada:', actividad)
    documento = registrar_documento(finca['finca_id'], 101, 'Reporte Técnico', '2026-05-15', 'reporte_maiz.pdf')
    print('Documento registrado:', documento)
