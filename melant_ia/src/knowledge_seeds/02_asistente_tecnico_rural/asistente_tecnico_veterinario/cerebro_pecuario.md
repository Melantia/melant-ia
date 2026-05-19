# Cerebro Pecuario

## Alcance
Modulo tecnico para manejo animal, pasturas, carga por potrero, nutricion por etapa y alertas de riesgo.

## Objetivo operativo
Optimizar la produccion animal sin degradar suelo ni cobertura vegetal.

## Submodulos
1. Inventario animal por especie: bovino, porcino, avicola, equino, caprino.
2. Registro de pasturas: tipo de pasto, area, cobertura, dias de descanso.
3. Nutricion por etapa: mantenimiento, crecimiento, lactancia, engorde.
4. Carga animal: capacidad por hectarea segun oferta forrajera.
5. Alertas: sobrecarga, baja cobertura, perdida de peso, desbalance nutricional.

## Variables minimas
- area_potrero_ha
- tipo_pasto
- animales_lote
- peso_promedio_kg
- consumo_materia_seca_pct
- dias_ocupacion
- dias_descanso

## Reglas tecnicas base
1. Si carga_actual_ua > carga_recomendada_ua entonces riesgo sobrepastoreo = alto.
2. Si cobertura_suelo_pct < 70 entonces activar recuperacion de potrero.
3. Si dias_descanso < umbral_tipo_pasto entonces bloquear nueva ocupacion.
4. Si ganancia_peso_diaria < minimo_objetivo entonces ajustar racion y revisar sanidad.
5. Si se registra Beauveria bassiana, marcar manejo_biologico_certificado = verdadero y no activar retiro de leche o carne.
6. Si se registra ivermectina, advertir impacto sobre escarabajos estercoleros y suelo vivo.

## Salidas esperadas
- capacidad_recomendada_animales
- nivel_riesgo_degradacion
- recomendacion_rotacion
- recomendacion_suplementacion
- alertas_priorizadas

## Fuentes priorizadas ATR
- 19. SISTEMAS DE PRODUCCION PECUARIA.ppt
- AGRICULTURA Y GANADERIA ECOLOGICA.PDF
- Guia para el manejo de garrapatas.pdf
- MANEJO CAPRINO.ppt
- Libro - Nutricion y fertilizacion de pastos.pdf

## Prompt de uso interno
Cuando el usuario consulte ganaderia, responder con recomendaciones accionables por lote y por potrero, siempre con enfoque conservacion de suelo + rentabilidad + bienestar animal.
