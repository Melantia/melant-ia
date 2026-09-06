# 📂 Carpeta de Datos — Trazabilidad Agrícola

## Propósito

Archivos JSON con datos de trazabilidad por cultivo.
Cada archivo representa un tipo de cultivo.

## Cómo agregar un nuevo cultivo

1. Duplica un archivo existente → renómbralo: trazabilidad_nombre.json
2. Modifica los campos con los datos reales
3. El código lo detecta automáticamente

## Ruta de acceso

./modules/02*asistente_tecnico_rural/data/trazabilidad*{cultivo}.json

## Campos comunes

- cultivo → Nombre del cultivo
- variedad → Variedad o híbrido
- siembra → Fecha, método, densidad
- suelo → pH, textura, materia orgánica
- agroquimicos → Historial de aplicaciones
- cosecha → Fecha estimada, rendimiento
