# MELANTIA — Visión de Crecimiento y Estructura Futura del Ecosistema

> **Tipo de documento:** visión / roadmap estratégico de largo plazo.
> **Estado:** aprobado como documento de referencia — 2026-09-30.
>
> **Relación con el plano maestro:** este documento **no sustituye** a
> `MELANTIA_PROJECT_MASTER_FULL.md`. Cuando llegue la fase de
> implementación de cada capacidad aquí descrita, cada decisión se
> contrasta con el Master para evitar contradicciones.
>
> **Regla operativa para el equipo/Devin:**
> *Las funcionalidades futuras se diseñan conceptualmente ahora,
> pero no se implementan hasta que lleguemos a su fase correspondiente.*

---

## 1. Visión general

MELANTIA no debe construirse únicamente como una aplicación agrícola.

La visión es:

**MELANTIA — El ecosistema digital inteligente para la economía rural.**

La primera etapa se enfocará en el sector agropecuario y rural, pero la
arquitectura debe permitir posteriormente incorporar comercio, servicios
profesionales, turismo, cultura, finanzas, inteligencia artificial y
tecnologías avanzadas sin tener que reconstruir la plataforma.

La estrategia es:

```
Base robusta → MVP funcional → validación territorial
             → expansión progresiva del ecosistema.
```

## 2. Principio fundamental de desarrollo

No se debe intentar implementar todas las capacidades desde el primer
día. Pero sí se debe construir desde el principio una arquitectura
suficientemente sólida para recibirlas posteriormente.

La regla será:

> **No acelerar eliminando arquitectura.**
> **Acelerar reutilizando arquitectura.**

Cada nueva capacidad debe aprovechar:

- usuarios;
- autenticación;
- permisos;
- PostgreSQL;
- FastAPI;
- API;
- almacenamiento;
- sincronización;
- auditoría;
- evidencias;
- notificaciones;
- Marketplace;
- Ecosistema Profesional;
- IA;
- infraestructura transversal.

## 3. MVP inicial de MELANTIA

El MVP debe ser más completo que una aplicación agrícola básica.

### 3.1 Asistente Técnico Rural — punto neurálgico inicial

Debe convertirse en uno de los principales motores de MELANTIA.

Incluye progresivamente:

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
- Agricultura de Precisión
- Clima Inteligente
- Levantamiento de Lote
- GPS / Medición de Terrenos
- preparación para Visión Artificial
- preparación para Visión Satelital

La arquitectura debe permitir que el asistente evolucione desde
respuestas generales hacia inteligencia contextual basada en los datos
reales del usuario.

## 4. Gestión de Fincas y Trazabilidad

Debe formar parte del núcleo inicial.

Modelo conceptual:

```
Finca
  → Lote
    → Cultivo / actividad
      → Mediciones
        → Evidencias
          → Historial
            → Trazabilidad
```

El objetivo futuro es que el Asistente Técnico pueda utilizar el
contexto real de la finca y sus lotes.

Ejemplo de evolución:

```
"¿Cómo cultivo cacao?"
        ↓
"Analiza este lote."
        ↓
"Según las condiciones registradas en este lote, ¿qué debería revisar?"
```

## 5. Negocios Rurales — obligatorio en el MVP

Negocios Rurales debe estar presente desde la primera versión funcional.

Debe incluir progresivamente:

- Red Social Comercial Rural
- Marketplace MELANTIA
- Bolsa Agropecuaria
- Ferias Virtuales
- Bienes Raíces Rurales
- publicaciones;
- ofertas;
- demandas;
- oportunidades;
- productos;
- servicios.

La comisión de MELANTIA se mantiene en: **3% por transacción**.

La comisión corresponde a la operación comercial y no a la simple
creación de una publicación.

> **Licencia Institucional** (`docs/LICENCIA_INSTITUCIONAL.md`,
> 2026-10-01): la institución obtiene acceso a estas plataformas para
> su proyecto; la licencia no transfiere la propiedad de las
> plataformas ni modifica la comisión del 3 %.

## 6. Mi Comunidad Virtual

Debe formar parte del MVP, pero manteniendo su identidad separada del
comercio.

Incluye:

- Ciudadano Rural
- información de programas y proyectos;
- procedimientos;
- orientación;
- Asesoría Legal;
- comunicación comunitaria;
- Walkie Talkie;
- posteriormente comunicación Mesh.

La comunidad no debe convertirse en un segundo Marketplace.

La separación conceptual es:

> **Negocios Rurales = actividad económica.**
> **Comunidad = actividad social, informativa y comunitaria.**

## 7. Evidencias y documentos

Debe formar parte de la infraestructura transversal.

Incluye:

- fotografías;
- documentos;
- evidencias;
- versiones;
- integridad;
- SHA-256;
- auditoría;
- historial;
- cadena de custodia.

Las evidencias podrán posteriormente ser utilizadas por:

- Fincas;
- Trazabilidad;
- Proyectos;
- Ecosistema Profesional;
- IA;
- Visión Artificial;
- Visión Satelital;
- servicios profesionales.

## 8. Marketplace MELANTIA — diseño para expansión

Aunque inicialmente el Marketplace estará orientado principalmente al
mundo rural, su arquitectura **NO** debe quedar limitada a productos
agrícolas.

La abstracción futura será:

**Oferta comercial**, que puede representar:

- producto;
- servicio;
- reserva;
- oportunidad;
- evento.

Conceptualmente:

```
Marketplace MELANTIA

Productos
  - agropecuarios;
  - alimentos;
  - artesanías;
  - comercio general;
  - otros.

Servicios
  - técnicos;
  - profesionales;
  - transporte;
  - turismo;
  - gastronomía;
  - reparaciones;
  - otros.

Reservas
  - restaurantes;
  - profesionales;
  - turismo;
  - servicios;
  - eventos.

Oportunidades
  - compra;
  - venta;
  - alquiler;
  - empleo;
  - proyectos;
  - servicios.
```

## 9. Restaurante dentro de MELANTIA

La arquitectura debe permitir que un restaurante pueda utilizar
MELANTIA sin necesitar funcionalidades agrícolas.

Ejemplo:

```
Restaurante
  → Perfil del negocio
  → Ubicación
  → Horarios
  → Fotografías
  → Menú
  → Productos
  → Servicios
  → Reservaciones
  → Clientes
  → Publicaciones
  → Promociones
  → Estadísticas
```

Un cliente podría:

```
Restaurante → Ver menú → Elegir fecha → Elegir hora
  → Indicar número de personas → Reservar
```

Esto debe considerarse una capacidad futura del Marketplace /
Ecosistema Profesional. **No es necesario implementarlo en el MVP
agropecuario inicial.**

## 10. Vendedor o pequeño negocio

El Ecosistema Profesional debe poder ser utilizado posteriormente por:

- vendedores;
- emprendedores;
- comercios;
- restaurantes;
- técnicos;
- consultores;
- empresas;
- profesionales independientes;
- organizaciones.

Ejemplo de negocio:

```
Mi negocio
  → Catálogo
  → Productos
  → Inventario
  → Precios
  → Publicaciones
  → Clientes
  → Pedidos
  → Entregas
  → Promociones
  → Reservas
  → Finanzas
  → Estadísticas
```

Por tanto:

> **Ecosistema Profesional no debe quedar limitado a profesionales
> agropecuarios.** Debe funcionar como infraestructura transversal
> para la gestión profesional de actividades y negocios.

## 11. Ecosistema Profesional

El Ecosistema Profesional será una capa transversal.

Conceptualmente:

```
ECOSISTEMA PROFESIONAL
  → Perfil profesional
  → Workspace
  → Proyecto
  → Participantes
  → Roles
  → Recursos
  → Actividades
  → Visitas
  → Presupuesto
  → Resultados
  → Historial
```

Debe poder ser utilizado por un profesional, empresa, comercio u
organización.

La diferencia importante es:

```
Perfil profesional  = identidad/capacidad.
Workspace           = entorno permanente de trabajo.
Proyecto            = unidad concreta de trabajo.
Rol de proyecto     = función dentro de un proyecto.
Plan Professional   = capacidad/entitlement de acceso al ecosistema
                      profesional.
```

El Plan Professional y el Perfil Profesional son conceptos diferentes
(coherente con el cierre documental de EP-4D — ver
`docs/EP_MODELO_DATOS.md` §12.11 y §13.1).

## 12. IA dentro del Ecosistema Profesional

La IA podrá ayudar a crear:

- proyectos;
- programas;
- actividades;
- cronogramas;
- presupuestos;
- propuestas;
- planes de trabajo;
- informes;
- recomendaciones.

Regla fundamental:

```
IA PROPONE → PROFESIONAL/PROPIETARIO REVISA → MODIFICA → APRUEBA
           → ESTRUCTURA DEFINITIVA.
```

La IA no debe convertir automáticamente una propuesta en una decisión
definitiva.

## 13. Expansión tecnológica posterior

Una vez validado el núcleo de MELANTIA, se incorporarán progresivamente
nuevas capas.

```
Fase siguiente:        Ecosistema Profesional completo + IA avanzada
Después:               Visión Artificial
Luego:                 Visión Satelital
Luego:                 Servicios Financieros
Después:               Wallet MELANTIA + tarjeta de débito
Posteriormente:        Drones
Luego:                 Robótica
Después:               Biotecnología
Finalmente:            Captura de Carbono
```

Estas tecnologías no deben convertirse en dependencias del MVP.
Deben convertirse en nuevas capacidades del ecosistema.

## 14. Evolución de la Inteligencia Artificial

La IA debe evolucionar por etapas:

```
1. conocimiento estructurado;
2. base de conocimiento;
3. contexto del usuario;
4. contexto de finca/lote/proyecto;
5. RAG;
6. modelos especializados;
7. IA multimodal;
8. visión artificial;
9. visión satelital.
```

La prioridad inicial es tener datos estructurados y confiables.
Sin buenos datos, una IA avanzada no tendrá un contexto suficientemente
confiable.

## 15. Visión Artificial

Arquitectura conceptual:

```
Cámara → Imagen → Modelo IA → Identificación / análisis
       → Recomendación → Evidencia → Historial MELANTIA
```

La visión artificial debe integrarse con el Asistente Técnico y no
funcionar como una aplicación aislada.

## 16. Visión Satelital

Arquitectura conceptual:

```
Satélite → Imagen → Análisis → Lote MELANTIA
         → Indicadores / alertas → Asistente Técnico
```

La información satelital deberá relacionarse con los lotes y proyectos
existentes.

## 17. Servicios Financieros

Evolución conceptual:

```
MELANTIA → Perfil financiero → Servicios financieros
         → Pagos → Wallet → Tarjeta MELANTIA
```

La implementación real deberá depender de:

- entidades autorizadas;
- proveedores de pago;
- requisitos KYC;
- normativa;
- regulación financiera;
- acuerdos con bancos/cooperativas.

**No se debe asumir que MELANTIA custodiará fondos directamente.**

## 18. Drones, robótica y biotecnología

Estas áreas deben considerarse líneas tecnológicas/empresariales del
Ecosistema MELANTIA. No son simplemente nuevas pantallas de la
aplicación.

**Drones**

- diagnóstico;
- monitoreo;
- aplicación aérea de precisión;
- servicios especializados.

**Robótica**

- automatización agrícola;
- monitoreo;
- operaciones de precisión.

**Biotecnología**

- biofábricas;
- insumos personalizados;
- sistemas automatizados de cultivos celulares.

La aplicación será la capa digital que coordine datos, operaciones,
usuarios, proyectos y resultados.

## 19. Captura de carbono

Debe mantenerse como proyecto de largo plazo.

Primera etapa:

- encuesta de interés;
- explicación de requisitos;
- registro de productores interesados;
- registro de nuevas plantaciones participantes;
- seguimiento.

Cuando exista una escala suficiente — aproximadamente **2.000–3.000
hectáreas como umbral de planificación** — se podrá iniciar el proceso
formal correspondiente, siempre sujeto a los requisitos y directrices de
los validadores.

> El rango de 2.000–3.000 ha **NO** debe tratarse como requisito
> universal de elegibilidad.

## 20. Estrategia territorial

MELANTIA no debe comenzar intentando cubrir todo Ecuador
simultáneamente.

La primera validación territorial será: **MANABÍ**.

Manabí será el territorio inicial para validar el ecosistema.
Se buscará conectar:

- campo;
- productores;
- fincas;
- comercio;
- Marketplace;
- comunidad;
- turismo;
- cultura;
- profesionales;
- consumidores.

El objetivo no es únicamente validar una aplicación. Es validar si
MELANTIA puede conectar diferentes componentes de la economía y vida
rural.

## 21. Expansión territorial

Después de validar Manabí:

```
Etapa 2:  Santo Domingo — conexión Costa–Sierra.
Etapa 3:  Latacunga / Sierra — agricultura, ganadería, turismo rural,
          emprendimientos y profesionales.
Etapa 4:  Oriente Ecuatoriano — agricultura, turismo, comunidades,
          biodiversidad, cultura y proyectos ambientales.
```

Posteriormente se podrá ampliar a otras ciudades y territorios.

## 22. Principio de expansión

No se debe expandir únicamente porque técnicamente sea posible.
La expansión debe producirse cuando existan datos reales de utilización.

En cada territorio se debe medir:

- adopción;
- usuarios activos;
- uso del Asistente Técnico;
- fincas registradas;
- actividad comercial;
- publicaciones;
- operaciones;
- utilización de comunidad;
- participación de profesionales;
- turismo;
- retención;
- problemas;
- funciones más utilizadas;
- funciones abandonadas;
- nuevas necesidades.

La experiencia de Manabí servirá para decidir qué debe modificarse
antes de expandir MELANTIA.

## 23. Cultura y Saberes Ancestrales

El proyecto **El Tesoro de los Abuelos / Memoria Viva** y el proyecto
de **Saberes Ancestrales y Folklore** son componentes estratégicos para
conectar comunidades.

Pueden registrar y preservar, con el consentimiento y las reglas
correspondientes:

- historia;
- conocimientos tradicionales;
- plantas;
- gastronomía;
- artesanías;
- música;
- festividades;
- técnicas productivas;
- relatos;
- lugares culturales;
- memoria de los mayores.

Esto puede conectar posteriormente:

```
Comunidad → Cultura → Turismo → Gastronomía → Productos
          → Economía local.
```

Debe respetarse siempre el consentimiento, los derechos colectivos y
las reglas aplicables a los conocimientos tradicionales.

## 24. Conexión campo–comercio–turismo–cultura

Una de las grandes posibilidades futuras de MELANTIA será conectar
diferentes actores.

Ejemplo:

```
Productor → Producto → Marketplace → Restaurante → Consumidor
```

Otro:

```
Comunidad → Historia → Lugar → Cultura → Turismo → Gastronomía
          → Artesanía
```

Otro:

```
Productor → Finca → Profesional → Proyecto → IA → Asistencia técnica
          → Resultado
```

Así MELANTIA puede convertirse progresivamente en una infraestructura
digital para la economía rural.

## 25. Arquitectura que debe quedar preparada desde ahora

Aunque algunas funciones se implementen años después, la arquitectura
debe conservar:

- API-first;
- modularidad;
- separación de dominios;
- autenticación;
- autorización;
- auditoría;
- almacenamiento;
- sincronización;
- evidencias;
- Marketplace transversal;
- perfiles;
- Workspace;
- proyectos;
- recursos;
- agenda;
- notificaciones;
- IA desacoplada;
- integraciones externas desacopladas;
- proveedores de pago desacoplados.

Las futuras capacidades no deben obligar a reescribir el núcleo.

## 26. Regla final de arquitectura

La pregunta no debe ser:

> "¿Cómo hacemos ahora la función de drones?"

Debe ser:

> "¿Qué infraestructura necesita MELANTIA hoy para que dentro de dos
> años podamos incorporar drones sin reconstruir la plataforma?"

Lo mismo aplica a:

- IA;
- visión artificial;
- satélite;
- finanzas;
- Wallet;
- tarjeta;
- robótica;
- biotecnología;
- carbono;
- turismo;
- restaurantes;
- comercios;
- servicios profesionales.

## 27. Hoja de ruta conceptual

```
BASE ROBUSTA
      ↓
MVP MELANTIA
      │
      ├── Asistente Técnico
      ├── Gestión de Fincas
      ├── Trazabilidad
      ├── Evidencias
      ├── Negocios Rurales
      ├── Marketplace
      └── Comunidad
      ↓
VALIDACIÓN EN MANABÍ
      ↓
ECOSISTEMA PROFESIONAL
      +
IA AVANZADA
      ↓
VISIÓN ARTIFICIAL
      ↓
VISIÓN SATELITAL
      ↓
SERVICIOS FINANCIEROS
      ↓
WALLET + TARJETA
      ↓
DRONES
      ↓
ROBÓTICA
      ↓
BIOTECNOLOGÍA
      ↓
CAPTURA DE CARBONO
      ↓
EXPANSIÓN TERRITORIAL
COSTA → SIERRA → ORIENTE
```

## Objetivo estratégico

MELANTIA debe comenzar siendo una plataforma rural fuerte y útil, pero
su arquitectura debe permitir evolucionar hacia un ecosistema digital
que conecte producción, comercio, servicios profesionales, comunidad,
cultura, turismo, inteligencia artificial, tecnología y economía rural.
