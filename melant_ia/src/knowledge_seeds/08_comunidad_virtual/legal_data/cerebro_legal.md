# Cerebro Legal MELANT IA

## Alcance
Base legal y de cumplimiento para operaciones agropecuarias, manejo de datos, trazabilidad y soporte de auditoria.

## Objetivo operativo
Reducir riesgo legal y reputacional, asegurando que recomendaciones y registros cumplan marco aplicable.

## Dominios legales cubiertos
1. Cumplimiento productivo y sanitario.
2. Privacidad y tratamiento de datos personales.
3. Trazabilidad documental y evidencia tecnica.
4. Requisitos para certificaciones y controles.
5. Alertas de riesgo normativo.

## Variables minimas de validacion
- pais
- provincia_o_region
- tipo_actividad (agricola, pecuaria, transformacion)
- tipo_dato (tecnico, personal, sensible)
- evidencia_disponible (si/no)
- fecha_registro
- fuente_normativa

## Reglas legales base
1. Si una accion esta regulada y no hay evidencia de cumplimiento, marcar riesgo legal alto.
2. Si se procesan datos personales sin consentimiento o base valida, bloquear accion y emitir alerta.
3. Si hay recomendacion tecnica de alto impacto sin soporte normativo minimo, responder con advertencia de cumplimiento.
4. Si la norma vigente no es verificable, responder en modo precautorio y solicitar revision formal.

## Semaforo legal
- Verde: evidencia y base normativa suficientes.
- Amarillo: evidencia parcial o norma no confirmada.
- Rojo: incumplimiento probable o ausencia de base legal minima.

## Formato de salida legal estandar
- estado_legal (verde, amarillo, rojo)
- riesgo_legal (bajo, medio, alto)
- accion_recomendada
- evidencia_faltante
- fuente_referencia
- nota_descargo

## Politica de privacidad y datos
1. Recolectar solo datos necesarios para la finalidad tecnica.
2. Registrar consentimiento cuando aplique.
3. Minimizar retencion de datos sensibles.
4. Permitir trazabilidad de quien, cuando y para que se uso un dato.

## Integracion con otros modulos
- reglas_decision.md: no ejecutar recomendacion critica si estado_legal es rojo.
- memoria_productor.md: registrar evidencia legal junto al historial tecnico.
- normativa_fuentes.md: usar como repositorio de referencia normativa.

## Descargo
Este modulo entrega orientacion de cumplimiento y no reemplaza asesoria juridica profesional.
