# Normativa y Fuentes

## Objetivo
Mantener base de referencia legal e institucional para recomendaciones alineadas a marco vigente.

## Tipos de fuente
1. Leyes y reglamentos.
2. Acuerdos ministeriales.
3. Guias institucionales (INIAP, Agrocalidad, FAO y equivalentes).

## Uso en decisiones
1. Si una accion tecnica esta regulada, mostrar observacion de cumplimiento.
2. Si aplica certificacion o control oficial, indicar entidad de referencia.
3. Si no hay certeza normativa, marcar como "revisar norma vigente".

## Fuentes ATR priorizadas
- Acuerdo_Ministerial_142_Plan_fusarium_OK (1) (1).pdf
- Agrocalidad Sanidad Vegetal Natalia Aguirre.pdf
- Ley de Fomento Productivo.pdf
- Publicacion_INIAP_final_imprenta.pdf
- REGLAMENTO DE CREDITO.doc

## Nota
Este archivo es de referencia. No sustituye validacion juridica formal cuando exista riesgo regulatorio alto.

## Bases de Datos Bibliográficas Suramérica (integradas en conocimiento_fitosanitario.py)
- **Embrapa / BDPA (Brasil)**: Base de Dados da Pesquisa Agropecuária. Cultivos tropicales, recuperación de suelos, ganadería sustentable. URL: https://www.bdpa.cnptia.embrapa.br
- **SIOC / MinAgricultura (Colombia)**: Cadenas productivas, costos de producción, áreas sembradas, rendimiento por departamento. URL: https://sioc.minagricultura.gov.co
- **INIAP Repositorio (Ecuador)**: Manuales MIP para banano, plátano, cacao, palma. Guías de control biológico específicas para suelos ecuatorianos. URL: https://repositorio.iniap.gob.ec
- **COSAVE (Cono Sur)**: Alertas fitosanitarias regionales (AR, BR, CL, PY, PE, UY). Si plaga aparece en Perú → alerta preventiva en Ecuador. URL: https://www.cosave.org

## APIs y Datasets Externos (pendientes de integración)
- **CABI BioProtection Portal API**: Base de datos mundial de biopesticidas y tratamientos biológicos autorizados por país/enfermedad. Prioridad alta para recomendaciones de tratamiento.
- **EPPO Data Services API**: Nombres científicos, códigos y estatus de cuarentena de plagas y enfermedades (Organización Europea y Mediterránea de Protección de Plantas).
- **Open Phytopathology**: Datasets abiertos y recursos computacionales para entrenar modelos de detección de enfermedades.

## Bibliotecas de Visión por Computadora (ruta de mejora para analisis_foliar_vision.py)
- **PlantMD**: Framework con modelos pre-entrenados para detección de enfermedades foliares.
- **DeepPlantPhenomics**: Deep learning para fenotipado de plantas, clasificación de lesiones y severidad.
- **TensorFlow Hub (PlantVillage)**: Modelos entrenados con 50,000+ imágenes de hojas sanas/enfermas de 14 especies.

## Bibliotecas de Diagnóstico Molecular (ruta futura — nivel laboratorio/ADN)
- **Scikit-Bio**: Análisis de diversidad del microbioma en planta. Identifica bacterias patógenas comparando secuencias.
- **Metaphlan**: Perfilación de comunidades microbianas. Para analizar datos de secuenciación y encontrar virus/bacterias específicas.
