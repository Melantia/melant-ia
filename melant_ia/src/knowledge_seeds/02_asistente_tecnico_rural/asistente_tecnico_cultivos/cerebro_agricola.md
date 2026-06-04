# Cerebro Agricola

## Alcance
Conocimiento de cultivos, suelo, fisiologia vegetal, nutricion mineral y manejo agronomico.

## Objetivo operativo
Mejorar productividad por hectarea con manejo tecnico del cultivo y salud del suelo.

## Dominios tecnicos
1. Fisiologia vegetal: agua, estomas, transporte, potencial hidrico.
2. Nutricion vegetal: macro y micronutrientes.
3. Manejo de cultivo: siembra, fertilizacion, control de factores limitantes.
4. Suelos: diagnostico basico y manejo de fertilidad.

## Variables minimas
- cultivo
- etapa_fenologica
- tipo_suelo
- pH
- materia_organica_pct
- rendimiento_objetivo
- disponibilidad_agua

## Reglas tecnicas base
1. Si pH fuera de rango optimo del cultivo, priorizar correccion antes de aumentar dosis de fertilizante.
2. Si sintomas foliares + baja disponibilidad de nutriente, emitir diagnostico probable y manejo gradual.
3. Si deficit hidrico en etapa critica, activar recomendacion de riego y cobertura.

## Salidas esperadas
- diagnostico_agronomico_probable
- plan_nutricional_base
- recomendacion_suelo_agua
- acciones_priorizadas_corto_plazo

## Fuentes priorizadas ATR
- 02-Nutricion Mineral -Rubens-2014.docx
- 03-Nutricion mineral-Gutierrez-1997.pdf
- 04-NutricionMineral de Plantas2014.pdf
- 1-1 El cultivo de Cacao.pdf
- 3-1 Manejo Agronomico del cacao.pdf

## Prompt de uso interno
Responder por cultivo y por etapa fenologica. Evitar recomendaciones genericas; indicar accion concreta, riesgo y seguimiento.

## Modulo de conocimiento fitosanitario integrado
El archivo conocimiento_fitosanitario.py contiene base interna con datos de:
- EPPO Data Services: codigos, nombres cientificos, estatus cuarentena (12+ organismos)
- CABI BioProtection Portal: tratamientos biologicos autorizados por pais (8+ plagas cubiertas)
- Open Phytopathology: sintomas clave, condiciones favorables, diagnostico diferencial (6+ enfermedades)
Funciones: consultar_enfermedad(), listar_plagas_por_cultivo(), obtener_tratamiento(), diagnostico_por_sintomas()
Accesible desde CLI (opcion 7) y desde ingesta_laboratorio.py (enriquecimiento automatico).
