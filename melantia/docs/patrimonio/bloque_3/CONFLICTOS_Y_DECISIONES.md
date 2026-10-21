# CONFLICTOS Y DECISIONES DEL PATRIMONIO MELANTIA

Registro de discrepancias encontradas en la auditoría. **Ninguna se resuelve en este bloque.** Se separa siempre `REGLA HISTÓRICA` de `DECISIÓN ACTUAL`.

## 1. Conflictos de reglas de negocio

### CONF-01 — Comisión MELANTIA por transacción

| Versión | Valor | Fuente |
|---|---|---|
| REGLA HISTÓRICA A | 2% (`COMISION_PORCENTAJE = 0.02`) | `src/modules/pasarela_garantia_melantia.py` (código escrow) |
| REGLA HISTÓRICA B | 5% | `docs/historico/pagos/config_pagos_melantia.js` (rescatado) |
| **DECISIÓN ACTUAL** | **3%** | Decisión vigente MELANTIA (registrada en `docs/historico/README.md`) |

- **Estado**: `RESUELTO POR DECISIÓN ACTUAL` (3%).
- **Acción requerida**: toda lógica migrada que aplique comisión debe usar 3% o parametrizarla; las fuentes históricas NO se editan.
- **Nota**: `economia_melantia.js` documenta además "socios NO pagan comisiones por venta, solo mensualidad" — regla de alcance pendiente de confirmar.

### CONF-02 — Límite de canje de Melantios en tiendas

| Versión | Valor | Fuente |
|---|---|---|
| Constante | `limite_canje_global: 0.5` (50%) | `economia_melantia.js` código |
| Comentario | "solo puedes cubrir hasta el 25% del valor de un producto" | `economia_melantia.js` comentario "actualizado 2026" |

- **Estado**: `PENDIENTE_DECISIÓN`. El comentario es más reciente que la constante, pero no se elige.
- **Acción**: decisión de negocio antes de migrar motor Melantios.

### CONF-03 — Microcrédito Melantios

| Regla encontrada | Detalle |
|---|---|
| Elegibilidad | ≥ 7,000 Melantios + ≥ 3 meses de suscripción |
| Monto | 80% del acumulado |
| Interés | 2% mensual |

- **Estado**: `PENDIENTE_DECISIÓN` (confirmar vigencia; ningún equivalente actual auditado).

### CONF-04 — Retiro de Melantios

| Regla encontrada | Detalle |
|---|---|
| Frecuencia | cada 3 meses |
| Deducciones | IVA 15% + retención 15% |
| Extra | 15% adicional solo a los 12 meses |

- **Estado**: `PENDIENTE_DECISIÓN`.

### CONF-05 — Recompensas en cascada / distribución Melantios

- `RECOMPENSAS_MELANTIOS.distribucion_cascada` por tipo y rol (`ganarMelantioCascada`), `liberarMelantiosPorValidacionPadrino`, beneficio por suscripción = 10% del precio del plan, vencimiento de Melantios a 90 días, comisión tienda `bienes_raices` = 4%.
- **Estado**: `PENDIENTE_DECISIÓN` — tabla completa a extraer durante la revisión del motor (MIG-040).

### CONF-06 — Alcance de comisiones de venta

- Comentario en `economia_melantia.js`: socios no pagan 3% ni 5%, solo mensualidad.
- Conflicto potencial con CONF-01 (3% actual). **Estado**: `PENDIENTE_DECISIÓN` (¿la comisión aplica a no-socios únicamente?).

### CONF-07 — Planes de suscripción

| Versión | Planes/precios | Fuente |
|---|---|---|
| REGLA HISTÓRICA A | BASICO 4.99 · STANDARD 11.99 · PROFESIONAL 15.99 · EMPRESARIAL 19.99 | `old_version/src/modules/01_suscripciones/auth_suscripciones_unificado.py` |
| REGLA HISTÓRICA B | FAMILIAR 4.99 · EXPORTADOR 11.99 | `respaldo/.../01_suscripciones/auth_suscripciones_unificado.py` |
| DECISIÓN ACTUAL | NO DETERMINADO EN EL PATRIMONIO AUDITADO (módulo actual = ecosistema profesional/perfiles, en construcción) | backend actual |

- **Estado**: `PENDIENTE_DECISIÓN` — definir catálogo de planes vigente antes de migrar lógica de suscripciones/afiliados.

## 2. Conflictos de datos / estructura

### CONF-08 — Labores de plátano (Bloque 1)

- `platano_barraganete.labores_cosecha` y `.labores_postcosecha`: `cultivos_platano.json` vs `cultivos_platano_barraganete.json` difieren. Ambos valores preservados bajo `_conflicto` en el consolidado.
- **Estado**: `PENDIENTE_DECISIÓN` (revisión agronómica del usuario).

### CONF-09 — `supabase_config.js` mal nombrado

- En `old_version/src/database/` el archivo contiene Python SQLAlchemy; en `respaldo` contiene la config JS real.
- **Estado**: `IDENTIFICADO` — anomalía de versión, sin acción de datos.

### CONF-10 — Diferencias de árboles históricos (7 archivos)

`data/modulos_usuario.json`, `supabase_config.js`, `app_structure_melant_ia.js` (ES module vs CommonJS export), `auth_suscripciones_unificado.py` (ver CONF-07) y 3 `.md` veterinarios con contenido divergente.

- **Estado**: `IDENTIFICADO` — ambas versiones preservadas; revisión puntual si se migran.

## 3. Conflictos de arquitectura

### CONF-11 — Backend de almacenamiento de evidencias

- Histórico: Supabase Storage + tabla `evidencia_fotos_nube` (`modulo11_logica.js`, `supabase_config.js`).
- Actual: PostgreSQL + FastAPI; proveedor de almacenamiento de blobs **NO DETERMINADO EN EL PATRIMONIO AUDITADO**.
- **Estado**: `BLOQUEADO` (BLOQ-01) — requiere decisión de infraestructura.

### CONF-12 — Persistencia histórica SQLite vs PostgreSQL actual

- `generador_qr_productor.py`, `procesar_ocds_a_sqlite.py`, `tablas_control_palmas.sql`, `descarga_masiva_bibliografia` usan SQLite.
- **Estado**: `IDENTIFICADO` — toda migración de acceso a datos pasa a PostgreSQL; no bloquea diseño, bloquea portado directo.

### CONF-13 — Runtime de modelos IA

- `melantia_cerebro.h5` (Keras) y `melantia_model.tflite` existen; el stack actual usa LLM vía `services/llm.py`.
- **Estado**: `PENDIENTE_DECISIÓN` — conservar modelos; su runtime de inferencia no está definido.

### CONF-14 — Service workers (3 versiones)

- `service-worker.js` (7.6 KB), `sw-melantia.js` (1.4 KB), `sw.js` (0.6 KB) — estrategias de caché divergentes.
- **Estado**: `PENDIENTE_DECISIÓN` — definir estrategia offline única antes de portar.

## 4. Backlog de decisión de negocio (resumen)

| ID | Tema | Decisión requerida | Desbloquea |
|---|---|---|---|
| CONF-01 | Comisión venta 3% aplicada a qué actores | Alcance de la regla actual | MIG-023, MIG-040, MIG-041 |
| CONF-02 | Canje Melantios 25% vs 50% | Límite vigente | MIG-040 |
| CONF-03/04/05 | Microcrédito, retiro, cascada Melantios | Vigencia de reglas | MIG-040 |
| CONF-07 | Catálogo de planes | Planes vigentes | MIG-042, MIG-043 |
| CONF-11 | Storage de evidencias | Proveedor/diseño | MIG-012, MIG-018 |
| CONF-13 | Runtime modelos IA | Estrategia de inferencia | MIG-049 (parcial) |
| CONF-14 | Estrategia offline | Una sola | MIG-020 |
