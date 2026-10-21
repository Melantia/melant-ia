# CRITERIOS DE ACEPTACIÓN Y PLAN DE PRUEBAS FUTURAS

Documento de planificación. **No contiene tests implementados.**

## 1. Criterio general de no-pérdida (aplicable a todo elemento)

Para que una migración/consolidación se considere completa debe comprobarse:

- [ ] Contenido original identificado y listado por fuente exacta
- [ ] Fuente(s) registrada(s) en metadatos de procedencia
- [ ] Reglas originales identificadas (incluidas constantes y comentarios normativos)
- [ ] Conflictos identificados y registrados, no resueltos arbitrariamente
- [ ] Transformación prevista documentada antes de ejecutarse
- [ ] Destino definido en la arquitectura actual
- [ ] Pruebas previstas definidas (este documento)
- [ ] Trazabilidad origen→destino verificable (p. ej. campo `fuentes`)
- [ ] Ausencia de pérdida funcional demostrada por comparación antes/después
- [ ] Original intacto tras la operación (modificados/eliminados/movidos/renombrados = 0)

Patrón de referencia ya aplicado: Bloque 1 — 2,604 rutas de campo verificadas, ausentes = 0.

## 2. Criterios por elemento/dominio

### GPS / UTM / planos (MIG-010, MIG-011)

Debe probarse:
- conversión lat/lon → UTM en casos conocidos;
- cálculo de distancia haversine con tolerancia definida;
- cálculo de área poligonal (polígonos simples, cóncavos, cruce de zona UTM);
- validación de coordenadas (`_es_coordenada_valida`, precisión_m);
- generación de plano SVG (normalización de coordenadas);
- MockGPS vs GPS real; respaldo de última posición;
- casos límite: antimeridiano, polos, polígonos degenerados (2 puntos, auto-intersección).

### Escrow (MIG-023)

Debe probarse:
- creación de transacción (monto > 0; rechazo de monto ≤ 0);
- estado `RETENIDO_GARANTIA` y congelamiento;
- confirmación de comprador ausente → no libera;
- foto de verificación ausente → no libera;
- doble confirmación → liquidación neta con comisión parametrizada (3% actual);
- transacción ya liquidada → error;
- cancelación/devolución;
- registro auditable de transición de estados.

### Evidencias (MIG-012, MIG-013)

Debe probarse:
- compresión (≤500KB, ≤1280px) sin pérdida de legibilidad mínima;
- integridad (hash pre/post almacenamiento);
- almacenamiento y recuperación en proveedor decidido (BLOQ-01);
- cola offline (`guardar_evidencia_offline`, límite 100 registros);
- sincronización diferida;
- metadatos (finca_id, timestamp, GPS);
- auditoría de acceso.

### Melantios (MIG-040)

Debe probarse (tras resolver CONF-02..06):
- acumulación por tipo/rol (`ganarMelantioCascada`);
- distribución en cascada (padrino/afiliado);
- canje con límite vigente;
- retiro: frecuencia, IVA, retención, extra a 12m;
- microcrédito: elegibilidad, 80%, interés;
- vencimiento 90 días; liberación por validación de padrino;
- conversión Melantios↔USD; estados y límites.

### Laboratorio (MIG-014)

Debe probarse:
- clasificación de columnas por rangos;
- diagnóstico por fila (suelo, foliar, entomología);
- generación de alertas por fila;
- normalización de nutrientes;
- validación de DataFrame de suelo;
- archivos de entrada reales históricos como fixtures.

### Buscador Escuela (MIG-025)

Debe probarse:
- construcción de índice sobre corpus consolidado;
- normalización de texto (tildes, mayúsculas);
- fragmentación con solape;
- scoring y ranking por palabra clave;
- render acotado (`_MAX_CARACTERES_RENDER`);
- reconstrucción forzada vs caché.

### QR productor (MIG-018)

Debe probarse:
- extracción desde PostgreSQL (sustituye SQLite);
- estado sanitario derivado de registros de salud;
- promedios de calidad; historial clínico (máx 12);
- PDF final con QR verificable.

### Sanidad ganadera (MIG-015)

Debe probarse:
- validación de arete QR;
- validación de fecha de vacunación (futura → rechazo);
- `validar_registro_trazabilidad_ganadera` completo.

### Trazabilidad (MIG-017)

Debe probarse:
- carga de fases por cultivo;
- actualización de estado por paso;
- persistencia y orden de fases;
- cultivo sin trazabilidad → comportamiento definido.

### Consolidaciones de conocimiento (MIG-021/022/026/029/051)

Mismo criterio que Bloque 1:
- inventario de fuentes;
- pérdida=0 verificada por comparación de rutas/contenido;
- proveniencia por elemento (`fuentes`);
- JSON válido, UTF-8, determinista;
- separación conocimiento vs orquestación.

### Suscripciones/afiliados (MIG-042/043)

Debe probarse (tras CONF-07):
- registro inteligente con plan vigente;
- PIN de afiliado, ranking, resumen financiero;
- verificación de pago con proveedor actual.

### Documentos legales (MIG-027)

- plantilla renderiza todos los campos;
- QR generado con contenido del documento;
- entrada por texto (voz opcional);
- guardado con timestamp.

### Offline/sync (MIG-020, MIG-019)

- encolado sin conexión;
- sincronización al recuperar conexión;
- deduplicación; orden; marcas de sincronizado;
- cálculo de distancia restante.

## 3. Criterio de promoción del consolidado de cultivos (MIG-003)

- Validación humana del contenido y del esquema;
- re-ejecución de verificación pérdida=0;
- resolución o aceptación documentada de CONF-08;
- ubicación definitiva aprobada (promoción a `knowledge/` solo tras aprobación);
- prueba de carga por `KnowledgeService` tras promoción.

## 4. Criterio de descarte (aplicable solo a futuro bloque autorizado)

Un elemento `DESCARTABLE_PENDIENTE` solo puede eliminarse si se verifica:

- [ ] sin conocimiento único;
- [ ] sin lógica útil;
- [ ] sin datos únicos;
- [ ] sin decisiones arquitectónicas;
- [ ] no referenciado por otro elemento;
- [ ] existe equivalente preservado o irreproducibilidad aceptada;
- [ ] autorización explícita por elemento.
