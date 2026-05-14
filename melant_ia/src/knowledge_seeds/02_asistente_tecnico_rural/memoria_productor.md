# Memoria del Productor

## Objetivo
Registrar historial productivo, economico y sanitario para decisiones personalizadas por finca.

## Entidades minimas
1. Productor
2. Finca
3. Lote o potrero
4. Ciclo productivo
5. Registro de costos
6. Registro de rendimiento
7. Registro sanitario
8. Evidencias (foto, geo, fecha)

## Variables clave
- productor_id
- finca_id
- lote_id
- fecha
- cultivo_o_especie
- costo_total
- rendimiento
- incidencia_sanitaria
- observaciones

## Reglas de uso
1. Toda recomendacion debe intentar apoyarse en al menos un dato historico de memoria.
2. Si no existe historial, marcar caso como linea base inicial.
3. Si hay variacion negativa recurrente de rendimiento o costo, activar alerta de gestion.

## Salidas esperadas
- resumen_historico
- tendencia_productiva
- tendencia_costos
- alertas_recurrentes
- recomendacion_personalizada

## Fuentes ATR
- COSTOS DE PRODUCCION MANABI.xls
- COSTOS SANDIA , MELON, MANI.xls
- COSTO PRODUCCION BALSA.xls
- CONSOLIDADO AGROQUIMICOS 2015 ACTUALIZADO.xls
- CHIVATOS.xlsx

## Prompt de uso interno
Responder con base en historial. Si hay conflicto entre teoria y datos de finca, priorizar contexto local con enfoque conservador.
