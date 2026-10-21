# MELANTIA — PLANO MAESTRO DEL PROYECTO Y HOJA DE RUTA DEL MVP

> **Documento vivo:** este archivo define la arquitectura, prioridades, reglas técnicas y forma de avance del proyecto MELANTIA.  
> Debe permanecer en la raíz del repositorio y actualizarse diariamente cuando cambie una decisión, se complete una tarea o aparezca un riesgo técnico.
>
> **Objetivo principal:** construir un MVP funcional en aproximadamente 1 mes, preparado para crecer progresivamente, con una experiencia **mobile-first, offline-first, rápida y robusta**, y con una versión Web orientada principalmente a gestión, consulta, importación/exportación y trabajo con Excel desde laptops.
>
> **Documento de visión:** `docs/VISION_ECOSISTEMA_MELANTIA.md` (2026-09-30) — visión de crecimiento y roadmap de largo plazo del ecosistema (Marketplace transversal, EP para negocios no agropecuarios, IA→visión→satélite→finanzas→drones→robótica→biotecnología→carbono, estrategia territorial Manabí→Costa→Sierra→Oriente). Documento de referencia: **no implementa** funcionalidades futuras; cada fase se contrasta con este Master antes de ejecutarse.
>
> **Licencia Institucional:** `docs/LICENCIA_INSTITUCIONAL.md` (2026-10-01) — modelo comercial/funcional aprobado: beneficiario vs líder comunitario patrocinado vs usuario independiente; niveles $5.000→20 líderes y $10.000→40 líderes; acceso institucional a Negocios Rurales sin propiedad de las plataformas; comisión 3 % independiente de la licencia.
>
> **Actualización MVP (2026-10-08):** §43 incorpora las decisiones aprobadas de experiencia de usuario (Mi Producción, navegación principal), horizonte de validación de 24 meses / meta 10.000 usuarios, Offline First + Smart Sync/Supervivencia, seguridad, roles administrativos L0–L5, credenciales administrativas y Puerto MELANTIA como capacidad futura. §44 = checklist de cierre del MVP. §45 = contradicciones documentales y pendientes registrados (no resueltos). Documentación especializada de referencia: `docs/patrimonio/seguridad_soberana/` (01–08 + `MATRIZ_CREDENCIALES_ROLES_PERMISOS_ALCANCES_V1.md`).
>
> **Bitácora técnica:** `MELANTIA_ESTADO_IMPLEMENTACION.md` — estado real de implementación, evidencias (tests, commits, migraciones) y siguientes hitos. Este Master sigue siendo la autoridad de arquitectura y decisiones; la bitácora registra la ejecución verificable.

---

## 1. IDENTIDAD DEL PROYECTO

**Nombre:** MELANTIA

**Identidad:** PRODUCTIVIDAD AGROPECUARIA INTELIGENTE OFFLINE

**Principio central:** MELANTIA debe ser útil en el campo incluso sin Internet.

### Objetivos del MVP

1. Funcionar en celulares, incluidos dispositivos de baja gama.
2. Trabajar sin Internet.
3. Guardar información localmente cuando no exista cobertura.
4. Sincronizar cuando exista una conexión adecuada.
5. Priorizar Wi-Fi para evitar consumo de datos móviles del productor.
6. Si solamente existe conexión móvil, solicitar autorización antes de sincronizar.
7. Cargar los módulos bajo demanda (lazy loading).
8. Evitar que toda la aplicación se cargue al iniciar.
9. Mantener el consumo de memoria, CPU, almacenamiento y datos bajo control.
10. Mantener el backend independiente del tipo de cliente.
11. Permitir acceso desde laptop mediante la aplicación Web.
12. Permitir importar y exportar información mediante Excel.
13. Mantener los registros originales de campo protegidos contra sobrescritura.
14. Mantener evidencias verificables mediante huellas criptográficas.
15. Permitir crecer posteriormente hacia IA, RAG, nuevos módulos, más usuarios y una aplicación móvil completa.

---

# 2. PRINCIPIO ARQUITECTÓNICO GENERAL

MELANTIA se construirá como:

**Mobile-first + Offline-first + API-first + Modular + Escalable**

```text
                         MELANTIA
                            |
              +-------------+-------------+
              |                           |
        APP MÓVIL                      WEB
      React Native                    React
              |                           |
              +-------------+-------------+
                            |
                       API REST
                         FastAPI
                            |
          +-----------------+-----------------+
          |                 |                 |
       Servicios         Sync/Auditoría     Auth
          |                 |                 |
          +-----------------+-----------------+
                            |
                       PostgreSQL
                            |
          +-----------------+-----------------+
          |                 |                 |
       Evidencias        Storage           Datos
```

### Regla fundamental

El backend no se organiza por cliente.

No debe existir:

```text
backend/mobile/
backend/web/
```

Debe existir una única lógica de negocio:

```text
backend/
├── core/
├── database/
├── modules/
└── shared/
```

Tanto el móvil como la Web consumen la misma API.

---

# 3. ROLES DE CADA CLIENTE

## 3.1 Aplicación móvil

La aplicación móvil es el cliente principal para el trabajo de campo.

Prioridades:

- captura de información;
- consulta de información disponible offline;
- fotografías;
- evidencias;
- GPS;
- registros productivos;
- trazabilidad;
- gestión de finca;
- pecuaria;
- asistencia técnica disponible offline;
- operaciones comerciales;
- sincronización.

La aplicación debe ser usable con cobertura inexistente o intermitente.

---

## 3.2 Aplicación Web / Laptop

La Web no debe sustituir la lógica de captura del campo.

Su función principal es:

- consultar información sincronizada;
- gestionar información;
- visualizar reportes;
- descargar información;
- importar Excel;
- exportar Excel;
- trabajar con grandes cantidades de datos;
- administrar documentos;
- generar reportes;
- verificar evidencias;
- administrar configuraciones y permisos.

### Regla de integridad

La Web **NO puede sobrescribir ni alterar el registro original capturado en campo**.

Una modificación posterior debe convertirse en:

- nueva versión;
- corrección;
- nuevo evento;
- o nuevo registro relacionado.

El registro original permanece conservado.

---

# 4. ARQUITECTURA OFFLINE-FIRST

```text
                   SIN INTERNET
                       |
                       v
                +--------------+
                | Base local   |
                | del móvil    |
                +--------------+
                       |
                 Cola de Sync
                       |
                       | Internet
                       v
                  FastAPI API
                       |
                       v
                  PostgreSQL
```

Cada entidad importante debe tener identificador UUID.

No utilizar `Date.now()` como identificador principal.

### Metadatos de sincronización

Las entidades que necesiten sincronización deben contemplar, según corresponda:

```text
id
device_id
created_at
updated_at
sync_status
version
deleted_at
```

Estados posibles:

```text
pending
syncing
synced
failed
conflict
```

No todos los modelos necesitan exactamente los mismos campos, pero el diseño debe permitir sincronización e idempotencia.

---

# 5. POLÍTICA DE SINCRONIZACIÓN

La sincronización debe priorizar el ahorro de datos del productor.

## 5.1 Con Wi-Fi

Si el dispositivo tiene:

```text
Internet = disponible
Tipo de red = Wi-Fi
```

MELANTIA puede sincronizar automáticamente.

```text
Wi-Fi detectado
      |
      v
Sincronización automática
      |
      v
Enviar pendientes
      |
      v
Recibir cambios
      |
      v
Actualizar estado
```

## 5.2 Con datos móviles

Si existe:

```text
Internet = disponible
Tipo de red = datos móviles
```

MELANTIA NO debe sincronizar automáticamente.

Debe mostrar una confirmación:

> "Hay conexión mediante datos móviles. ¿Desea sincronizar MELANTIA ahora?"

Opciones:

- Sincronizar ahora
- Cancelar
- Recordar posteriormente

La aplicación no debe consumir datos del productor sin autorización.

## 5.3 Preferencia del usuario

Debe existir una configuración similar a:

```text
Sincronización

[✓] Sincronizar automáticamente con Wi-Fi
[ ] Preguntar antes de usar datos móviles
```

La política predeterminada debe proteger el consumo de datos.

---

# 6. SINCRONIZACIÓN EFICIENTE

No se debe enviar toda la base de datos cada vez.

Debe utilizarse sincronización incremental.

```text
Incorrecto:

Móvil
  |
  +---- enviar toda la base de datos ----> API


Correcto:

Móvil
  |
  +---- registros pendientes -----------> API
  |
  +---- cambios posteriores ------------> API
```

La sincronización debe contemplar:

- lotes pequeños;
- reintentos;
- idempotencia;
- control de conflictos;
- compresión cuando sea conveniente;
- fotografías/documentos separados de los datos estructurados;
- reanudación si se interrumpe la conexión.

---

# 7. RENDIMIENTO EN CELULARES DE BAJA GAMA

MELANTIA debe diseñarse desde el principio para hardware limitado.

### Reglas obligatorias

1. Lazy loading de módulos.
2. No cargar los 12 módulos al iniciar.
3. No cargar imágenes innecesarias.
4. Reducir tamaño de fotografías antes de subirlas cuando corresponda.
5. Paginación en listas grandes.
6. Consultas SQL indexadas.
7. Evitar consultas N+1.
8. No ejecutar procesos pesados en el hilo principal.
9. Evitar renders innecesarios de React.
10. Mantener componentes pequeños.
11. Mantener cachés controladas.
12. Liberar memoria de pantallas que ya no se utilizan.
13. Cargar datos bajo demanda.
14. Evitar librerías pesadas sin justificación.
15. Medir rendimiento antes de añadir dependencias.

### Objetivo

La aplicación debe sentirse rápida incluso con:

- teléfonos económicos;
- poca RAM;
- procesadores modestos;
- almacenamiento limitado;
- conexión lenta;
- cobertura intermitente.

---

# 8. CARGA BAJO DEMANDA DE LOS 12 MÓDULOS

Los módulos no deben cargarse todos al abrir MELANTIA.

Conceptualmente:

```text
Inicio
 |
 +-- Inicio
 |
 +-- Módulo solicitado
       |
       +-- cargar código
       +-- cargar configuración
       +-- cargar datos
```

En React se utilizará lazy loading / code splitting.

Los módulos deberán mantener una estructura modular:

```text
frontend/src/
├── app/
├── modules/
│   ├── suscripciones/
│   ├── asistente_tecnico/
│   ├── gestion_fincas/
│   ├── negocios_rurales/
│   ├── emprendimientos/
│   ├── proyectos/
│   ├── escuela_campo/
│   ├── comunidad_virtual/
│   ├── salud_preventiva/
│   ├── servicios_financieros/
│   ├── evidencias/
│   └── finanzas_personales/
└── shared/
```

---

# 9. LOS 12 MÓDULOS DE MELANTIA

## Módulo 1 — Suscripciones

Código:

```text
suscripciones
```

Items:

- Gestión de Suscripciones
- Planes y Pagos
- Moneda Virtual Melantios

Responsabilidades:

- planes;
- permisos;
- límites;
- consumo;
- facturación/pagos cuando corresponda.

---

## Módulo 2 — Asistente Técnico Rural

Código:

```text
asistente_tecnico
```

Items:

- Asistente en Cultivos
- Calculadora Agrícola
- Calendario Lunar
- Cronograma de Siembra
- Biblioteca Técnico Rural
- Asistente Veterinario
- Salud y Medicina Veterinaria
- Animales Menores y Mascotas
- Inventario Biológico
- Apicultura
- Agricultura de Precisión (Sensores)
- Clima Inteligente
- Levantamiento de Lote
- GPS (Medición de Terrenos)
- Visión Artificial (Modelos IA)
- Visión Satelital

Este módulo será una prioridad posterior al núcleo MVP para integrar conocimiento técnico, RAG y modelos de IA.

---

## Módulo 3 — Gestión de Fincas y Trazabilidad

Código:

```text
gestion_fincas
```

Items:

- Gestión de Fincas
- Trazabilidad Cultivos
- Trazabilidad de Granjas
- Gestión PYMES

Incluye:

```text
Gestión de Fincas
├── fincas
├── lotes
└── prácticas regenerativas

Gestión Pecuaria
├── hatos
├── animales
└── eventos animales

Motor de Trazabilidad
├── plantillas
├── fases
├── trazabilidades
├── eventos
└── cadena de custodia
```

La trazabilidad debe ser genérica y configurable, no una base de datos diferente para cada cultivo.

---

## Módulo 4 — Negocios Rurales

Código:

```text
negocios_rurales
```

Items/conceptos:

- Red Social Comercial Rural
- Marketplace MELANTIA
- Bolsa Agropecuaria
- Ferias Virtuales
- Bienes Raíces Rurales

### Reglas

`Mi Tienda` pertenece al Marketplace.

No crear un módulo independiente `tienda_virtual`.

`Mercado de Plátano` no es un módulo independiente.

La Bolsa es genérica; plátano es una categoría/producto.

### Flujo comercial

```text
Publicación
    |
    v
Oferta/Demanda
    |
    v
Bolsa
    |
    v
Emparejamiento
    |
    v
Oportunidad
    |
    v
Negociación
    |
    v
Transacción
```

La comisión MELANTIA del 3% pertenece a la transacción, no a la publicación.

---

## Módulo 5 — Emprendedor

Código:

```text
emprendimientos
```

Item:

- Emprendimientos

---

# MÓDULO 6 — PROYECTOS

El Módulo 6 concentra los proyectos estratégicos de MELANTIA. Estos proyectos se organizan en dos grandes líneas:

1. Proyectos de Impacto Rural.
2. Proyectos de Innovación Tecnológica y Expansión.

Los proyectos de innovación tecnológica de segunda etapa no forman parte del MVP inicial. Su desarrollo está previsto como una Fase 2, aproximadamente a partir de los 24 meses posteriores a la puesta en marcha de MELANTIA, siempre condicionado a la disponibilidad de capital, resultados de la primera etapa, validación técnica, demanda, viabilidad económica, requisitos regulatorios y capacidad operativa.

---

## 6.1 PROYECTOS DE IMPACTO RURAL

### 6.1.1 Proyecto Captura de Carbono — Fase 2 (24+ meses)

Proyecto estratégico de segunda etapa orientado a preparar y gestionar iniciativas de captura de carbono vinculadas con actividades agropecuarias, nuevas siembras y sistemas productivos rurales.

Este proyecto no formará parte de las funcionalidades iniciales del MVP. Su implementación comenzará únicamente después de los 24 meses de puesta en marcha de MELANTIA y dependerá principalmente del interés demostrado por los productores, de la disponibilidad de capital, de la existencia de una superficie suficiente para desarrollar el proyecto y del cumplimiento de las directrices establecidas por las entidades, metodologías u organismos responsables de la validación y verificación de la captura de carbono.

#### Etapa inicial — Identificación del interés de los productores

Durante la Fase 2, MELANTIA podrá incorporar una encuesta/formulario de interés para identificar a los productores que deseen participar voluntariamente en futuras iniciativas de captura de carbono.

La encuesta deberá recopilar, entre otros aspectos, la información y los requisitos necesarios para determinar si el productor y su unidad productiva podrían cumplir las condiciones exigidas por la metodología o entidad que posteriormente realice la validación y verificación.

La participación será voluntaria.

MELANTIA no deberá considerar automáticamente una finca como proyecto de captura de carbono únicamente por haber registrado una nueva siembra.

#### Nuevas siembras

Las nuevas siembras de cultivos podrán ser consideradas dentro de la iniciativa cuando:

- El productor manifieste expresamente su interés en participar.
- La siembra cumpla los criterios establecidos para el proyecto.
- Se recopile la información requerida.
- Se mantenga la trazabilidad desde el establecimiento del cultivo.
- Se generen las evidencias correspondientes.
- Se cumplan las directrices de la metodología o entidad responsable de la validación y verificación.

La incorporación de una finca, lote o nueva siembra a MELANTIA no constituye por sí misma una certificación de captura de carbono.

#### Escala del proyecto

Como referencia inicial de planificación, MELANTIA podrá comenzar a evaluar la estructuración formal del proyecto cuando exista una superficie acumulada aproximada de entre 2.000 y 3.000 hectáreas de productores interesados y potencialmente elegibles.

Esta superficie constituye un objetivo de escala para evaluar la viabilidad del proyecto y no representa, por sí sola, un criterio universal de elegibilidad, certificación o validación.

La decisión de iniciar el proceso formal dependerá de:

- Número de productores interesados.
- Superficie potencialmente elegible.
- Tipo de cultivos y sistemas productivos.
- Características de las nuevas siembras.
- Información disponible.
- Evidencias recopiladas.
- Cumplimiento de la metodología seleccionada.
- Requisitos de adicionalidad, permanencia, medición y monitoreo cuando correspondan.
- Requisitos de validación y verificación.
- Viabilidad económica.
- Costos del proceso.
- Entidad o estándar seleccionado para la certificación.
- Requisitos legales y regulatorios aplicables.

#### Infraestructura MELANTIA

El proyecto deberá aprovechar la infraestructura existente de MELANTIA para:

- Registrar productores participantes.
- Registrar fincas y lotes.
- Registrar nuevas siembras.
- Registrar cultivos y superficies.
- Mantener información geográfica.
- Registrar prácticas productivas y regenerativas.
- Registrar fechas y actividades.
- Recopilar evidencias fotográficas y documentales.
- Mantener trazabilidad de las actividades.
- Gestionar documentos.
- Mantener historial de cambios.
- Generar reportes.
- Preparar información para procesos posteriores de validación y verificación.

#### Flujo conceptual

PRODUCTOR INTERESADO
↓
ENCUESTA DE PARTICIPACIÓN
↓
REVISIÓN DE REQUISITOS
↓
REGISTRO DE FINCA Y LOTES
↓
REGISTRO DE NUEVAS SIEMBRAS
↓
RECOPILACIÓN DE EVIDENCIAS
↓
SEGUIMIENTO Y TRAZABILIDAD
↓
EVALUACIÓN DE ELEGIBILIDAD
↓
ALCANZAR ESCALA DEL PROYECTO
↓
SELECCIÓN DE METODOLOGÍA / ESTÁNDAR
↓
PREPARACIÓN DEL PROYECTO
↓
VALIDACIÓN POR ENTIDAD COMPETENTE
↓
MONITOREO
↓
VERIFICACIÓN
↓
CERTIFICACIÓN / RESULTADO

Proyecto orientado a desarrollar mecanismos para registrar, medir, documentar y gestionar iniciativas de captura de carbono vinculadas con actividades agropecuarias y sistemas productivos rurales.

Debe aprovechar la infraestructura de MELANTIA para:

- Registrar fincas y lotes participantes.
- Asociar prácticas productivas y regenerativas.
- Registrar evidencias.
- Mantener trazabilidad de las actividades.
- Gestionar documentación.
- Generar información para futuros procesos de medición, verificación y certificación.

---

### 6.1.2 Proyecto Saberes Ancestrales y Folklore

Proyecto destinado a preservar, documentar y poner en valor los conocimientos, prácticas, tradiciones, expresiones culturales y patrimonio rural.

Debe permitir:

- Registro de conocimientos y prácticas.
- Documentación audiovisual.
- Registro de testimonios.
- Asociación con comunidades y territorios.
- Conservación de información histórica.
- Gestión de evidencias y documentos.
- Protección y trazabilidad de los registros culturales.

---

### 6.1.3 El Tesoro de los Abuelos — Memoria Viva

Proyecto destinado a conservar la memoria histórica de las comunidades rurales mediante el registro de historias, experiencias, conocimientos, fotografías, documentos y testimonios de las generaciones mayores.

Debe permitir:

- Registrar testimonios.
- Asociar fotografías y documentos.
- Registrar historias familiares y comunitarias.
- Preservar conocimientos tradicionales.
- Crear archivos digitales de memoria.
- Mantener evidencia y trazabilidad de los contenidos registrados.

---

### 6.1.4 Herbario Memoria Cultural

Proyecto para documentar especies vegetales relacionadas con la cultura, alimentación, medicina tradicional, agricultura y biodiversidad local.

Debe permitir:

- Registro de especies.
- Fotografías.
- Ubicación geográfica.
- Descripción.
- Usos tradicionales.
- Información cultural.
- Evidencias.
- Asociación con conocimientos ancestrales.

La información debe manejarse respetando los criterios de propiedad intelectual, consentimiento, privacidad y protección de conocimientos tradicionales que correspondan.

---

# 6.2 PROYECTOS DE INNOVACIÓN TECNOLÓGICA Y EXPANSIÓN

Esta línea corresponde a proyectos de segunda etapa de MELANTIA.

### Horizonte previsto

La planificación inicial establece como referencia comenzar su evaluación y desarrollo aproximadamente a partir de los 24 meses de puesta en marcha de MELANTIA.

Los 24 meses constituyen un horizonte de planificación y no una obligación automática de inversión.

La activación de cada proyecto dependerá de:

- Capital disponible.
- Ingresos y sostenibilidad de MELANTIA.
- Demanda real del mercado.
- Validación técnica.
- Viabilidad económica.
- Capacidad operativa.
- Resultados obtenidos durante la primera etapa.
- Requisitos legales y regulatorios.
- Disponibilidad de talento especializado.
- Riesgo tecnológico.
- Resultados de pruebas piloto.

Estos proyectos deben diseñarse desde el inicio como extensiones futuras de la arquitectura de MELANTIA, evitando reconstruir la plataforma cuando llegue el momento de implementarlos.

---

## 6.2.1 ROBÓTICA Y DRONES — OPERACIONES AUTÓNOMAS

Línea estratégica orientada a integrar drones, robótica, inteligencia artificial y automatización de operaciones agrícolas.

### A. Micro-SaaS de Diagnóstico Temprano

Desarrollar un servicio de software especializado capaz de procesar imágenes multiespectrales capturadas mediante drones.

El sistema podrá utilizar modelos de inteligencia artificial para identificar patrones asociados con:

- Estrés hídrico.
- Posibles deficiencias nutricionales.
- Posibles brotes de plagas.
- Zonas que requieren inspección.
- Variaciones en el estado del cultivo.

Flujo conceptual:

DRON
→ CAPTURA MULTIESPECTRAL
→ PROCESAMIENTO
→ IA
→ ANÁLISIS
→ MAPA DE ALERTAS
→ MELANTIA
→ RECOMENDACIÓN / INSPECCIÓN

La información generada deberá poder relacionarse con:

- Finca.
- Lote.
- Cultivo.
- Geolocalización.
- Fecha y hora.
- Evidencias.
- Trazabilidad.
- Historial agronómico.

Este proyecto deberá integrarse posteriormente con:

- Agricultura de Precisión.
- Visión Artificial.
- Visión Satelital.
- Clima Inteligente.
- Gestión de Fincas.
- Trazabilidad.
- Registro de Evidencias.

---

### B. Servicios de Aplicación Aérea de Ultra-precisión

Desarrollar una línea empresarial de servicios utilizando drones especializados para aplicaciones agrícolas de precisión.

Posibles servicios:

- Aplicación de productos agrícolas.
- Fertilización de precisión.
- Aplicaciones en terrenos de difícil acceso.
- Planificación de rutas.
- Registro de áreas tratadas.
- Registro de dosis.
- Evidencia de aplicación.
- Historial de operaciones.

Flujo conceptual:

FINCA
→ LOTE
→ CULTIVO
→ PLANIFICACIÓN
→ MISIÓN DEL DRON
→ APLICACIÓN
→ REGISTRO
→ EVIDENCIA
→ TRAZABILIDAD

Las afirmaciones sobre porcentajes de precisión, reducción de costos o ventajas frente a métodos tradicionales deberán validarse mediante pruebas técnicas y comerciales antes de utilizarse como promesas comerciales.

---

# 6.2.2 BIOTECNOLOGÍA APLICADA — REGENERACIÓN DE INSUMOS

Línea estratégica orientada al desarrollo de soluciones biotecnológicas para sistemas productivos rurales.

### A. Bio-fábricas de Insumos Personalizados

Desarrollar laboratorios o bio-fábricas rurales orientadas a la investigación, desarrollo y producción de:

- Biofertilizantes.
- Bioestimulantes.
- Biopesticidas.
- Soluciones basadas en microorganismos nativos.

Conceptualmente:

ANÁLISIS DEL SUELO
→ CARACTERIZACIÓN
→ INVESTIGACIÓN
→ MICROORGANISMOS / INSUMOS
→ FORMULACIÓN
→ VALIDACIÓN
→ APLICACIÓN
→ SEGUIMIENTO

El desarrollo de estos productos deberá contemplar investigación científica, bioseguridad, validación de eficacia, control de calidad y cumplimiento de la normativa aplicable.

La personalización de los insumos deberá considerarse una línea de investigación y desarrollo hasta contar con evidencia científica y validación suficiente.

---

### B. Sistemas Automáticos de Cultivos Celulares — Agricultura Celular

Línea de investigación orientada a desarrollar sistemas de producción biotecnológica utilizando residuos orgánicos de actividades agrícolas como materia prima.

Posibles áreas:

- Proteínas alternativas.
- Biomateriales.
- Materiales derivados de micelio.
- Aprovechamiento de residuos agrícolas.
- Sistemas automatizados de cultivo.
- Procesos de economía circular.

Flujo conceptual:

RESIDUOS AGRÍCOLAS
→ SELECCIÓN / PROCESAMIENTO
→ PROCESO BIOTECNOLÓGICO
→ CULTIVO / PRODUCCIÓN
→ PRODUCTO
→ VALIDACIÓN
→ ESCALAMIENTO

Este proyecto se considera de alta complejidad tecnológica y deberá desarrollarse inicialmente como investigación, prototipado y validación antes de plantear una operación comercial.

---

# 6.2.3 CONECTIVIDAD E INTELIGENCIA DE DATOS — IoT

Línea estratégica destinada a conectar la infraestructura física de las fincas con MELANTIA mediante sensores, comunicaciones, inteligencia artificial y modelos digitales.

### A. Gemelos Digitales de Campos de Cultivo

Desarrollar una plataforma capaz de representar digitalmente una finca o lote mediante información proveniente de diferentes fuentes.

Fuentes potenciales:

- Sensores IoT.
- Estaciones meteorológicas.
- Drones.
- Imágenes satelitales.
- Registros de campo.
- Información agronómica.
- Sistemas de riego.

Arquitectura conceptual:

SENSORES

- DRONES
- SATÉLITE
- REGISTROS DE CAMPO
  →
  PLATAFORMA DE DATOS
  →
  MODELO DIGITAL
  →
  IA
  →
  SIMULACIÓN / ALERTAS
  →
  PRODUCTOR

El gemelo digital podrá evolucionar hacia modelos capaces de representar:

- Estado del suelo.
- Humedad.
- Temperatura.
- Cultivo.
- Desarrollo.
- Riego.
- Nutrición.
- Condiciones climáticas.
- Incidencias.
- Producción.

Las metas de reducción de consumo de agua u otros indicadores deberán validarse mediante proyectos piloto antes de convertirse en compromisos comerciales.

---

### B. Estaciones de Conectividad Satelital y Redes Mesh

Desarrollar soluciones de conectividad rural para zonas con cobertura limitada o inexistente.

Posibles componentes:

- Estaciones de conectividad.
- Comunicación satelital.
- Redes Mesh.
- Sensores IoT.
- Sistemas de monitoreo.
- Comunicación entre dispositivos.
- Integración con maquinaria agrícola.
- Integración con sistemas de riego.
- Comunicación con drones y otros dispositivos.

Arquitectura conceptual:

INTERNET / SATÉLITE
→ ESTACIÓN RURAL
→ RED MESH
→ FINCAS
→ SENSORES / IoT / DRONES / MAQUINARIA
→ MELANTIA

Esta línea deberá mantener compatibilidad con la filosofía Offline-First de MELANTIA.

La conectividad no reemplazará el funcionamiento offline. La complementará permitiendo que los dispositivos y comunidades rurales puedan sincronizar información cuando exista una conexión disponible.

---

# 6.3 PRINCIPIO DE EXPANSIÓN DEL MÓDULO 6

Los proyectos futuros deberán construirse como extensiones de la plataforma MELANTIA y no como sistemas completamente aislados.

La arquitectura deberá permitir que:

- Gestión de Fincas proporcione información de los campos.
- Agricultura de Precisión proporcione datos técnicos.
- Visión Artificial procese imágenes.
- Visión Satelital aporte información geoespacial.
- Trazabilidad registre las operaciones.
- Evidencias conserve la documentación.
- IoT proporcione datos en tiempo real o diferido.
- Drones generen información y ejecuten operaciones.
- Inteligencia Artificial analice los datos.
- El sistema de sincronización permita operar con conectividad limitada.
- El Panel de Administración gestione los proyectos, operaciones y resultados.

Arquitectura futura:

FINCA
↓
SENSORES / DRONES / SATÉLITE
↓
MELANTIA DATA
↓
IA / ANALÍTICA
↓
GEMELO DIGITAL / DIAGNÓSTICO
↓
RECOMENDACIÓN / OPERACIÓN
↓
TRAZABILIDAD
↓
EVIDENCIA
↓
REPORTES

---

# 6.4 FASES DE IMPLEMENTACIÓN

## FASE 1 — 0 a 24 meses

Prioridad:

- Construcción del núcleo MELANTIA.
- MVP.
- Usuarios.
- Gestión de Fincas.
- Trazabilidad.
- Negocios Rurales.
- Asistencia Técnica.
- Evidencias.
- Suscripciones.
- Finanzas.
- Escuela de Campo.
- Comunidad.
- Funcionamiento Offline-First.
- Sincronización.
- Generación de ingresos.
- Validación del mercado.
- Construcción de la base tecnológica y de datos.

Los proyectos de alta complejidad tecnológica se mantienen en planificación, investigación y evaluación.

---

## FASE 2 — 24 meses en adelante

Evaluación y desarrollo progresivo de:

1. Robótica y Drones.
2. Micro-SaaS de Diagnóstico Temprano.
3. Servicios de Aplicación Aérea de Ultra-precisión.
4. Bio-fábricas de Insumos Personalizados.
5. Sistemas Automáticos de Cultivos Celulares.
6. Gemelos Digitales de Campos de Cultivo.
7. Estaciones de Conectividad Satelital.
8. Redes Mesh rurales.

La ejecución será progresiva y dependerá de los recursos y resultados obtenidos en la Fase 1.

---

# 6.5 REGLA ARQUITECTÓNICA

Aunque los proyectos de Fase 2 no se implementen durante el MVP, la arquitectura actual de MELANTIA debe evitar bloquear su futura incorporación.

Desde la Fase 1 se deben conservar correctamente:

- UUID.
- Geolocalización.
- Fincas.
- Lotes.
- Cultivos.
- Animales.
- Eventos.
- Trazabilidad.
- Evidencias.
- Fechas y horas.
- Historial.
- Datos de sensores cuando corresponda.
- Información de imágenes.
- Metadatos.
- Sincronización.
- Auditoría.
- Versionado.
- Integridad de archivos.
- APIs.
- Arquitectura modular.

No se deben implementar ahora sistemas complejos de robótica, biotecnología, IoT o gemelos digitales únicamente por anticipación. Se debe preparar la arquitectura para integrarlos posteriormente cuando exista una justificación técnica, económica y operativa.

---

# 6.6 PRINCIPIO DE INNOVACIÓN RESPONSABLE

Los proyectos de innovación de MELANTIA deberán pasar progresivamente por:

INVESTIGACIÓN
→ DISEÑO
→ PROTOTIPO
→ PRUEBA CONTROLADA
→ VALIDACIÓN
→ PILOTO
→ EVALUACIÓN ECONÓMICA
→ CUMPLIMIENTO REGULATORIO
→ ESCALAMIENTO

Ninguna tecnología deberá presentarse al usuario como validada, autónoma, precisa o capaz de generar determinados resultados hasta disponer de evidencia suficiente que respalde dicha afirmación.

La innovación debe integrarse con la misión principal de MELANTIA:

PRODUCTIVIDAD AGROPECUARIA INTELIGENTE OFFLINE.

---

## Módulo 7 — Escuela de Campo

Código:

```text
escuela_campo
```

Items:

- Cursos
- Prácticas Regenerativas

---

## Módulo 8 — Mi Comunidad Virtual

Código:

```text
comunidad_virtual
```

Items:

### Ciudadano Rural

- Noticias
- Proyectos/beneficios
- Programas
- Requisitos
- Trámites

### Asesoría Legal

- Guía Legal Rural
- Trámites
- Formularios
- Generación de documentos
- Denuncias
- Orientación sobre procesos
- Directorio de abogados

La aplicación orienta y genera documentos; no sustituye la representación legal.

### Walkie Talkie

- Comunicación de campo
- Comunicación entre usuarios
- SOS
- Futuras redes Mesh

La integración Mesh es una capacidad futura y no debe bloquear el MVP.

---

## Módulo 9 — Asistente Preventivo de Salud

Código:

```text
salud_preventiva
```

Items:

- Asistente Preventivo de Salud
- Guía de Primeros Auxilios y Respuesta Rápida
- Botiquín Casero Inteligente
- Ficha Médica / Historia Clínica

---

## Módulo 10 — Servicios Financieros MELANTIA

Código:

```text
servicios_financieros
```

Items:

- Apertura de Cuenta Digital
- Onboarding y Validación KYC
- Gestión de Pagos y Beneficios
- Simulación de Perfil Financiero
- Solicitar Microcrédito
- Transferencias y Movimientos
- Integración con Bancos y Cooperativas
- Historial y Estado de Cuenta

Las integraciones financieras reales deben implementarse con los controles de seguridad, identidad, cumplimiento y proveedores correspondientes.

---

## Módulo 11 — Registro de Evidencias y Documentos

Código:

```text
evidencias
```

Items:

- Registro de Evidencia Fotográfica
- Carpeta Documentos
- Descargar, Compartir e Imprimir

Además incorpora:

- verificación de integridad;
- hash SHA-256;
- cadena de custodia;
- auditoría;
- control de versiones;
- detección de discrepancias.

### Regla de inmutabilidad

La información original capturada en campo no puede ser sobrescrita desde la Web.

Una corrección genera un nuevo evento/versión.

### Verificación

La verificación compara:

```text
Hash registrado originalmente
              VS
Hash del archivo presentado
```

Resultado posible:

```text
ÍNTEGRO
```

o

```text
NO COINCIDE / POSIBLE ALTERACIÓN
```

El hash demuestra integridad respecto del archivo registrado; no demuestra por sí solo la veracidad del contenido.

---

## Módulo 12 — Finanzas Personales

Código:

```text
finanzas_personales
```

Items:

- Registro Financiero Inteligente
- Consejos y Alertas
- Termómetro Financiero
- Gráfica de Ingresos y Gastos

---

# 10. PLANES Y LÍMITES

> **Catálogo histórico.** El catálogo comercial del MVP es
> **$5 / $10 / $15** (§43.11); los nombres «Básico / Standard /
> Profesional» de esta sección se conservan como histórico. Nombres
> comerciales y entitlements definitivos: **pendientes de definición**
> (§45, P-05). No hardcodear valores en código.

Los límites pertenecen al backend y no deben depender únicamente de React.

## Plan Básico

El usuario puede:

- registrar y gestionar 1 finca;
- llevar seguimiento de 1 cultivo principal;
- llevar trazabilidad de 1 animal;
- utilizar el sistema offline;
- sincronizar;
- utilizar la Web;
- importar/exportar según las capacidades habilitadas;
- realizar 1 verificación de informe de cultivo por mes;
- realizar 1 verificación de informe de trazabilidad por mes.

## Plan Standard

- mayor capacidad de gestión;
- 4 verificaciones de documentos por mes;
- mayor almacenamiento según la configuración comercial del plan.

## Plan Profesional

- almacenamiento hasta el límite de GB contratado/permitido;
- capacidades superiores de gestión;
- verificaciones sujetas a la política del plan.

### Regla

Los límites deben implementarse como `entitlements` / capacidades del plan.

No dispersar reglas como:

```text
if plan == "basico"
```

por todo el código.

Centralizar:

```text
Subscription / Entitlements Service
```

## Licencia Institucional

Tipo de contrato **distinto de los planes de usuario**, para
instituciones que ejecutan proyectos usando MELANTIA como
infraestructura tecnológica.

- `$5.000/año` → hasta **20** líderes comunitarios patrocinados.
- `$10.000/año` → hasta **40** líderes comunitarios patrocinados.
- Los líderes patrocinados son **seleccionados por la institución**;
  el límite corresponde a accesos patrocinados y **NO** representa el
  número máximo de beneficiarios del proyecto.
- La comisión del **3 % por transacción** permanece **independiente**
  de la licencia.
- Condiciones diferenciadas: beneficiario del proyecto / líder
  comunitario patrocinado / usuario MELANTIA independiente.

Modelo completo en `docs/LICENCIA_INSTITUCIONAL.md`.

---

# 11. EXCEL

Excel es un formato de intercambio, no la base de datos principal.

```text
PostgreSQL
   |
   +--> Exportar Excel
   |
   +<-- Importar Excel
```

## Importación

```text
Excel
 ↓
Validación
 ↓
Normalización
 ↓
Vista previa
 ↓
Confirmación
 ↓
API
 ↓
PostgreSQL
```

No permitir que un Excel modifique directamente la base de datos.

## Exportación

Los datos exportados son copias de trabajo.

Modificar un Excel descargado no modifica automáticamente el registro original.

---

# 12. MODELO DE DATOS Y BASE DE DATOS

Estructura acordada:

```text
backend/database/
├── schema/
│   ├── extensions.sql
│   ├── geografia.sql
│   ├── usuarios.sql
│   ├── gestion_fincas.sql
│   ├── labores_pecuarias.sql
│   ├── trazabilidad.sql
│   ├── evidencias.sql
│   ├── negocios_rurales.sql
│   └── suscripciones.sql
├── functions/
│   ├── almacenamiento.sql
│   ├── comisiones.sql
│   └── timestamps.sql
├── indexes/
│   └── indexes.sql
└── seeds/
    ├── provincias.sql
    ├── cantones.sql
    └── datos_iniciales.sql
```

### Regla

Antes de ejecutar migraciones contra una base existente se debe inspeccionar el esquema actual.

No confiar únicamente en:

```sql
CREATE TABLE IF NOT EXISTS
```

porque eso no corrige definiciones existentes.

---

# 13. BACKEND

Estructura objetivo:

```text
backend/
├── core/
│   ├── config.py
│   ├── security.py
│   ├── dependencies.py
│   └── exceptions.py
│
├── database/
│
├── modules/
│   ├── suscripciones/
│   ├── asistente_tecnico/
│   ├── gestion_fincas/
│   ├── negocios_rurales/
│   ├── emprendimientos/
│   ├── proyectos/
│   ├── escuela_campo/
│   ├── comunidad_virtual/
│   ├── salud_preventiva/
│   ├── servicios_financieros/
│   ├── evidencias/
│   └── finanzas_personales/
│
└── shared/
    ├── auth/
    ├── storage/
    ├── sync/
    ├── notifications/
    └── audit/
```

Patrón:

```text
Router
  ↓
Service
  ↓
Repository / DB
  ↓
PostgreSQL
```

No poner toda la lógica de negocio dentro de los routers.

---

# 14. FRONTEND

```text
frontend/src/
├── app/
│   ├── app.config.js
│   ├── module.registry.js
│   ├── navigation.config.js
│   └── routes.jsx
│
├── modules/
│   ├── suscripciones/
│   ├── asistente_tecnico/
│   ├── gestion_fincas/
│   ├── negocios_rurales/
│   ├── emprendimientos/
│   ├── proyectos/
│   ├── escuela_campo/
│   ├── comunidad_virtual/
│   ├── salud_preventiva/
│   ├── servicios_financieros/
│   ├── evidencias/
│   └── finanzas_personales/
│
└── shared/
    ├── api/
    ├── auth/
    ├── offline/
    ├── storage/
    ├── notifications/
    ├── components/
    ├── hooks/
    └── utils/
```

---

# 15. PATRÓN DE DESARROLLO FRONTEND

Cada funcionalidad debe intentar seguir:

```text
Componente React
      ↓
Hook
      ↓
Service
      ↓
API client
      ↓
FastAPI Router
      ↓
Backend Service
      ↓
Repository / DB
      ↓
PostgreSQL
```

Para offline:

```text
Componente
      ↓
Hook
      ↓
Service
      ↓
Offline DB / API
      ↓
Sync Engine
```

---

# 16. DATOS LOCALES

En móvil se necesita una base local adecuada para:

- registros;
- configuraciones;
- datos necesarios offline;
- cola de sincronización;
- estados de sincronización.

La tecnología concreta debe evaluarse según el cliente móvil definitivo, pero el contrato arquitectónico es:

```text
Local DB
+
Sync Queue
+
Sync Engine
+
Conflict Resolution
```

No guardar información crítica únicamente en memoria de React.

---

# 17. CONFLICTOS DE SINCRONIZACIÓN

Nunca asumir:

```text
último que llegó = correcto
```

Debe existir una política de conflictos.

Ejemplo:

```text
Móvil A
registro versión 3

Móvil B
registro versión 3

Ambos modifican
        ↓
Servidor detecta conflicto
```

Resultado:

```text
conflict
```

La política específica se definirá por entidad.

Los registros de campo originales deben tener prioridad de conservación histórica.

---

# 18. EVIDENCIAS Y CADENA DE CUSTODIA

Para evidencias importantes:

```text
Archivo
 ↓
SHA-256
 ↓
Metadatos
 ↓
Registro inmutable
```

Metadatos relevantes:

```text
evidence_id
user_id
device_id
created_at
captured_at
location
file_type
file_size
sha256
storage_location
source_record_id
version
```

El hash es una prueba de integridad, no de verdad absoluta.

---

# 19. SEGURIDAD Y AUDITORÍA

Debe existir auditoría para operaciones importantes.

Ejemplo:

```text
Usuario
Dispositivo
Fecha/hora
Operación
Entidad
ID
Resultado
```

Especialmente:

- autenticación;
- sincronización;
- creación;
- correcciones;
- verificaciones;
- importaciones;
- exportaciones;
- operaciones financieras;
- cambios de permisos.

---

# 20. REUTILIZACIÓN DEL CÓDIGO ANTIGUO

El código antiguo no se elimina automáticamente.

Debe clasificarse:

```text
REUTILIZAR
REFACTORIZAR
MIGRAR
REEMPLAZAR
DESCARTAR
```

Los JSON antiguos de trazabilidad de cacao/café deben utilizarse como:

- plantillas;
- semillas;
- conocimiento;
- pruebas.

No deben convertirse en la arquitectura definitiva de almacenamiento.

La trazabilidad debe ser un motor genérico.

---

# 21. PRIORIDAD DEL MVP DE 1 MES

El objetivo no es terminar profundamente los 12 módulos.

El objetivo es conseguir un **MVP integrado y utilizable**.

## Semana 1 — Fundación

```text
[ ] Estructura frontend
[ ] Estructura backend
[ ] Configuración
[ ] PostgreSQL
[ ] FastAPI
[ ] React
[ ] API base
[ ] Autenticación
[ ] Usuarios
[ ] Geografía
[ ] UUID
[ ] Manejo de errores
[ ] Base de sincronización
```

## Semana 2 — Campo / Offline

```text
[ ] Base local móvil
[ ] Cola de sincronización
[ ] Detección Wi-Fi/datos
[ ] Sincronización automática por Wi-Fi
[ ] Confirmación por datos móviles
[ ] Fincas
[ ] Lotes
[ ] Pecuaria
[ ] Animales
[ ] Eventos
[ ] Evidencias
```

## Semana 3 — Trazabilidad y Negocios

```text
[ ] Motor de trazabilidad
[ ] Fases
[ ] Eventos
[ ] Cadena de custodia
[ ] Red Social Comercial
[ ] Marketplace
[ ] Mi Tienda
[ ] Bolsa
[ ] Ofertas
[ ] Demandas
[ ] Oportunidades
[ ] Transacciones
[ ] Comisión 3%
```

## Semana 4 — Web / Excel / Integración

```text
[ ] Web para laptop
[ ] Dashboard
[ ] Consulta de datos
[ ] Importación Excel
[ ] Validación Excel
[ ] Exportación Excel
[ ] Verificador de evidencias
[ ] SHA-256
[ ] Auditoría
[ ] Planes
[ ] Límites
[ ] Pruebas
[ ] Optimización
[ ] Corrección de errores
[ ] Preparación del MVP
```

---

# 22. QUÉ NO DEBE BLOQUEAR EL MVP

No intentar completar en el primer mes:

- Mesh avanzado;
- todas las integraciones bancarias;
- IA completamente entrenada;
- visión artificial avanzada;
- visión satelital avanzada;
- todos los servicios financieros reales;
- todos los contenidos de Escuela de Campo;
- todos los trámites legales;
- todos los modelos productivos posibles.

El MVP debe dejar las interfaces y arquitectura preparadas, pero priorizar el núcleo operativo.

---

# 23. SEGUNDA ETAPA: IA Y ASISTENTE TÉCNICO

Después de estabilizar el MVP:

```text
MELANTIA
   |
   +-- Knowledge Base
   |
   +-- RAG
   |
   +-- Modelos locales
   |
   +-- Modelos remotos
   |
   +-- Contexto de finca
   |
   +-- Contexto de cultivo
   |
   +-- Contexto pecuario
   |
   +-- Evidencias
   |
   +-- Historial
   |
   v
Asistente Técnico Rural
```

Primero evaluar:

1. modelo base;
2. RAG;
3. calidad del conocimiento;
4. contexto;
5. prompts;
6. herramientas.

El fine-tuning se realizará solamente cuando exista una necesidad demostrada.

---

# 24. REGLAS DE CALIDAD

Antes de considerar una funcionalidad terminada:

### Backend

```text
[ ] Endpoint probado
[ ] Validación
[ ] Autorización
[ ] Manejo de errores
[ ] Transacción DB correcta
[ ] Índices cuando corresponda
[ ] Auditoría si aplica
[ ] Idempotencia si aplica
```

### Frontend

```text
[ ] Estado de carga
[ ] Estado vacío
[ ] Estado de error
[ ] Sin conexión
[ ] Reintento
[ ] Feedback al usuario
[ ] No bloquear interfaz
[ ] Responsive
```

### Offline

```text
[ ] Funciona sin Internet
[ ] Guarda localmente
[ ] Aparece en cola
[ ] Sincroniza
[ ] Reintenta
[ ] Maneja conflicto
[ ] No duplica registros
```

---

# 25. REGLA DE TRABAJO DIARIO

Cada día debe terminar con una actualización de este documento.

Utilizar:

```text
## YYYY-MM-DD — Registro diario
```

Y completar:

### Objetivo del día

```text
-
-
-
```

### Realizado

```text
- [x]
- [x]
- [ ]
```

### Archivos modificados

```text
-
-
-
```

### Decisiones tomadas

```text
-
-
```

### Problemas encontrados

```text
-
-
```

### Próximo paso

```text
-
-
```

### Estado del MVP

```text
Backend:        XX%
Frontend:       XX%
Móvil/Offline:  XX%
Base de datos:  XX%
Sincronización: XX%
Excel:          XX%
Evidencias:     XX%
Negocios:       XX%
IA:             XX%
```

No utilizar porcentajes arbitrarios. El porcentaje debe representar el avance real de las tareas definidas.

---

# 26. REGLA ANTES DE ESCRIBIR NUEVO CÓDIGO

Antes de crear una nueva función, tabla, endpoint o componente:

1. Buscar si ya existe.
2. Determinar si puede reutilizarse.
3. Determinar si debe refactorizarse.
4. Verificar que no duplique una capacidad existente.
5. Revisar el módulo al que pertenece.
6. Revisar si afecta offline/sincronización.
7. Revisar permisos y planes.
8. Implementar.
9. Probar.
10. Actualizar este documento.

---

# 27. REGLA CONTRA LA DUPLICACIÓN

No crear estructuras separadas cuando el concepto sea genérico.

Ejemplos:

```text
NO:
mercado_platano
mercado_cacao
mercado_cafe

SÍ:
Marketplace
  └── productos/categorías
```

```text
NO:
trazabilidad_cacao_db
trazabilidad_cafe_db

SÍ:
Motor de trazabilidad
  └── plantillas/configuración
```

```text
NO:
tienda_virtual como módulo independiente

SÍ:
Marketplace
  └── Mi Tienda
```

---

# 28. CRITERIO PARA ACEPTAR UNA FUNCIÓN DEL MVP

Una funcionalidad se considera integrada cuando:

```text
UI
 ↓
Hook/estado
 ↓
Service
 ↓
API
 ↓
Backend
 ↓
DB
```

y, cuando corresponda:

```text
Offline
 ↓
Local DB
 ↓
Sync Queue
 ↓
API
 ↓
DB
```

No considerar terminada una pantalla solamente porque "se ve".

Debe existir conexión real con la lógica correspondiente.

---

# 29. ESTADO ACTUAL DEL PROYECTO

> Este bloque se actualiza diariamente.

## Fecha de inicio del seguimiento

```text
2026-09-22
```

## Estado inicial

```text
Arquitectura: definida y en consolidación
Frontend: estructura modular definida
Backend: estructura modular definida
Base de datos: esquema maestro revisado y en proceso de modularización
Offline-first: arquitectura definida
Mobile-first: definido como objetivo del MVP
Web/Laptop: orientada a gestión y Excel
Sincronización: política Wi-Fi/datos definida
Evidencias: integridad/hash/inmutabilidad definida
Planes: reglas iniciales definidas
Negocios Rurales: arquitectura conceptual definida
IA: etapa posterior al núcleo MVP
```

---

# 30. TABLERO PRINCIPAL DEL MVP

## Fundación

- [ ] Configuración de entorno
- [ ] FastAPI
- [ ] React
- [ ] PostgreSQL
- [ ] Autenticación
- [ ] UUID
- [ ] Manejo de errores
- [ ] API base

## Mobile

- [ ] Cliente móvil
- [ ] Base local
- [ ] Cola offline
- [ ] Sync Engine
- [ ] Detección Wi-Fi
- [ ] Confirmación datos móviles
- [ ] Carga bajo demanda
- [ ] Optimización baja gama

## Web

- [ ] Dashboard
- [ ] Consulta
- [ ] Reportes
- [ ] Importación Excel
- [ ] Exportación Excel
- [ ] Gestión documental

## Datos de campo

- [ ] Usuarios
- [ ] Fincas
- [ ] Lotes
- [ ] Pecuaria
- [ ] Animales
- [ ] Eventos
- [ ] Trazabilidad
- [ ] Evidencias

## Negocios

- [ ] Red Social Comercial
- [ ] Marketplace
- [ ] Mi Tienda
- [ ] Bolsa
- [ ] Oportunidades
- [ ] Ferias
- [ ] Transacciones
- [ ] Comisión 3%

## Evidencias

- [ ] Almacenamiento
- [ ] SHA-256
- [ ] Verificador
- [ ] Cadena de custodia
- [ ] Auditoría
- [ ] Inmutabilidad
- [ ] Control de versiones

## Suscripciones

- [ ] Plan Básico
- [ ] Plan Standard
- [ ] Plan Profesional
- [ ] Entitlements
- [ ] Límites
- [ ] Consumo mensual
- [ ] Almacenamiento

## IA

- [ ] Knowledge base
- [ ] Chunking
- [ ] Embeddings
- [ ] Retriever
- [ ] RAG
- [ ] Evaluación del modelo
- [ ] Asistente técnico

---

# 31. REGLA FINAL DEL PROYECTO

MELANTIA no debe crecer agregando código sin control.

Debe crecer agregando **capacidades dentro de una arquitectura estable**.

Cada nueva funcionalidad debe responder:

```text
¿Dónde pertenece?
¿Existe algo parecido?
¿Funciona offline?
¿Cómo sincroniza?
¿Qué datos utiliza?
¿Qué permisos necesita?
¿Afecta un plan?
¿Necesita auditoría?
¿Puede funcionar en baja gama?
¿Carga bajo demanda?
¿Tiene conexión real con backend?
```

Si la respuesta es clara, se implementa.

Si no es clara, primero se resuelve la arquitectura.

---

# 32. PRÓXIMA ACCIÓN

El siguiente trabajo debe ejecutarse sobre el código real existente, no crear una arquitectura paralela.

Orden recomendado:

1. Revisar estructura real del repositorio.
2. Revisar backend existente.
3. Revisar rutas FastAPI.
4. Revisar base de datos real.
5. Comparar con este plano maestro.
6. Identificar qué ya existe.
7. Identificar qué debe refactorizarse.
8. Identificar qué falta.
9. Crear el backlog de la Semana 1.
10. Implementar una capacidad completa de extremo a extremo.
11. Probar.
12. Registrar el avance aquí.

**No avanzar creando código duplicado si ya existe una implementación utilizable.**

---

# 33. REGISTRO DIARIO

## 2026-09-22

### Objetivo

Consolidar la arquitectura definitiva del MVP considerando:

- móvil;
- Web;
- trabajo offline;
- sincronización;
- Wi-Fi/datos móviles;
- baja gama;
- carga bajo demanda;
- Excel;
- inmutabilidad;
- evidencias;
- planes;
- los 12 módulos;
- escalabilidad.

### Estado

- [x] Arquitectura Mobile-first definida.
- [x] Arquitectura Offline-first definida.
- [x] Política de sincronización por Wi-Fi/datos definida.
- [x] Web orientada a laptop y gestión de información definida.
- [x] Excel como formato de intercambio definido.
- [x] Registros originales de campo protegidos contra sobrescritura.
- [x] Verificación de integridad mediante hash definida.
- [x] Límites iniciales de planes definidos.
- [x] Los 12 módulos consolidados.
- [x] Estructura frontend/backend consolidada.
- [x] Hoja de ruta de MVP de 1 mes definida.

### Próximo objetivo

Revisar el repositorio real y comenzar la **Semana 1 — Fundación**, priorizando una primera funcionalidad completamente conectada:

```text
Frontend
   ↓
API
   ↓
FastAPI
   ↓
PostgreSQL
```

y preparando desde el inicio:

```text
Offline
+
UUID
+
Sync
+
Auditoría
+
Planes
```

---

# 34. REGLA DE ACTUALIZACIÓN DE ESTE ARCHIVO

Este archivo es el **registro maestro del proyecto**.

Cada vez que se complete una tarea importante:

1. actualizar el estado;
2. registrar la fecha;
3. registrar archivos afectados;
4. registrar decisiones;
5. registrar problemas;
6. registrar el siguiente paso.

No borrar decisiones históricas importantes.

Si una decisión cambia, documentar:

```text
DECISIÓN ANTERIOR
↓
MOTIVO DEL CAMBIO
↓
NUEVA DECISIÓN
↓
FECHA
```

De esta forma, cualquier desarrollador o IA que trabaje posteriormente sobre MELANTIA puede leer este archivo y comprender:

- qué es MELANTIA;
- cómo está organizada;
- qué se está construyendo;
- qué decisiones ya fueron tomadas;
- qué falta;
- qué no debe duplicarse;
- cómo debe funcionar offline;
- cómo debe sincronizar;
- cómo debe proteger los datos;
- y cuál es el siguiente paso del proyecto.

---

# 35. VISIÓN ESTRATÉGICA — ECOSISTEMA MELANTIA

La visión de largo plazo de MELANTIA se amplía desde una aplicación agropecuaria hacia un **ecosistema digital inteligente para la economía rural**.

> **MELANTIA — El ecosistema digital inteligente para la economía rural.**

MELANTIA no debe limitarse a ser una aplicación para agricultores. Debe evolucionar hacia una plataforma donde productores, profesionales, emprendedores, comercios, compradores y otros actores rurales puedan:

- producir y gestionar información productiva;
- prestar y contratar servicios profesionales;
- aprender y capacitarse;
- comunicarse;
- comprar y vender;
- gestionar proyectos;
- recibir recompensas mediante MELANTIOS cuando corresponda;
- utilizar servicios financieros e integraciones de pago;
- trabajar en campo y continuar posteriormente en oficina;
- utilizar inteligencia artificial como capa transversal de asistencia e interpretación de datos.

## 35.1 Capas estratégicas

```text
                         MELANTIA
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          PRODUCCIÓN     SERVICIOS     COMERCIO
              │             │             │
              └─────────────┼─────────────┘
                            │
                      DATOS RURALES
                            │
                            ▼
                       MELANTIA IA
                            │
                            ▼
                      INTELIGENCIA
                            │
                            ▼
                      ECONOMÍA RURAL
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
             MELANTIOS              PAGOS
                 │                     │
                 └──────────┬──────────┘
                            ▼
                     SERVICIOS DE
                     CUENTA / WALLET
                            │
                            ▼
                    FUTURA TARJETA
                      MELANTIA
```

La representación de wallet, cuenta y tarjeta corresponde a una visión estratégica de largo plazo. Cualquier servicio financiero real deberá implementarse mediante proveedores autorizados y bajo los requisitos legales, regulatorios, de seguridad y KYC que correspondan.

## 35.2 Tres superficies de trabajo

La evolución del ecosistema debe contemplar tres superficies complementarias:

```text
                    ECOSISTEMA MELANTIA
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      APP MÓVIL         APP WEB          SERVICIOS
        CAMPO           OFICINA         PROFESIONALES
          │                 │                 │
          ▼                 ▼                 ▼
      Captura GPS       Procesamiento     Drones / RTK
      Levantamientos    Planos            Fotogrametría
      Fotografías       Informes          MDT / MDS
      Evidencias        GIS               Servicios de campo
      Offline           Excel / PDF
```

### App móvil — campo

Prioridad para:

- captura de información;
- GPS;
- levantamientos;
- fotografías;
- evidencias;
- muestras;
- observaciones;
- trazabilidad;
- trabajo offline;
- sincronización posterior.

### App Web — oficina

Prioridad para:

- continuar proyectos iniciados en campo;
- consultar información;
- procesar datos;
- visualizar planos y mapas;
- generar informes;
- gestionar documentos;
- importar/exportar Excel;
- revisar evidencias;
- administrar proyectos y actividades.

### Servicios profesionales

Corresponden a capacidades avanzadas que podrán integrarse progresivamente:

- agricultura de precisión;
- GIS;
- RTK/GNSS;
- drones;
- fotogrametría;
- MDT/MDS;
- procesamiento especializado;
- servicios técnicos de campo.

Estas capacidades no forman parte del MVP por el solo hecho de estar contempladas en la visión. Se desarrollarán cuando exista justificación técnica, económica, operativa y regulatoria.

### Administración — operación del ecosistema

A las superficies de trabajo se añade la capa transversal de
**Administración** (móvil/campo, Web/oficina, administración/operación),
que usa el mismo backend FastAPI. Ver §42 y `docs/ADMINISTRACION.md`.

---

# 36. ECOSISTEMA PROFESIONAL — CAPA TRANSVERSAL DE TRABAJO

La arquitectura futura de MELANTIA deberá incorporar el concepto de **Ecosistema Profesional (EP)** como capa transversal de trabajo profesional.

No será inicialmente un módulo aislado, sino una entidad de coordinación que permita relacionar información procedente de diferentes módulos y servicios. Dentro del EP, la unidad concreta de trabajo se denomina **Proyecto** (ver §36.7 para la terminología definitiva).

## 36.1 Objetivo

Un Proyecto debe permitir que un trabajo pueda comenzar en el campo, continuar en la oficina y terminar en uno o varios entregables técnicos, manteniendo la relación entre personas, finca, lote, actividades, datos, evidencias y documentos.

Ejemplo:

```text
PROYECTO
"Levantamiento Finca El Carmen"
        │
        ├── Cliente
        ├── Profesional
        ├── Finca
        ├── Lote(s)
        ├── Agenda
        ├── Actividades
        ├── Levantamientos
        ├── Mediciones
        ├── Fotografías
        ├── Evidencias
        ├── Documentos
        ├── Archivos GIS
        ├── Procesamientos
        ├── Informes
        └── Historial / Auditoría
```

## 36.2 Flujo campo → oficina

```text
                         CAMPO
                           │
                           ▼
                    MELANTIA MÓVIL
                           │
                     CAPTURA OFFLINE
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
         GPS             FOTOS          EVIDENCIAS
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                         SYNC
                           │
                           ▼
                    MELANTIA WEB
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
        PLANOS          INFORMES        ARCHIVOS
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                       ENTREGABLE
```

El mismo proyecto debe conservar su identidad durante todo el ciclo de trabajo.

## 36.3 Relación con los módulos existentes

El Ecosistema Profesional debe poder relacionarse progresivamente con:

- Gestión de Fincas;
- Trazabilidad;
- Asistente Técnico Rural;
- Agricultura de Precisión;
- Levantamientos;
- Evidencias y Documentos;
- Agenda;
- Operaciones;
- Notificaciones;
- Informes;
- almacenamiento;
- auditoría;
- proyectos estratégicos (M6 — proyectos de impacto, distintos de la unidad de trabajo profesional).

No se deben crear copias independientes de una finca, lote, evidencia o levantamiento para cada profesión.

La información debe conservar una única fuente de verdad y utilizar relaciones entre entidades.

## 36.4 Perfiles profesionales

El modelo debe poder soportar múltiples perfiles por usuario. Entre otros:

- productor;
- agrónomo/agropecuario;
- médico veterinario;
- ingeniero forestal;
- profesional ambiental;
- ingeniero civil;
- arquitecto;
- abogado;
- transportista;
- emprendedor;
- otros perfiles profesionales que posteriormente se incorporen.

Un usuario podrá seleccionar más de un rol/profesión cuando corresponda.

La interfaz deberá adaptar la experiencia al perfil, pero el backend mantendrá una arquitectura común.

## 36.5 Espacios profesionales

A largo plazo, MELANTIA podrá ofrecer espacios profesionales especializados dentro de una arquitectura genérica de **Workspace**, por ejemplo:

- Estudio Jurídico;
- Oficina Agronómica;
- Consultorio Veterinario Rural;
- Oficina Forestal;
- Consultoría Ambiental;
- Oficina de Ingeniería;
- Oficina de Arquitectura.

Estos espacios no deben convertirse en aplicaciones independientes. Deben reutilizar los servicios transversales de MELANTIA.

## 36.6 Experiencia adaptativa

La complejidad debe residir principalmente en el motor, no en la interfaz.

### Usuario básico / productor

- botones grandes;
- voz;
- pasos guiados;
- lenguaje sencillo;
- asistencia contextual.

### Usuario general

- interfaz gráfica completa;
- asistente;
- formularios;
- mapas;
- consultas.

### Profesional

- tablas;
- filtros;
- herramientas geoespaciales;
- proyectos;
- documentos;
- informes;
- exportaciones;
- atajos y herramientas avanzadas.

El sistema debe permitir que un mismo motor sirva a distintos niveles de experiencia.

## 36.7 Diseño arquitectónico — estado

**Documento:** `docs/ECOSISTEMA_PROFESIONAL.md` (2026-09-29)

**Terminología definitiva:** la capa transversal se denomina
**Ecosistema Profesional (EP)**; la unidad concreta de trabajo se
denomina **Proyecto**. Los *proyectos estratégicos del M6* son un
concepto distinto, siempre calificado.

La arquitectura conceptual del `Ecosistema Profesional` ya fue definida:

- el Proyecto es una **capa de organización y contexto** que referencia
  recursos existentes — no los duplica ni posee;
- la propiedad del dato (`usuario_id`) no se transfiere; el proyecto
  otorga acceso contextual mediante **participantes con rol por proyecto**;
- se distinguen perfil profesional (qué es el usuario), workspace (la
  oficina permanente), proyecto (el encargo finito) y rol (función en el
  proyecto);
- se definen flujo campo→oficina, agenda/actividades transversales,
  datos originales vs derivados, auditoría, offline-first, mapa de
  integración M1–M12 y fases EP-0…EP-9.

**Todavía NO se implementa en base de datos.**

- No se ha agregado `proyecto_id` a ninguna tabla.
- No se ha creado la entidad `Proyecto` en PostgreSQL.
- Primero se validará el modelo conceptual; posteriormente se diseñará
  el modelo de datos (EP-1) y después se implementará progresivamente.
- Las 9 decisiones pendientes del modelo de datos quedan registradas en
  `docs/ECOSISTEMA_PROFESIONAL.md` §20.

---

# 37. AGENDA, ACTIVIDADES Y OPERACIONES TRANSVERSALES

La visión del Ecosistema Profesional requiere servicios transversales que no deben duplicarse dentro de cada módulo.

MELANTIA deberá evolucionar hacia:

```text
AGENDA
   +
ACTIVIDADES
   +
OPERACIONES
   +
RECORDATORIOS
   +
NOTIFICACIONES
```

Estos servicios podrán utilizarse para:

- citas;
- visitas a fincas;
- levantamientos;
- entregas;
- retiros de productos;
- transporte;
- audiencias y actividades jurídicas;
- consultas veterinarias;
- actividades agronómicas;
- cursos;
- inspecciones;
- reuniones;
- tareas de proyectos.

## 37.1 Planificación de desplazamientos

Cuando exista información suficiente, MELANTIA podrá calcular una hora recomendada de salida utilizando:

```text
hora de actividad
+
tiempo estimado de viaje
+
margen configurado
=
hora recomendada de salida
```

Ejemplo conceptual:

```text
Actividad: 10:00
Viaje estimado: 32 min
Margen: 15 min
Salida recomendada: 09:13
```

Cuando exista conectividad, podrán utilizarse proveedores de rutas/tiempo de viaje disponibles. Sin conectividad, MELANTIA podrá utilizar estimaciones locales basadas en distancia y datos disponibles.

Las estimaciones offline no deberán presentarse como información exacta de tráfico en tiempo real.

## 37.2 Asistencia por voz

La IA podrá ayudar a convertir instrucciones naturales en actividades estructuradas.

Ejemplo:

> “MELANTIA, mañana tengo que ir a una finca.”

El asistente deberá guiar la creación del evento, solicitando únicamente la información que falte.

---

# 38. HOJA DE RUTA DEL ECOSISTEMA — EVOLUCIÓN POR FASES

La visión estratégica no modifica el objetivo del MVP. Lo amplía mediante una hoja de ruta progresiva.

## Fase 1 — Fundación y MVP

Prioridades:

- autenticación;
- usuarios;
- fincas;
- lotes;
- trazabilidad base;
- evidencias;
- negocios;
- suscripciones;
- asistente técnico base;
- PostgreSQL;
- API FastAPI;
- React;
- arquitectura offline-first;
- sincronización base;
- GPS y levantamiento básico;
- Web de gestión;
- Excel;
- auditoría.

## Fase 2 — Plataforma profesional inicial

Después de estabilizar el MVP:

- Ecosistema Profesional (proyectos y workspaces);
- Agenda transversal;
- actividades y operaciones;
- informes técnicos;
- exportaciones profesionales;
- planos;
- UTM y herramientas geoespaciales adicionales;
- espacios profesionales;
- documentos y firmas preparados para integración compatible;
- mejoras de sincronización;
- RAG y asistencia técnica avanzada.

## Fase 3 — Geoespacial y servicios profesionales avanzados

Según demanda, capital y validación:

- GIS avanzado;
- DEM/MDT/MDS;
- ortomosaicos;
- fotogrametría;
- RTK/GNSS;
- integración con drones;
- procesamiento especializado;
- servicios profesionales de campo.

## Fase 4 — Innovación y expansión, horizonte 24+ meses

Evaluación progresiva de:

- Robótica y Drones;
- Micro-SaaS de Diagnóstico Temprano;
- Servicios de Aplicación Aérea de Ultra-precisión;
- Biotecnología Aplicada;
- Bio-fábricas de Insumos Personalizados;
- Sistemas Automáticos de Cultivos Celulares;
- Gemelos Digitales de Campos de Cultivo;
- conectividad satelital;
- redes Mesh;
- proyectos de captura de carbono.

El horizonte de 24+ meses es una referencia de planificación, no una obligación de inversión.

---

# 39. PRINCIPIOS DE EVOLUCIÓN DEL ECOSISTEMA

Toda capacidad futura deberá respetar estas reglas:

1. **No duplicar entidades de dominio.** Una finca, lote, usuario, evidencia o levantamiento debe tener una fuente de verdad.
2. **Diseñar primero la relación entre entidades y después la interfaz.**
3. **Mantener API-first.** Móvil, Web y futuros clientes utilizan servicios comunes.
4. **Mantener Offline-first.** Las capacidades de campo deben seguir funcionando sin Internet cuando técnicamente sea posible.
5. **Mantener sincronización transversal.** No crear un sistema de sync diferente por módulo.
6. **Mantener auditoría.** Las operaciones profesionales, documentos y cambios relevantes deben poder rastrearse.
7. **Mantener evidencia.** Los resultados técnicos deben poder relacionarse con sus fuentes de datos.
8. **Separar dato original de dato derivado.** Un cálculo aplicado a un lote no elimina los datos que lo originaron.
9. **Separar captura de procesamiento.** El teléfono puede capturar; la Web o infraestructura especializada puede procesar cargas pesadas.
10. **No presentar precisión que el instrumento no puede garantizar.** El GPS de teléfono no debe presentarse como levantamiento cadastral/topográfico de alta precisión cuando se requiera instrumentación especializada.
11. **No construir capacidades avanzadas únicamente por anticipación.** Deben existir demanda, justificación y capacidad de validación.
12. **La IA es transversal, no un módulo aislado.** Debe asistir al usuario sobre datos y procesos autorizados.
13. **La complejidad debe estar en el motor.** La interfaz debe adaptarse al nivel del usuario.
14. **Preparar la arquitectura antes de realizar inversiones físicas.**
15. **Cada nueva capacidad debe pasar por evaluación técnica, económica, operativa y regulatoria cuando corresponda.**

---

# 40. ESTADO DE LA VISIÓN ESTRATÉGICA

### Decisiones consolidadas

- [x] MELANTIA se define como ecosistema digital inteligente para la economía rural.
- [x] Se mantienen tres superficies: móvil/campo, Web/oficina y servicios profesionales.
- [x] Se incorpora el concepto de Ecosistema Profesional como capa transversal de trabajo (Proyecto = unidad de trabajo).
- [x] Se define el flujo campo → sincronización → oficina → entregable.
- [x] Se contempla soporte para múltiples perfiles/profesiones.
- [x] Se define una arquitectura de Workspace reutilizable.
- [x] Se incorpora Agenda/Actividades/Operaciones como servicios transversales.
- [x] Se mantiene el principio Offline-first.
- [x] Se mantiene el principio de no duplicación de entidades.
- [x] Se mantienen las capacidades avanzadas de drones, RTK, fotogrametría, MDT/MDS, GIS, IoT y biotecnología como evolución progresiva.
- [x] Se mantiene el horizonte de 24+ meses para los proyectos de innovación y expansión.

### Diseño arquitectónico — resuelto en `docs/ECOSISTEMA_PROFESIONAL.md`

- [x] Modelo conceptual detallado del Ecosistema Profesional → §2, §4, §6.
- [x] Relación entre proyecto, cliente, profesional, finca y lote → §7.
- [x] Modelo de participantes y permisos de proyecto → §14.
- [x] Modelo de actividades y entregables → §6, §10.
- [x] Integración con Agenda → §10.
- [x] Integración con Evidencias y Documentos → §12.
- [x] Integración con Levantamientos → §7, §16.
- [x] Integración con Informes → §8, §11.
- [x] Diseño de Workspace → §9.
- [x] Diseño de experiencia adaptativa por perfil → §9.

### Pendiente tras el diseño

- [ ] Validación del modelo conceptual con el equipo.
- [ ] Aprobación del modelo de datos propuesto en
      `docs/EP_MODELO_DATOS.md` (EP-1: resuelve D1–D9 — vínculo central
      `ep_proyecto_recursos`, participantes, workspace, actividades/
      agenda transversales, `audit_eventos`, contexto en outbox, nombres
      `ep_*`). 0 SQL ejecutado; DDL solo tras aprobación.

### Regla de implementación

El diseño conceptual del Ecosistema Profesional debe realizarse **antes de agregar relaciones permanentes en la base de datos** que puedan generar migraciones innecesarias.

No se debe crear todavía un conjunto masivo de tablas solo para anticipar funcionalidades futuras.

Primero:

```text
CONCEPTO
→ RELACIONES
→ RESPONSABILIDADES
→ PERMISOS
→ FLUJOS
→ MODELO DE DATOS
→ IMPLEMENTACIÓN
```

---

# 41. REGISTRO DE ACTUALIZACIÓN — VISIÓN ESTRATÉGICA

## 2026-09-29

### Objetivo

Incorporar al Plano Maestro la visión estratégica de largo plazo definida para MELANTIA como ecosistema digital inteligente para la economía rural y plataforma de trabajo de campo + oficina técnica.

### Decisiones incorporadas

- Ecosistema Profesional como capa transversal de trabajo (Proyecto = unidad).
- Continuidad campo → Web → entregable.
- Tres superficies: App móvil, App Web y servicios profesionales.
- Soporte para múltiples profesiones y perfiles.
- Workspace profesional reutilizable.
- Agenda, actividades, operaciones y recordatorios como infraestructura transversal.
- Evolución progresiva hacia GIS, RTK/GNSS, drones, fotogrametría, MDT/MDS e IoT.
- Proyectos de innovación tecnológica y expansión en horizonte 24+ meses.
- Principios para evitar duplicación, sobrearquitectura y promesas técnicas no validadas.

### Estado

La visión queda **incorporada a la planificación**, pero su implementación será progresiva y no altera el alcance inmediato del MVP ni autoriza automáticamente el desarrollo de las capacidades avanzadas.

### Próximo trabajo arquitectónico relacionado

Después de estabilizar las capacidades transversales inmediatas, diseñar conceptualmente el `Ecosistema Profesional` antes de crear relaciones permanentes adicionales en PostgreSQL.

## 2026-09-29 — Diseño arquitectónico Ecosistema Profesional

### Objetivo

Completar el diseño conceptual del `Ecosistema Profesional` pendiente en
§40, sin convertir decisiones conceptuales en decisiones de base de
datos. (Documentado inicialmente como "Proyecto Profesional"; terminología
definitiva adoptada el mismo día: EP = capa, Proyecto = unidad.)

### Realizado

- [x] Auditoría del repositorio real (5 módulos backend, 8 frontend,
      32 tablas, sin agenda/profesionales/proyectos existentes).
- [x] Documento `docs/ECOSISTEMA_PROFESIONAL.md` creado (21 secciones).
- [x] §40 actualizado: pendientes de diseño → resueltos.
- [x] §36.7 añadido: estado del diseño.

### Decisiones

- Proyecto = capa de organización/contexto; referencia n:n con metadatos,
  no propiedad ni duplicación.
- Solo tres conceptos nuevos identificados: proyecto, participación,
  actividad. Todo lo demás es referencia, servicio o derivado.
- Perfil profesional ≠ rol de proyecto ≠ workspace.

### No realizado

Cero cambios en PostgreSQL, código, API, frontend, auth o sync. Sin
`proyecto_id`. Fases EP-1…EP-9 pendientes de autorización.

### Próximo paso

Validar el modelo conceptual → si se aprueba, EP-1 (modelo de datos).

### 2026-09-29 (bis) — EP-1 propuesto, sin ejecutar

- [x] `docs/EP_MODELO_DATOS.md` creado: resolución propuesta de D1–D9.
- [x] D1 → tabla de enlace central polimórfica `ep_proyecto_recursos`
      (referencia n:n; cero cambios a tablas existentes).
- [x] 8 tablas nuevas propuestas: 5 `ep_*`/profesional + 3 transversales
      (`actividades`, `agenda_eventos`, `audit_eventos`).
- [x] Cero columnas nuevas en tablas existentes; cero `proyecto_id`
      fuera de `ep_proyecto_*`.
- [x] **EP-1 aprobado conceptualmente** (D1→enlaces por tipo, D5→sin
      ubicación propia, D8→`ep_` selectivo, D9→contexto extensible).
- [x] **EP-2 completado** (`docs/EP_INTEGRACION.md`): verificado contra
      schema real — 13 tablas viables; `ep_proyecto_evidencias` e
      `ep_proyecto_informes` diferidos a rediseño M11 (B2); doble fuente
      de plan (B5) documentada.
- [ ] DDL EP pendiente de autorización → transacción controlada.

### 2026-09-29 (ter) — EP-3: DDL propuesto, no ejecutado

- [x] `backend/database/schema/ecosistema_profesional.sql` creado —
      **marcado NO EJECUTADO** en cabecera.
- [x] 13 tablas propuestas + 29 índices; revisión estática en
      `docs/EP_DDL_REVISION.md` (checklist completo por tabla).
- [x] Cero ALTER a tablas existentes → rollback = DROP en orden inverso.
- [x] Diferidas a B2: `ep_proyecto_evidencias`, `ep_proyecto_informes`.
### 2026-09-29 (quat) — EP-3.2/EP-3.3: DDL ejecutado y validado

- [x] Backup `backups/melantia_pre_ep3.sql` (pg_dump, 32 tablas).
- [x] Estado previo: 32 tablas · 71 FK · 100 índices · 32 PK.
- [x] Ejecución `psql -1` (BEGIN→COMMIT único): 13 CREATE TABLE +
      29 CREATE INDEX, sin errores.
- [x] Estado posterior: **45 tablas** — 32 preexistentes intactas +
      13 EP; 27 FK nuevas (17 CASCADE / 10 SET NULL); 8 UNIQUE;
      CHECKs verificados.
- [x] Regresión: **pytest 91/91 passed**.
- [x] Pruebas funcionales con datos `EP3_TEST`: inserts completos,
      CHECK/UNIQUE negativos, SET NULL (workspace→proyecto), CASCADE
      (proyecto→participantes+vínculos). Limpieza total: 0 filas EP.
- [x] **EP-3 cerrado.** Pendientes: `ep_proyecto_evidencias` /
      `ep_proyecto_informes` (B2) y entitlements (B5).
### 2026-09-29 (quin) — EP-4A: identidad profesional implementada

- [x] Seed `database/seeds/perfiles_profesionales.sql` ejecutado —
      6 perfiles activos (agronomo, veterinario, tecnico_agricola,
      topografo, administrador_finca, consultor_rural).
- [x] Módulo nuevo `modules/ecosistema_profesional/` + repository
      `shared/repositories/perfiles_profesionales.py`.
- [x] Endpoints `/api/v1/ep/perfiles`: GET catálogo, GET míos,
      POST asignar (201), DELETE desasignar (204).
- [x] Regla UUID: `perfil_id` = FK real; `codigo` solo semántico —
      rechazo 422 a códigos en el request.
- [x] Aislamiento por `usuario_id` en todas las operaciones;
      404 sin revelar existencia ajena; 409 en asignación duplicada.
- [x] **pytest 114/114** (91 previos + 23 nuevos EP-4A).
- [ ] Pendientes: CRUD catálogo (ADM), verificación de credenciales,
      EP-4B workspaces (diseño primero).

### 2026-09-29 (sex) — Semántica de trabajo EP (pre-EP-4C)

- [x] `ECOSISTEMA_PROFESIONAL.md` §2.5: separación organizacional (EP)
      vs agronómico/espacial (campo): Proyecto, Actividad, Evento de
      agenda | Unidad de Gestión, Área/Sector, Operación de campo.
- [x] Proyecto = contenedor general (no actividad ni operación);
      Actividad = coordinación que puede referenciar una Operación,
      nunca duplicarla.
- [x] Colisiones registradas: `feria_operaciones` (comercial) y
      `usuarios.sector_comunidad` (geográfico) → "operación" y "sector"
      siempre calificados.
- [x] UG/Área/Sector viven en el dominio espacial — el EP solo los
      referencia, nunca tablas `ep_*`.

### 2026-09-29 (sept) — EP-4B: workspaces implementado

- [x] `shared/repositories/workspaces.py` +
      `modules/ecosistema_profesional/{routes,schemas,services}/workspaces.py`.
- [x] Endpoints `/api/v1/ep/workspaces`: crear (auto-propietario),
      listar míos, detalle+miembros, PATCH (gestor), invitar
      (invitado→aceptar), PATCH/DELETE miembros.
- [x] Reglas: aislamiento 404 ajeno; gestión solo propietario/socio;
      fundador no removible/degradable; último propietario activo
      protegido; remoción = estado 'removido' (historial preservado).
- [x] **pytest 146/146** (114 previos + 32 nuevos EP-4B).
- [ ] Pendientes: transferencia de propiedad, límites por plan (B5),
      EP-4C proyectos (diseño primero).

### 2026-09-29 (oct) — EP-4C: rediseño conceptual (sin implementación)

- [x] Modelo de trabajo ampliado documentado en `EP_MODELO_DATOS` §12:
      Visita/Servicio puntual (sin proyecto) → Resultado → Proyecto;
      Proyecto → Programas → Fases (IA propone → profesional aprueba) →
      Actividades → Operaciones de campo (referenciadas, nunca duplicadas).
- [x] Presupuesto consolidado actividad→programa→proyecto (entidad
      futura); propuesta técnica/económica generable por IA como
      borrador aprobable.
- [x] Cliente profesional: cartera (entidad futura
      `clientes_profesionales`) vs rol `cliente` en proyecto — dos
      sentidos separados; clasificación flexible/privada.
- [x] Visibilidad aprobada: propietario del workspace ve detalle
      completo de sus proyectos anclados (sustituye regla anterior).
- [x] **Decisión aprobada — membresías removidas:** `removido → activo`
      reutilizando la fila existente (sin nueva fila ni nueva
      incorporación;
      aplica a `workspace_miembros` y `ep_proyecto_participantes`).
      Resuelve el pendiente de EP-4B sin cambio de DDL.
- [x] Workspace: nombre mutable sin romper UUID/proyectos/historial;
      capacidad de equipo delegada a entitlements (B5), nunca
      hardcodeada en EP.
- [x] Adecuación DDL: `ep_proyectos` suficiente; evolución futura
      documentada (rol `administrador`, `ep_programas`, `ep_fases`,
      `ep_visitas`, `ep_presupuestos`, `ep_propuestas`,
      `clientes_profesionales`) — `EP_DDL_REVISION` §5.
- [ ] Decisiones pendientes de aprobación: D-C2, D-C4, D-C5,
      D-C8 (`EP_MODELO_DATOS` §12.11). Implementación EP-4C no iniciada.
      (D-C1 resuelta en el cierre EP-4D 2026-09-30: gate = Plan
      Profesional vigente, nunca Perfil Profesional.)
- [x] **Commit `934f0675`** — cierre documental EP-4C.

### 2026-09-29 (nov) — EP-4D: participantes, roles y permisos (diseño)

- [x] **EP-4D documental completado** (`EP_MODELO_DATOS` §13) — sin
      código/SQL/DDL/tests/commits.
- [x] Tres dimensiones sin mezcla: perfil profesional / rol workspace /
      rol proyecto (6 roles reales: propietario, cliente,
      profesional_responsable, colaborador, tecnico, auditor).
- [x] Matriz de permisos propuesta por rol de proyecto; herencia
      workspace→proyecto solo como lectura completa del propietario del
      workspace (decisión EP-4C) — nunca escritura ni participación
      heredada.
- [x] Ciclo de participación: `invitado → activo → removido → activo`
      (reactivación sobre la misma fila); retiro revoca acceso
      inmediato y conserva historial; sin DELETE físico.
- [x] Tres "propiedades" distintas documentadas: propietario del
      workspace, propietario del proyecto, profesional responsable.
- [x] Limitaciones del DDL catalogadas (§13.13): sin estado `rechazado`,
      UNIQUE impide multi-rol, sin `updated_at`, workspace sin
      `administrador` (B5) — solo evolución futura.
- [x] Auditoría futura y entitlements (B5) documentados, no
      implementados. Acceso a proyecto ≠ acceso a recursos vinculados
      (política fina = EP-4E).
- [x] **D-D5 aprobada** (redacción del usuario): `propietario` y
      `profesional_responsable` son los dos roles de gestión del
      proyecto — participantes, estructura, contenido, actividades/
      programas/visitas/resultados/presupuesto y transiciones de
      cierre/archivado; sin propiedad ni autoridad sobre el workspace.
      Terminología: "gestor" eliminado — siempre explícito.
- [x] **Transferencia de propiedad aprobada** (§13.4.1): solo el
      propietario inicia/ejecuta; el anterior deja de serlo y conserva
      participación solo con otro rol; no altera perfil ni workspace;
      propietario no removible — solo transfiere; auditoría obligatoria
      (anterior, nuevo, ejecutor, fecha). `profesional_responsable` no
      transfiere propiedad.
- [x] **D-D1 aprobada (→ refinada 2026-09-30, ver bloque siguiente):**
      la App no impone condicionantes de elegibilidad — solo usuario
      registrado (FK). Incorporación = potestad del propietario (su
      acuerdo basta, sin doble firma); el perfil informa, no bloquea.
- [x] **D-D2 aprobada (→ refinada 2026-09-30, ver bloque siguiente):**
      oferta + aceptación; nomenclatura conceptual `contrato → aceptado`
      adoptada **solo como lenguaje** (opción A); DDL conserva
      `invitado/activo`; renombrado físico = evolución pendiente en la
      primera migración EP.
- [x] **D-D6 aprobada:** `cliente` ve el consolidado/oferta del
      presupuesto; desglose interno solo para los gestores.
- [ ] ~~Pendiente tu aprobación~~ → **resuelto en el cierre
      documental 2026-09-30** (bloque siguiente): D-D3, D-D4, D-D7 ✅;
      D-C1 corregida; alcance de `tecnico` formalizado.

### 2026-09-30 — EP-4D: refinamiento de autoridad e incorporación (diseño)

- [x] **D-D1 refinada → "Autoridad para incorporar participantes":**
      MELANTIA no decide quién está cualificado para participar en un
      Proyecto. La incorporación es **decisión del propietario**;
      cuando la naturaleza de la participación implique responsabilidad
      o intervención técnica, el propietario podrá requerir la
      aprobación/venia del `profesional_responsable` — la plataforma la
      registra, nunca la impone ni la sustituye. **Ningún rol de
      proyecto exige perfil profesional** (propietario, cliente,
      profesional_responsable, colaborador, tecnico, auditor): el
      perfil (EP-4A) es información declarada/verificada del
      ecosistema, no barrera de acceso. Única exigencia física:
      usuario registrado.
- [x] **D-D2 refinada → "Contrato y aceptación":** "invitación" es
      demasiado informal en un entorno profesional; la incorporación
      se modela conceptualmente como `contrato/acuerdo → pendiente →
      aceptado → activo`. MELANTIA registra proponente, destinatario,
      proyecto, rol, condiciones, fechas, estado, historial y
      evidencias/documentos — **sin actuar como autoridad
      contractual** (la validez jurídica pertenece a las partes y a
      la legislación aplicable). El **DDL no cambia**: `invitado` se
      reinterpreta como *incorporación pendiente de aceptación*; el
      renombrado físico del CHECK es decisión técnica posterior.
- [x] Separación explícita documentada (`EP_MODELO_DATOS` §13.3.1):
      MELANTIA = infraestructura, identidad, permisos de sistema,
      estado, seguridad, trazabilidad y auditoría; las decisiones
      profesionales y contractuales pertenecen a las personas
      responsables del proyecto.
- [ ] Nada implementado — documentación pura
      (`EP_MODELO_DATOS` §13, `ECOSISTEMA_PROFESIONAL` nota EP-4D,
      `EP_DDL_REVISION` §5.2).

### 2026-09-30 (bis) — EP-4D: CIERRE DOCUMENTAL

- [x] **Plan Profesional ≠ Perfil Profesional (regla aprobada):** el
      acceso a las capacidades del Ecosistema Profesional depende de la
      suscripción/Plan Profesional vigente (entitlements B5). **No se
      exige Perfil Profesional** para crear, activar, ser propietario
      ni gestionar un Proyecto — ejemplo válido: productor con plan de
      $25 crea su Proyecto de cacao con asistencia IA sin Perfil
      Profesional. `tiene_perfil` descartado como gate.
- [x] **D-C1 corregida y aprobada:** gate comercial (Plan), nunca
      cualificación (Perfil); tres conceptos separados: Plan habilita
      acceso → Perfil identifica capacidad → Rol determina función en
      el Proyecto.
- [x] **D-D3 ✅** retiro = `removido`, revocación inmediata, historial
      conservado. **D-D4 ✅** reactivación `removido→activo` por
      `propietario`/`profesional_responsable`, sin re-aceptación.
      **D-D7 ✅** participación ≠ acceso al recurso origen — la matriz
      rol × recurso × nivel queda para **EP-4E** (siguiente fase).
- [x] **`tecnico` formalizado:** ejecuta actividades/visitas asignadas,
      registra resultados/evidencias y trabaja sobre recursos
      autorizados; **no** administra participantes, roles, propiedad
      ni cierre/archivado.
- [x] **Recomendación de intervención profesional (§13.15):**
      MELANTIA/IA puede recomendar contextualmente (poda, plagas,
      suelos, viveros, riego, topografía, construcciones, procesos
      judiciales, veterinaria, …) y advertir obligaciones externas sin
      inventarlas — **MELANTIA recomienda, el propietario decide**.
- [x] **Evolución futura registrada (no EP-4D):** directorio de
      profesionales (§13.16), plan para profesionales $12 (nombre no
      definitivo), servicios de contacto/contratación/pago entre
      partes (§13.17). Sin pagos/suscripciones/notificaciones nuevas.
- [x] **Estado final:** D-D1…D-D7 ✅ — cierre documental completo.
      Sin código, SQL, DDL ni migraciones. Próxima fase: **EP-4E**.

## 2026-10-01 — Licencia Institucional (modelo comercial/funcional)

- [x] Decisión aprobada incorporada en `docs/LICENCIA_INSTITUCIONAL.md`.
      Tres condiciones diferenciadas: **beneficiario del proyecto**
      (participa, puede ser registrado por técnicos; no implica cuenta
      MELANTIA ni acceso patrocinado), **líder comunitario patrocinado**
      (seleccionado por la institución, acceso financiado por la
      licencia) y **usuario MELANTIA independiente** (plan propio;
      puede participar en proyectos si la institución lo autoriza).
      Una persona puede acumular condiciones; los permisos permanecen
      separados.
- [x] Valores aprobados: `$5.000/año` → hasta 20 líderes patrocinados;
      `$10.000/año` → hasta 40. El límite **no** restringe el número de
      beneficiarios.
- [x] Relación con Negocios Rurales: la licencia otorga **acceso** a
      Marketplace, Ferias Virtuales, Red Social y Comercial y Bolsa
      Agropecuaria bajo parámetros MELANTIA; las plataformas **no son
      propiedad de la institución**. La institución puede organizar
      actividades/ferias con imagen institucional.
- [x] **Comisión 3 % por transacción independiente de la licencia** —
      la licencia no la elimina ni la modifica.
- [x] §10 actualizado en ambas versiones del Master (`_FULL` y
      compacta) con referencia al documento.
      Documentación pura — sin código, SQL, DDL ni migraciones.

## 2026-10-01 (bis) — EP-4E: Autorización y acceso (diseño aprobado)

- [x] Modelo `rol × recurso × nivel` (`ninguno/consulta/crear/editar/
      administrar`) con **techos de rol** anti-escalamiento; herencia
      mínima (propietario ws solo lectura — D-C3); acceso a recursos
      vinculados **solo contextual** por endpoints EP — el módulo origen
      mantiene aislamiento `usuario_id` (D-D7 resuelta).
- [x] Nueva tabla propuesta `ep_proyecto_concesiones` (grants por
      tipo/instancia, registro histórico, unicidad solo sobre activas,
      revocadas al remover y **nunca reviven** al reactivar — E1
      corregida por decisión del usuario).
- [x] Decisiones E1–E9 todas aprobadas/corregidas; `visible_cliente`
      diferido. Documento: `EP_MODELO_DATOS.md` §14.
- [x] DDL propuesto en `migraciones/m3_ep4e_autorizacion.sql` —
      **NO ejecutado**; pendiente revisión → `psql -1` → implementación
      (`autorizacion.py`, `require_ep_access`, writers `audit_eventos`)
      → tests.

## 2026-10-20 — Saneamiento del entorno + suite en verde

- [x] **Auditoría MVP vs §21:** inventario verificado del repo.
      Resumen: Fundación (S1) completa salvo seeds geográficos;
      Campo/Offline (S2) solo a nivel schema+repositories — sin
      cliente móvil ni sync engine; Negocios (S3) parcial — Bolsa
      incompatible con schema v2 (C5); Web/Excel (S4) web existe,
      Excel/dashboard/verificador pendientes.
- [x] **Entorno Python:** `venv/` provisionado con subconjunto mínimo
      de `backend/requirements.txt` (sin tensorflow/opencv — los tests
      no los importan). `psycopg[binary]` requerido en Windows sin
      libpq del sistema.
- [x] **PostgreSQL 16.15-5 portable** en `.pg16/` (binarios EDB
      oficiales, SHA-256 verificado, gitignored, auth `trust`
      localhost — solo dev). No hay Docker/Podman en la máquina.
- [x] **Schema completo aplicado** a `melantia_db` y `melantia_test`
      (pasos 0–8 de `DB_MIGRATION_EXECUTION_PHASE1` + auth_puente,
      sesiones, levantamientos, mediciones_campo, migraciones m2–m6).
      49 tablas.
- [x] **Seeds geográficos creados** (`seeds/provincias.sql`,
      `cantones.sql`, `parroquias.sql`): 24 + 221 + 1.042 filas con
      `codigo_inec` oficial DPA, idempotentes. Fuente CC-BY-4.0
      citada en cabecera. **Pendiente:** `UNIQUE` en
      `cantones.codigo_inec` y `parroquias.codigo_inec` (el schema
      no lo declara; los seeds se protegen con NOT EXISTS).
- [x] **Suite en verde:** 412 passed, 0 skipped, 0 errors con
      `MELANTIA_TEST_DATABASE_URL` configurada (los 39 tests de BD
      ya no se omiten).
- [x] **Código muerto en cuarentena:** `modules/asistente_tecnico_rural/`
      (prototipo Ángel, sin referencias) y
      `negocios_rurales/Controllers.py` (draft FastAPI perdido en
      frontend) → `.legacy_extract/frontend_drafts/`.
- [x] **Verificación:** `npm run lint` 0 errores (2 warnings
      preexistentes en DocumentosYImpresion.jsx), `npm run build` OK.
- [x] `AGENTS.md` creado: bootstrap completo del entorno
      (venv, pg16 portable, orden de schema, comandos de test).
- [x] **Pendiente saneamiento RESUELTO (2026-10-21):** barrido
      `melant_ia/` commiteado (`7678e7c9`); material externo al
      proyecto fuera del tracking. El dump Supabase
      `../db_cluster-*.backup.gz` sigue fuera del repo (no se
      commitea — binario de respaldo local).

## 2026-10-21 — Auditoría Git, commits clasificados, m7 (UNIQUE INEC)

- [x] **Auditoría Git completa (Fase A/B):** raíz real
      `E:\Desktop\MELANTIA`, rama `ep/ecosistema-profesional-ddl`.
      Árbol versionado vive en `melantia/` (subdir del repo).
      Trabajo acumulado clasificado y commiteado por responsabilidad
      (10 commits, `0ee6c548..228ba09f`):
      - `0ee6c548` chore(repo): .gitignore ampliado + install.ps1
      - `7678e7c9` chore(legacy): retiro de `melant_ia/` (26k líneas)
      - `cf0b37e8` docs: patrimonio, seguridad, planes DB/geo, AGENTS
      - `5318d88e` feat(auth): identidad, sesiones, puente Supabase
      - `1c377d91` test(db): aislamiento fail-closed de BD de pruebas
      - `a4ad64bf` feat(backend): cli, mantenimiento, payphone,
        asistente, suscripciones
      - `0d943113` feat(db): migración inicial + m6 + seeds geo INEC
      - `a3d6b3a5` feat(frontend): app React/Vite, módulos M2–M5
      - `2b8f7585` chore(supabase): esquema legado
      - `ea5a4a74` chore(repo): fix patrón supabase/.temp anidado
      - `228ba09f` feat(db): m7 UNIQUE codigo_inec
      Quedan fuera del tracking (a nivel raíz del repo, no del
      proyecto): `API OpenRouter/` (incluye `antigua_clave/` —
      material de credenciales, no commitear jamás), `Documentos/`,
      logos, `pgadmin4.exe`, `staff_controller.js`, dump Supabase.
- [x] **Auditoría geográfica (C.1)** en `melantia_db` y
      `melantia_test`: 0 duplicados INEC, 0 malformados, 0 huérfanos
      FK, prefijos prov→cantón→parroquia coherentes, conteos exactos
      24/221/1042.
- [x] **Migración m7** `m7_geografia_inec_unicidad.sql`:
      `uq_cantones_codigo_inec` + `uq_parroquias_codigo_inec`
      (CREATE UNIQUE INDEX IF NOT EXISTS, aditiva, transaccional,
      rollback = DROP INDEX). `geografia.sql` declara UNIQUE inline
      para instalaciones nuevas. Aplicada y verificada en ambas bases.
      Convención m2–m6 respetada: header PROPUESTA + pre-chequeos
      documentados + BEGIN/COMMIT. Nota: `psql -1` + BEGIN/COMMIT
      interno emite warnings cosméticos (documentado en el header).
- [x] **Tests m7** `test_m7_geografia_inec.py` (9): validación
      estática del SQL (transaccional, idempotente, sin DROP/DELETE/
      ALTER/TRUNCATE) + ejecución real en schema temporal aislado:
      índices creados, duplicado rechazado (23505), idempotencia.
- [x] **Regresión completa (Fase D):** **421 passed** (412 + 9 m7),
      0 skipped, 0 errors. `npm run lint` 0 errores (mismas 2
      warnings preexistentes). `npm run build` OK (109 módulos).
- [ ] **Pendiente/observado:** directorios `melantia/{assets,
      business, core_python, data, .pytest_cache}` inaccesibles por
      ACL de Windows pero **vacíos** — git los marca "permission
      denied" al enumerar; inofensivos, pendiente decidir borrado
      (requiere confirmación del usuario).

## 2026-10-21 — Preparación hito: Gestión de Fincas end-to-end

Inspección previa a la implementación (Fase F). Estado real:

**Base reutilizable ya existente:**
- `shared/repositories/fincas.py` — adaptador de lectura M3↔M2
  (listar/obtener fincas y lotes, área, conteo de animales) con
  aislamiento `usuario_id` ya en SQL. Firmas estables; M2 las consume.
- `schema/gestion_fincas.sql` — `fincas`, `lotes`, `hatos_ganaderos`,
  `practicas_regenerativas` con FKs, CHECKs e índices. UUIDs nativos.
- `dispositivos`/`sesiones` (m4) dan `device_id` real para sync.
- `registros_campo.hash_transaccion` + `uq_registros_campo_dedup`
  (m6) = patrón de idempotencia offline ya probado en concurrencia.
- `trazabilidades`/`trazabilidad_eventos` ya tienen `sync_status`.

**Brechas detectadas para el hito:**
- `fincas`/`lotes`/`hatos` carecen de metadatos offline-first
  (`device_id`, `version`, `deleted_at`, `sync_status`,
  `hash_transaccion`) → probable migración m8 cuando el hito exija
  sync (no necesaria para CRUD web básico).
- Sin módulo `backend/modules/gestion_fincas/` — crear siguiendo la
  convención EP: `router.py` agregador + `routes/` + `schemas/` +
  `services/` (router delgado, SQL en services, `get_db` +
  `get_current_user`, 404 indistinguible para recurso ajeno).
- `GestionFincas.jsx` es stub con datos hardcodeados; `apiClient.js`
  ya existe (axios + Bearer + 401→clearSession).
- `require_role`/`verify_resource_ownership` en core/dependencies
  son placeholders — para M3 basta ownership por `usuario_id` en SQL
  (como hace el adaptador existente).

**Plan del hito (propuesto):**
1. `backend/modules/gestion_fincas/` — CRUD fincas + lotes
   (POST/GET/PATCH; sin DELETE físico: futuro soft-delete).
   Endpoints `/api/v1/fincas`, `/api/v1/fincas/{id}/lotes`.
2. Tests E2E patrón `test_ep_proyectos_api.py` (TestClient +
   overrides + semilla en `melantia_test` con UUIDs prefijados).
3. Frontend: `services/fincas.service.js` sobre apiClient +
   `GestionFincas.jsx` real (listar/crear finca, lotes por finca).
4. Después: metadatos sync (m8) + hatos + eventos de trazabilidad.

## 2026-10-21 — Hito IMPLEMENTADO: Gestión de Fincas end-to-end

El plan anterior quedó ejecutado y verificado. Módulo M3 real:

**Backend** — `backend/modules/gestion_fincas/` (convención EP:
router agregador + `routes/` + `schemas/` + `services/` →
`shared/repositories/`). Montado en main.py bajo `/api/v1`
(convención de módulos modernos asistente/EP; los routers internos
llevan prefijo `/fincas` y `/geografia`):

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/v1/fincas` | Crear finca (201) |
| GET | `/api/v1/fincas` | Listar solo las propias (+conteos) |
| GET | `/api/v1/fincas/{id}` | Detalle con lotes (404 si ajena) |
| PATCH | `/api/v1/fincas/{id}` | Edición parcial campos permitidos |
| POST | `/api/v1/fincas/{id}/lotes` | Crear lote (201) |
| GET | `/api/v1/fincas/{id}/lotes` | Listar lotes de finca propia |
| PATCH | `/api/v1/fincas/{id}/lotes/{lote_id}` | Editar lote de finca propia |
| GET | `/api/v1/geografia/provincias|cantones|parroquias` | Catálogo DPA/INEC (filtros por padre) |

**Seguridad:** identidad solo vía `get_current_user`; schemas con
`extra="forbid"` (intento de cambiar `usuario_id` → 422); recurso
ajeno o inexistente → **404 indistinguible**; UPDATE con
`AND usuario_id` en la cláusula (doble alcance lote→finca→usuario);
todo parametrizado. Sin DELETE físico — soft-delete queda para el
hito de sincronización.

**Geo DPA/INEC:** `_resolver_geo` valida existencia en catálogo y
coherencia por FK real; los niveles superiores ausentes se derivan
(enviar solo `parroquia_id` completa cantón+provincia).

**Repositorios:** `shared/repositories/fincas.py` ampliado
(aditivo: `obtener_finca_completa`, `listar_fincas_usuario_resumen`,
`insertar_/actualizar_finca`, `insertar_/actualizar_lote`; la lectura
de lotes ahora devuelve `finca_id`+timestamps) y nuevo
`shared/repositories/geografia.py` (catálogo solo-lectura,
reusable por registro de usuarios/levantamientos).

**Frontend:** `GestionFincas.jsx` reescrito funcional +
`fincas.service.js` nuevo sobre `apiClient`/`errors.js`. Lista con
conteos, alta con selects geo en cascada (24/221/1042 reales),
detalle con lotes, edición, alta de lote y cambio de estado
sanitario. Estados de carga/vacío/error. Ya estaba montado en
AppShell (módulo 3) — sin cambios de navegación.

**Pruebas:** `test_gestion_fincas_api.py` — 23 E2E nuevas contra
`melantia_test` con 2 usuarios (crear, derivación geo, geo
incoherente/inexistente 422, sin auth 401, listar solo propias,
detalle propia/ajena/inexistente, PATCH propia/ajena/sin
campos/intento de cambio de dueño, lotes CRUD + doble alcance 404,
área negativa 422, catálogo geo, persistencia real verificada en BD,
rutas en OpenAPI).

**Regresión:** **444 passed** (421 + 23), 0 skipped, 0 errors.
`npm run lint` 0 errores (mismas 2 warnings preexistentes);
`npm run build` OK (110 módulos).

**Pendiente para próximos hitos:** metadatos sync
(`version`, `deleted_at`, `hash_transaccion`, `device_id` en
fincas/lotes → probable m8 dentro del diseño de sincronización),
hatos ganaderos, eventos de trazabilidad, escrituras en
`audit_eventos` (ADM-2).

---

# 42. ADMINISTRACIÓN GENERAL DEL ECOSISTEMA MELANTIA

> Estado: **diseño conceptual documentado, NO implementado.**
> Detalle completo en `docs/ADMINISTRACION.md`.

## Qué es

Capa transversal de **operación y supervisión** del ecosistema. Es la
tercera superficie de MELANTIA junto a App Móvil (campo) y App Web
(oficina):

```text
APP MÓVIL ─┐
APP WEB ───┼──> FASTAPI ──> PostgreSQL / Storage / Sync / Audit
ADMIN ─────┘
```

**Sin backend independiente** — mismo FastAPI, misma PostgreSQL, mismo
storage, mismo sync, misma auditoría.

## Decisiones arquitectónicas registradas

1. **Tres ejes de rol separados** que no se mezclan:

```text
Perfil → Workspace → Proyecto → Rol de proyecto
       (Ecosistema Profesional — §36, docs/ECOSISTEMA_PROFESIONAL.md)

Administración → Rol administrativo
       (operación de plataforma — docs/ADMINISTRACION.md §3)
```

2. **Auditoría = infraestructura + superficie:** `shared/audit/`
   registra eventos de usuarios, profesionales, administradores,
   sistemas automáticos y cambios administrativos;
   `backend/admin/auditoria/` es solo la superficie de consulta.
   Regla de simetría: toda acción administrativa queda auditada.
3. **Configuración remota:** `admin/configuracion/` (quién administra)
   separada del mecanismo transversal de consumo de flags (cómo se
   consume).
4. **Actualizaciones:** `admin/actualizaciones/` (gestión de releases)
   separada del mecanismo técnico de verificación del cliente —
   con versionado, integridad SHA-256, rollout controlado y protección
   de datos locales no sincronizados.
5. **Autorización independiente:** rutas `/api/v1/admin/*` requerirán
   rol administrativo propio — no deriva del perfil ni del rol de
   proyecto (no implementado).
6. **Admin supervisa, no absorbe:** `admin/suscripciones/` opera sobre
   `modules/suscripciones/` sin reemplazar su dominio — igual para
   transacciones/M4-M10.
7. **Ecosistema Profesional ≠ Administración:** supervisar un proyecto no
   convierte al administrador en participante del proyecto.

## Estructura objetivo (no implementada)

```text
backend/admin/
├── dashboard/ · usuarios/ · soporte/ · suscripciones/
├── transacciones/ · aportes/ · monitoreo/
└── configuracion/ · actualizaciones/ · auditoria/
```

## Estado de implementación

```text
[ ] ADM-1 roles administrativos (modelo)
[ ] ADM-2 shared/audit/ (infraestructura — prerequisito también de PP)
[ ] ADM-3 autorización administrativa
[ ] ADM-4 admin/ mínimo viable
[ ] ADM-5..8 auditoria, configuracion, actualizaciones, supervisión
```

Decisiones pendientes DA1–DA6 en `docs/ADMINISTRACION.md` §11.

---

# 43. ACTUALIZACIÓN DEL MVP — DECISIONES APROBADAS (2026-10-08)

> Sección de actualización documental. Incorpora únicamente decisiones
> funcionales, arquitectónicas y de roadmap ya aprobadas. No sustituye ni
> elimina las decisiones históricas de §1–§42; donde exista tensión con
> documentos especializados, se registra en §45 como pendiente.

## 43.1 Nueva definición del MVP — horizonte de validación

- **Horizonte inicial de análisis y crecimiento: 24 meses.**
- **Objetivo de crecimiento aproximado: 10.000 usuarios.**
- Durante esos 24 meses MELANTIA debe validar: utilidad real, adopción,
  retención, actividad productiva, actividad comercial, funcionamiento
  Offline First, sostenibilidad económica, necesidades territoriales y
  demanda de servicios.

**Regla:** los 24 meses NO implican apertura automática de Puertos
MELANTIA. El período existe para:

```text
INVESTIGAR → VALIDAR → MEDIR → ANALIZAR → DECIDIR
```

La apertura de un Puerto dependerá posteriormente de: usuarios, usuarios
activos, concentración territorial, demanda, volumen de operaciones,
actividad comercial, necesidades logísticas, conectividad, costes,
ingresos potenciales, sostenibilidad, impacto y capacidad operativa.

- **No existe regla rígida** tipo "100 usuarios = abrir Puerto".
- Los 10.000 usuarios son **meta de crecimiento**, no condición
  automática de apertura de Puertos.
- Compatibilidad: el "MVP de ~1 mes" de §1 es el horizonte de
  construcción inicial; los 24 meses son el horizonte de validación y
  crecimiento posterior — no se contradicen.

## 43.2 Principio de diseño del MVP

> **"ARQUITECTURA COMPLEJA POR DENTRO → EXPERIENCIA SENCILLA POR FUERA"**

MELANTIA oculta la complejidad técnica al usuario común. La interfaz usa
lenguaje comprensible y presenta las capacidades agrupadas según las
necesidades reales del usuario. El usuario no debe conocer la estructura
interna de módulos, repositorios, trazabilidad, evidencias ni registros
de campo.

## 43.3 Experiencia principal: MI PRODUCCIÓN

**Decisión aprobada:** "MI PRODUCCIÓN" es la entrada principal del
usuario a su actividad productiva.

- Mi Producción **no elimina ni fusiona** los dominios técnicos internos;
  es una **capa de experiencia de usuario** que integra visualmente:
  Gestión de Fincas, Cultivos, Lotes, Producción agrícola, Producción
  pecuaria, Animales, Actividades productivas, Cosechas, Postcosecha,
  Trazabilidad, Evidencias, Resultados e indicadores.
- Arquitectura interna intacta: `gestion_fincas`, `trazabilidad`,
  `registros_campo`, `evidencias` y demás dominios especializados siguen
  existiendo como dominios técnicos.

```text
INTERFAZ:               MI PRODUCCIÓN
ARQUITECTURA INTERNA:   Gestión de Fincas + Registros de Campo
                        + Trazabilidad + Evidencias + Producción
                        + demás dominios especializados
```

## 43.4 Navegación principal del MVP

Propuesta aprobada de experiencia principal (capa UX — los módulos
técnicos internos pueden ser diferentes):

```text
🏠 INICIO
🌱 MI PRODUCCIÓN
🤖 ASISTENTE TÉCNICO RURAL
🛒 NEGOCIOS / MARKETPLACE
👥 MI COMUNIDAD
📋 MI AGENDA
🔔 NOTIFICACIONES
```

## 43.5 Mi Producción — alcance

```text
MI PRODUCCIÓN
├── Fincas
├── Cultivos
├── Lotes
├── Producción agrícola
├── Producción pecuaria
├── Animales
├── Actividades productivas
├── Cosechas
├── Postcosecha
├── Trazabilidad
├── Evidencias
└── Resultados/indicadores
```

Objetivo: **"Registrar y gestionar la realidad productiva del usuario."**

Diferenciación obligatoria:

```text
MI PRODUCCIÓN:      registra y gestiona la realidad del productor.
ASISTENTE TÉCNICO:  analiza, orienta y ayuda a tomar decisiones.
```

## 43.6 Asistente Técnico Rural

Pilar principal del MVP. Usa, cuando corresponda y con permisos
adecuados, información contextual proveniente de Mi Producción — **sin
duplicar** información que pertenece a Mi Producción.

Capacidades mantenidas: conocimiento técnico, cultivos, calculadoras,
calendarios, recomendaciones, veterinaria, animales, apicultura,
agricultura de precisión, sensores, clima, GPS, IA, conocimiento
consolidado.

## 43.7 Negocios / Marketplace — flujo aprobado

Segundo pilar comercial del MVP. Flujo:

```text
EXPLORAR → SELECCIONAR → PREPARAR INTENCIÓN → SOLICITAR DISPONIBILIDAD
→ VENDEDOR CONFIRMA → COMPRADOR CONFIRMA CONDICIONES → ACCIÓN/PAGO
→ CONFIRMACIÓN → ENTREGA → EVIDENCIA → CIERRE
```

Reglas:

- No existe pago antes de confirmar disponibilidad.
- Si el comprador solicita 10 y el vendedor dispone de 6, **no se
  modifica silenciosamente la intención**: el comprador decide comprar 6,
  modificar o cancelar.
- Comisión MELANTIA del **3 %** (permanece separada de comisiones del
  proveedor financiero — coherente con A2, Phase 2).
- MELANTIA **no asume custodia de fondos**.
- Las operaciones monetarias críticas requieren **validación online**.

## 43.8 Mi Comunidad

Tercer pilar funcional, claramente diferenciado de Negocios/Marketplace:
comunicación comunitaria, avisos, participación, servicios ciudadanos,
orientación y funciones comunitarias. **No** es la red comercial del
Marketplace.

## 43.9 Mi Agenda / Mis Actividades

Vista transversal que puede integrar actividades de: producción,
asistencia técnica, Marketplace, servicios, proyectos, profesionales y
operaciones futuras — **sin duplicar** entidades ni actividades.

## 43.10 Notificaciones

Servicio transversal: puede informar sobre producción, asistencia
técnica, Marketplace, operaciones, sincronización, seguridad, comunidad y
finanzas.

**Regla:** una notificación **no constituye por sí misma una
confirmación financiera**.

## 43.11 Planes de suscripción — visión comercial inicial

Planes base previstos para la etapa inicial:

```text
PLAN $5 · PLAN $10 · PLAN $15
```

**Pendiente (no inventar ni hardcodear):** definición exacta de
capacidades por plan, límites, entitlements, coste real, margen,
retención y punto de equilibrio. Relación con los planes históricos
Básico/Standard/Profesional de §10: pendiente de armonización (§45).

## 43.12 Offline First

Decisiones ya aprobadas, mantenidas. Regla fundamental:

> **"OFFLINE PERMITE PREPARAR; LAS ACCIONES CRÍTICAS Y MONETARIAS
> NECESITAN VALIDACIÓN ONLINE."**

Elementos: cola persistente, ID único, `idempotency_key`, sincronización
automática, prioridades P1/P2/P3, reintentos, conflictos, batería,
Wi-Fi, datos móviles, conectividad intermitente.

Operaciones financieras aceptadas offline (RC-01, aprobada 2026-10-08):

- pueden prepararse, validarse localmente y ser aceptadas/selladas por
  el usuario sin conectividad — la aceptación offline es **irrevocable
  por el usuario**;
- permanecen almacenadas en la cola persistente y se sincronizan
  automáticamente con conectividad válida;
- `ACEPTADA_OFFLINE` **no significa** pagada, transferida, cobrada,
  retirada ni liquidada;
- **no expiran por TTL** (RC-04) — permanecen hasta resolución válida
  (`CONFIRMADA`, `RECHAZADA`, `CONFLICTO`, `CANCELADA_CONFIRMADA` con
  evidencia u otra aprobada); el TTL por plan de F7a.1 sigue vigente
  para el resto de la cola;
- solo pasan a `CONFIRMADA` tras validación del servidor y, cuando
  aplique, del proveedor financiero autorizado.

Flujo canónico:

```text
BORRADOR → PREPARADA_OFFLINE → ACEPTADA_OFFLINE
→ PENDIENTE_CONFIRMACION_RED → ENVIADA → VALIDANDO → CONFIRMADA
(+ ramas RECHAZADA / CONFLICTO / REQUIERE_REVISION)
```

La regla anterior de F7a/F7a.1 «financieras: ni siquiera encolables»
quedó **SUPERADA** (texto histórico conservado en docs 17/21).

## 43.13 Smart Sync / Supervivencia

Reglas aprobadas (especificación completa: `seguridad_soberana/05`,
diseño: `06`, revisión: `07`, decisiones: `08`):

Batería/conectividad:

| Condición | Política |
|---|---|
| Wi-Fi + ≥50 % | Sincronización normal |
| Wi-Fi + <50 % | Prioridades / procesos ligeros |
| Wi-Fi + energía | Sincronización completa |
| Datos móviles + ≥50 % | Operaciones autorizadas |
| Datos móviles + <50 % | Prioridades críticas |
| Datos móviles + energía | Sincronización **controlada**: prioriza P1/P2, evita transferencias pesadas no urgentes; **no** equivale a Wi-Fi+energía (RC-06) |
| Sin conectividad | Cola local persistente |

Ventanas de búsqueda de conectividad:

- **Días:** lunes, jueves, viernes, sábado, domingo.
- **Horarios:** 10:00 · 13:00 · 16:00 · 19:00 · 00:00.
- **Cada ventana:** 5 búsquedas, cada 10 minutos; si hay sincronización
  exitosa → detener las búsquedas y esperar la siguiente ventana.

Objetivo: **mínimo una sincronización efectiva diaria** cuando exista
una oportunidad real de conectividad.

## 43.14 Seguridad — decisiones aprobadas (sin implementación)

Root of Trust · KEK/DEK · cifrado · blind index · protección de
evidencias · seguridad Offline First · separación de funciones · doble
autorización · auditoría · controles administrativos · credenciales ·
futuro FIDO2/WebAuthn.

FIDO2: **futuro** — no implementar ahora; la arquitectura queda
preparada. Referencia: `seguridad_soberana/02` (diseño soberano),
`MATRIZ_CREDENCIALES_ROLES_PERMISOS_ALCANCES_V1.md`.

## 43.15 Roles administrativos

Decisiones aprobadas (matriz completa:
`seguridad_soberana/MATRIZ_CREDENCIALES_ROLES_PERMISOS_ALCANCES_V1.md`):

```text
L5 Fundador
L4 Administrador / Coordinador General
L3 Economista
L3 Auditor / Contador
L3 Especialista Técnico
L2 Coordinador Territorial
L0 Usuario/Cliente
```

Existen **tres taxonomías independientes**:

1. Rol administrativo MELANTIA (L0–L5).
2. Rol del control plane (doc 02 §7.1: operador, custodio, propietario,
   desarrollador, infraestructura, auditor).
3. Rol EP-4E (roles de proyecto).

**Ninguna taxonomía concede automáticamente permisos de otra.** En EP-4E
el propietario del proyecto determina los roles dentro de su proyecto.

## 43.16 L0 — Usuario/Cliente MELANTIA

Definición aprobada: L0 es el **cliente base** de MELANTIA.

- Puede contratar una o varias suscripciones.
- Puede tener uno o varios **perfiles funcionales**: Productor,
  Comprador, Vendedor, Emprendedor, Profesional, Empresario y otros
  futuros.
- Los perfiles **no** son roles administrativos.
- L0 **no** representa jerarquía administrativa.

## 43.17 Credenciales administrativas

- **MVP:** credencial manual segura.
- **Futuro:** FIDO2/WebAuthn, llaves físicas USB/NFC, credenciales no
  exportables, revocación desde administración.

Fundador:

| Credencial | Uso |
|---|---|
| **ML-001-D** | credencial diaria |
| **ML-001-E** | break-glass / contingencia — físicamente separada, uso excepcional, auditoría reforzada |

Separación de funciones y doble autorización se mantienen (matriz §14
del documento de credenciales).

## 43.18 Gobierno y continuidad

- **Fundador:** propietario de MELANTIA.
- **Persona A:** hija del fundador; representante temporal designada en
  caso de incapacidad/ausencia del fundador.
- **Persona B:** Administrador / Coordinador General.
- **Contingencia:** A + B pueden activar representación temporal.
  **No es sucesión permanente.**

Toda decisión importante sigue el ciclo:

```text
PROBLEMA/OPORTUNIDAD → INVESTIGACIÓN → DATOS → ANÁLISIS
→ COSTO/BENEFICIO → RIESGOS → SOSTENIBILIDAD → ALTERNATIVAS
→ DECISIÓN → IMPLEMENTACIÓN → MEDICIÓN → AUDITORÍA/REVISIÓN
```

## 43.19 Economista — decisión aprobada

El Economista **no aprueba ni ejecuta las operaciones financieras de los
usuarios**.

Funciones: análisis económico, viabilidad, sostenibilidad, costes,
modelos de negocio, crecimiento, análisis de reclamaciones, resolución
de conflictos, análisis de Puertos, apoyo a crecimiento comercial.

En incidentes: `Economista + Administrador/Persona B`; cuando
corresponda también Fundador, Auditor/Contador y la entidad financiera
involucrada.

No puede modificar dinero, credenciales críticas ni reglas fundamentales
unilateralmente.

Resuelto (PC-06, 2026-10-08): el "aprobar determinadas operaciones" de
la matriz v1 se refiere al **dominio económico interno** de MELANTIA
(análisis, decisiones de negocio, actas, evaluación de Puertos) —
nunca a operaciones financieras de usuarios. Matriz armonizada en
§5.3/§16/§18.

En incidente financiero la cadena es:

```text
USUARIO → SISTEMA → ADMINISTRADOR/RESPONSABLE → ECONOMISTA
(cuando corresponda) → PROVEEDOR FINANCIERO (cuando corresponda)
→ AUDITOR/FUNDADOR según gravedad
```

## 43.20 Puerto MELANTIA — capacidad futura (no implementar)

Definición aprobada:

> **"PUERTO MELANTIA = ECOSISTEMA DE SERVICIOS MELANTIA"**

Es un scope organizacional/operativo propio. Tipos: Puerto MELANTIA
Sencillo · Puerto MELANTIA Matriz/Completo · Puerto MELANTIA Propio.

- No existe cantidad fija ni regla automática por número de usuarios.
- La decisión dependerá de: demanda, usuarios, concentración,
  operaciones, logística, conectividad, costes, ingresos,
  sostenibilidad, impacto y capacidad operativa.
- El análisis se desarrolla durante los primeros 24 meses (§43.1).

## 43.21 Futuro — fuera del MVP

Preparables arquitectónicamente, **no implementables por anticipación**:

FIDO2 físico · Puertos MELANTIA · Wallet propia como custodia de dinero
· escrow propio · drones · robótica · biotecnología avanzada · visión
satelital avanzada · Mesh · RaaS · AgTech-as-a-Service · infraestructura
física · expansión territorial avanzada.

---

# 44. CHECKLIST DE CIERRE DEL MVP

> Estado por columna: **[A] documentación/decisión aprobada** ·
> **[B] implementación pendiente** · **[C] validación/pruebas pendientes**
> · **[D] futuro fuera del MVP**.

| Área | Ítem | Estado |
|---|---|---|
| SEGURIDAD | Root of Trust | A (diseño doc 02; custodia pendiente decisión RoT) |
| SEGURIDAD | cifrado (campos, objetos, cola, backups) | A diseño / B implementación (S2.x) |
| SEGURIDAD | claves (jerarquía KEK/DEK, custodia) | A diseño / B |
| SEGURIDAD | backups cifrados + 3-2-1 + restore | A diseño / B (S3.x) + C drill |
| SEGURIDAD | recuperación (break-glass, procedimientos) | A diseño / B |
| SEGURIDAD | rate limiting | A diseño / B (S0.7) |
| SEGURIDAD | sesiones (F7a/F7a.1: 30 d, RT backend, snapshot 72 h) | A decisión cerrada / B |
| SEGURIDAD | auditoría (shared/audit, simetría admin) | A diseño / B (ADM-2) |
| OFFLINE FIRST | cola persistente (id, tipo, prioridad, estado, idempotency_key, deps) | A spec 05 / B |
| OFFLINE FIRST | sync (motor, ventanas, confirmación servidor) | A spec 05+diseño 06 / B |
| OFFLINE FIRST | idempotencia | A diseño / B |
| OFFLINE FIRST | conflictos (revisión, nunca borrado) | A / B |
| OFFLINE FIRST | prioridades P1/P2/P3 | A / B |
| OFFLINE FIRST | supervivencia (batería 50 %, calendario, ventanas) | A / B |
| OFFLINE FIRST | pruebas sin Internet | C |
| MI PRODUCCIÓN | fincas, lotes, cultivos | B |
| MI PRODUCCIÓN | animales, actividades, cosechas | B |
| MI PRODUCCIÓN | trazabilidad, evidencias, GPS | B (M3/M11 existentes en parte) |
| MI PRODUCCIÓN | capa UX Mi Producción | A decisión / B |
| ASISTENTE TÉCNICO | conocimiento, consultas, contexto productivo | B parcial |
| ASISTENTE TÉCNICO | biblioteca, calculadoras | B parcial |
| ASISTENTE TÉCNICO | validación de recomendaciones | C |
| MARKETPLACE | publicaciones, disponibilidad | B |
| MARKETPLACE | intención → confirmación → pago → QR → entrega → evidencia → cierre | A flujo / B |
| MARKETPLACE | reputación | B |
| MARKETPLACE | comisión 3 % | A (M4.transacciones) / B |
| COMUNIDAD | comunicación, avisos, participación, servicios | B |
| SUSCRIPCIONES | planes $5/$10/$15 | A visión comercial / pendiente entitlements (§45) |
| SUSCRIPCIONES | entitlements, pagos, renovación | B + pendiente definición |
| UX/UI | navegación simplificada, Mi Producción | A decisión / B |
| UX/UI | perfiles, suscripciones | B |
| UX/UI | móvil, gama baja, accesibilidad | B + C |
| E2E | registro, login, suscripción | B/C |
| E2E | Mi Producción + offline + sincronización | B/C |
| E2E | Asistente | B/C |
| E2E | Marketplace: operación → pago → evidencia → cierre | B/C |
| FUTURO | FIDO2 físico, Puertos, Wallet custodia, escrow, drones, robótica, biotech, satelital, Mesh, RaaS, AgTech-aaS, infra física, expansión | D |

---

# 45. CONTRADICCIONES Y PENDIENTES DOCUMENTALES

Registro de tensiones documentales. Resueltas por decisión aprobada
2026-10-08: **P-01, P-02, P-03, P-04, P-07, P-08**; aclarada: **P-06**;
pendiente: **P-05** (regla §23.7: no inventar soluciones):

| # | Tema | Tensión | Referencia / Resolución |
|---|---|---|---|
| P-01 | Financieras offline | §43.12 "aceptadas offline" vs F7a/F7a.1 "ni siquiera encolables" | **RESUELTO 2026-10-08** — RC-01 (doc 08): financieras encolables vía `ACEPTADA_OFFLINE` (irrevocable por el usuario); confirmación solo servidor/proveedor; "ni siquiera encolables" de F7a/F7a.1 SUPERADA (texto histórico conservado) |
| P-02 | TTL de cola | §43.12 "no expiran por TTL" vs TTL 15 d/45 d por plan de F7a.1 | **RESUELTO 2026-10-08** — RC-04 (doc 08): vigencia diferenciada — financieras `ACEPTADA_OFFLINE` sin TTL; resto de la cola conserva TTL por plan; datos de campo nunca borrados por antigüedad |
| P-03 | Economista | §43.19 "no aprueba operaciones financieras de usuarios" vs matriz v1 "puede aprobar determinadas operaciones" | **RESUELTO 2026-10-08** — PC-06 (matriz credenciales v1): "aprobar determinadas operaciones" = dominio económico interno; nunca operaciones financieras de usuarios; matriz §5.3/§18 armonizada |
| P-04 | Datos móviles + energía | §43.13 "sincronización controlada" amplía el caso que doc 05 §10 limitaba a Wi-Fi+energía | **RESUELTO 2026-10-08** — RC-06 (doc 08): datos móviles+energía = sincronización CONTROLADA (P1/P2, sin pesadas no urgentes); formalizado en doc 05 §7/§9 y doc 06 §14 |
| P-05 | Planes $5/$10/$15 vs Básico/Standard/Profesional (§10) | Dos nomenclaturas de planes; entitlements pendientes | **PENDIENTE DE DEFINICIÓN** — catálogo MVP $5/$10/$15 aprobado; nombres comerciales y entitlements por definir; §10 marcado como catálogo histórico |
| P-06 | Licencia Institucional ($5.000/$10.000) vs planes personales | Ejes distintos (institucional vs usuario) — coexisten | **ACLARADO** — sin contradicción real: licencia institucional y planes personales son ejes distintos que coexisten; pendiente solo claridad editorial en documentación comercial |
| P-07 | Mapeo L-roles ↔ control plane ↔ roles admin ADM | Tres taxonomías declaradas independientes; falta tabla de correspondencia | **RESUELTO 2026-10-08** — PC-01: las tres taxonomías son independientes por diseño; ninguna concede permisos de otra; las correspondencias conceptuales son ilustrativas, no un mapeo |
| P-08 | Credencial MANUAL vs MFA-FIDO2 admin | Doc 02 §7.2 prescribe FIDO2 para admin; MVP usa manual | **RESUELTO 2026-10-08** — PC-02: MVP con credencial manual segura; FIDO2 diferido a la etapa prevista (~6 meses); modifica autenticación, no autorización; prescripción FIDO2 del doc 02 SUPERADA para el MVP |

**Pendientes que permanecen** (sin decisión): RC-02, RC-03, RC-05,
RC-07, RC-09, RC-10, RC-13, RC-15, DT-01…DT-06 (doc 08); PC-03, PC-04,
PC-05, PC-07, PC-08, PC-09 (matriz credenciales v1 §16); P-05
(entitlements/nombres de planes) — más los pendientes históricos
(RoT/S2.1, CI/CD, secret manager, PostGIS B1, auth B3, DA1–DA6).

---

## Registro de actualización

| Fecha | Cambio | Autoría |
|---|---|---|
| 2026-10-08 | §43 (decisiones MVP: Mi Producción, navegación, 24 meses/10.000 usuarios, Smart Sync, roles L0–L5, credenciales, Puerto MELANTIA, futuro-no-MVP) + §44 (checklist de cierre) + §45 (contradicciones/pendientes) + nota de encabezado | Actualización documental aprobada — sin código, SQL, config ni commit |
| 2026-10-08 | Resolución documental de contradicciones: P-01 (RC-01), P-02 (RC-04), P-03 (PC-06), P-04 (RC-06), P-07 (PC-01), P-08 (PC-02) resueltas; P-05 pendiente de entitlements/nombres; P-06 aclarada. Notas en §10, §43.12, §43.13, §43.19; harmonización de docs 05–08, 17 (F7a), 21 (F7a.1) y matriz de credenciales | Resolución documental aprobada — sin código, SQL, config ni commit |
| 2026-10-20 | Saneamiento del entorno: venv mínimo, PostgreSQL 16.15 portable en `.pg16/`, esquema+m2–m6 en `melantia_db`/`melantia_test`, seeds geográficos DPA (24/221/1042), cuarentena `.legacy_extract/`, suite 412 passed — detalle en `MELANTIA_ESTADO_IMPLEMENTACION.md` §D | Ejecución verificada en repo |
| 2026-10-21 | Auditoría Git + commits clasificados (`0ee6c548`..`3c2b1710`), migración **m7** (UNIQUE INEC cantones/parroquias, 9 tests) aplicada en ambas bases, suite 421 passed — §D del estado | Ejecución verificada en repo |
| 2026-10-21 | **Gestión de Fincas end-to-end** en rama `feat/gestion-fincas-end-to-end` (`73f4b32c` + `5b061f5d`): CRUD `/api/v1/fincas`+`/lotes`+`/geografia`, UI React real, 23 E2E, suite 444 passed, lint/build OK — §F del estado | Ejecución verificada en repo |
| 2026-10-21 | Creación de `MELANTIA_ESTADO_IMPLEMENTACION.md` (bitácora técnica viva) + enlace en encabezado — jerarquía: este Master = autoridad; el estado = evidencia | Cambio documental — sin código, SQL ni commit |
