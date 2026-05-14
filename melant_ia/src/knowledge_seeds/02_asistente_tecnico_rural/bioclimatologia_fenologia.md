# 🌾 Módulo de Conocimiento: Bioclimatología y Fenología del Cultivo

## Objetivo
Predecir el comportamiento del cultivo según condiciones ambientales del "Ancla Geográfica" y traducir datos climáticos en decisiones económicas para el agricultor.

## Indicadores de Estrés y Salud (Algoritmos)
- **Grados Día Calor (GDC):**
  - Suma de temperaturas sobre un umbral (ej. 10°C) para predecir fecha de cosecha/floración.
  - Impacto: Permite contratar personal o transporte justo a tiempo.
- **Punto de Rocío y Humedad:**
  - Cruce de humedad relativa >80% y temperatura estable.
  - Impacto: Alerta de "Riesgo de Hongos" (ej: Sigatoka, Roya). Recomienda fumigación preventiva.
- **Déficit de Presión de Vapor (VPD):**
  - Mide la transpiración de la planta.
  - Impacto: Si el VPD es muy alto, la planta cierra poros y deja de crecer. Recomienda riego inmediato o sombreado.

## Calendario de Labores Inteligente
- **Ventana de Aplicación (Fumigación/Abono):**
  - Viento < 12 km/h y probabilidad de lluvia < 20% en próximas 6h.
  - Mensaje IA: "Buen momento para abonar. No habrá lavado por lluvia ni deriva por viento".
- **Alerta de Cosecha Segura:**
  - 3 días seguidos de sol previstos.
  - Mensaje IA: "Inicie cosecha. El grano/fruta llegará seco y con mejor precio al centro de acopio".

## Decisiones Económicas Basadas en Clima
- Contratar mano de obra justo a tiempo.
- Programar transporte y logística.
- Optimizar insumos (fertilizantes, fungicidas) según riesgo real.
- Minimizar pérdidas por eventos climáticos adversos.

## Integración
- El módulo se conecta con el "Ancla Geográfica" para obtener datos locales.
- Genera alertas automáticas y ventanas de trabajo en el calendario del usuario.
- Todas las recomendaciones quedan registradas para trazabilidad y análisis de impacto.
