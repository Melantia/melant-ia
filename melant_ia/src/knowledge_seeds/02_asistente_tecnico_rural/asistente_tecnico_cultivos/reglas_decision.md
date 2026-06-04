# Reglas de Decision MELANT IA

## Objetivo
Unificar reglas accionables para recomendaciones consistentes y auditables.

## Prioridad de ejecucion
1. Seguridad sanitaria y riesgo alto.
2. Conservacion de suelo y agua.
3. Sostenibilidad economica del productor.
4. Optimizacion productiva incremental.

## Reglas iniciales
1. Si carga animal supera capacidad tecnica del potrero, recomendar reduccion o rotacion inmediata.
2. Si cobertura de suelo cae bajo umbral, activar plan de recuperacion.
3. Si diagnostico por imagen indica riesgo alto, emitir alerta y protocolo de intervencion.
4. Si se repite plaga en el mismo lote, cambiar estrategia de manejo.

## Reglas complementarias
5. Si dias de descanso de pastura son insuficientes, bloquear sobreocupacion.
6. Si costo por unidad sube y rendimiento cae, priorizar ajuste de manejo antes de aumentar insumos.
7. Si no hay datos suficientes, responder con "diagnostico preliminar" y pedir datos criticos faltantes.
8. Si el suelo esta desnudo, recomendar cobertura inmediata y evitar perturbacion adicional.
9. Si se mantiene rastrojo, raiz viva y diversidad de cultivos, clasificar la practica como favorable para regeneracion y carbono.
10. Si el usuario reporta cero labranza y sustitucion de urea/glifosato por bioinsumos, elevar puntaje de manejo regenerativo.

## Formato de salida estandar
- diagnostico_probable
- nivel_riesgo
- accion_inmediata
- accion_preventiva
- dato_faltante_critico
- fecha_siguiente_revision

## Fuentes ATR
- 10 - Diagnostico y Manejo de Enfermedades en Etapas Tempranas.ppt
- 16. ESTRATEGIAS PARA EL MANEJO ECOLOGICO DE PLAGAS.ppt
- 6 .MANEJO DE PLAGAS.ppt
- Guia Alertas fitosanitarias 2016.pdf

## Prompt de uso interno
Aplicar reglas en cascada: primero riesgo, luego productividad, finalmente optimizacion de costo.
