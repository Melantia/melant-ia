# PLAN MAESTRO DE RECUPERACIÓN Y MIGRACIÓN DEL PATRIMONIO MELANTIA

**Bloque 3 — Planificación únicamente. Nada de este documento está implementado.**

- Fecha de elaboración: Bloque 3 (post Bloques 1 y 2)
- Fuente de verdad: Matriz Maestra de Patrimonio MELANTIA (Bloques 1 + 2)
- Alcance: `melant_ia/src` (git), `melantia_old_version/src`, `melantia_old_version/respaldo_melantia/melant_ia/src`

---

## 1. Propósito

Transformar el inventario patrimonial auditado en un plan técnico ordenado, trazable y ejecutable **con autorización explícita posterior**. Este documento no migra, integra ni elimina nada. Define el marco bajo el cual se ejecutará el Bloque 4 (migración controlada, elemento por elemento).

## 2. Principios rectores

1. **Histórico ≠ inútil.** Todo archivo conserva presunción de valor hasta demostrar lo contrario.
2. **Duplicado ≠ eliminable automáticamente.** Solo se recomienda descarte cuando exista fuente equivalente preservada y cero información única.
3. **Regla histórica ≠ decisión actual.** Toda regla de negocio histórica se registra separada de la decisión vigente; ninguna se reconcilia automáticamente.
4. **Conocimiento ≠ lógica ≠ funcionalidad.** Cada patrimonio se clasifica por naturaleza antes de asignar destino.
5. **Pérdida cero es la meta.** Toda migración/consolidación exige criterio de no-pérdida verificable (ver `CRITERIOS_ACEPTACION_MIGRACION.md`).
6. **Sin conocimiento externo.** Lo no respaldado por la matriz o los informes se marca `NO DETERMINADO EN EL PATRIMONIO AUDITADO`.

## 3. Taxonomía aplicada

| Categoría | Definición operativa |
|---|---|
| A. CONOCIMIENTO | Manuales, protocolos, fichas, bibliografía, cursos |
| B. LÓGICA | Reglas de negocio, validaciones, estados, cálculos |
| C. FUNCIONALIDAD | Capacidades completas (escrow, GPS, evidencias) |
| D. CONFIGURACIÓN/ORQUESTACIÓN | Prompts, índices, pipelines, service workers, navegación |
| E. DATOS/CATÁLOGOS | Estructuras que alimentan funcionalidades |
| F. HISTÓRICO | Valor documental sin retorno al runtime |

## 4. Destinos y estados

**Destinos**: MIGRAR · CONSOLIDAR · DOCUMENTAR · REVISAR · MANTENER HISTÓRICO · DESCARTABLE (pendiente — nada se elimina en este bloque).

**Estados permitidos**: `IDENTIFICADO` · `PENDIENTE_DECISIÓN` · `BLOQUEADO` · `LISTO_PARA_MIGRAR` · `LISTO_PARA_CONSOLIDAR` · `MANTENER_HISTÓRICO` · `DESCARTABLE_PENDIENTE` · `MIGRACIÓN_POSTERIOR`.

**Prioridades**: P0 crítico · P1 alta · P2 media · P3 baja · P4 conservación.

## 5. Estado del patrimonio al cierre de la auditoría

| Grupo | Volumen | Situación |
|---|---|---|
| Conocimiento de cultivos | ~93 fuentes JSON → `consolidado/cultivos_consolidado.json` (90 cultivos, pérdida=0) | **PATRIMONIO CONSOLIDADO PENDIENTE DE VALIDACIÓN** |
| Conocimiento veterinario | ~200 `.md` semillas bibliográficas + JSON | LISTO_PARA_CONSOLIDAR (candidato) |
| Manuales técnicos `.txt` | ~43 protocolos/manuales | LISTO_PARA_CONSOLIDAR (candidato) |
| Agricultura digital | ~19 archivos (`agricultura_digital/`) | LISTO_PARA_MIGRAR (previa revisión por elemento) |
| Lógica de negocio (escrow, Melantios, pagos, planes) | ~15 archivos | PENDIENTE_DECISIÓN / BLOQUEADO |
| Funcionalidades transversales (offline, sync, voz, IA) | ~30 archivos | IDENTIFICADO / MIGRACIÓN_POSTERIOR |
| Módulos M05–M12 | ~80 archivos | IDENTIFICADO (mayoría), parcialmente LISTO |
| Duplicados/histórico puro | ~1,438 idénticos entre árboles + árbol paralelo 99% duplicado | MANTENER_HISTÓRICO |
| Corruptos/vacíos | 70 `.md"`, `modelo_ligero.tflite` (0B), stub 2B, `.pyc` | DESCARTABLE_PENDIENTE |

## 6. Orden recomendado de ejecución (NO ejecutar ahora)

```text
E0  SEGURIDAD Y DECISIONES
    └─ Rotación/verificación credencial Supabase (tarea separada autorizada)
    └─ Resolución de conflictos de negocio (comisiones, Melantios, planes)
    └─ Validación humana de cultivos_consolidado.json
         ↓
E1  CONSOLIDACIÓN DE CONOCIMIENTO RESTANTE
    └─ Veterinaria → manuales/protocolos → agricultura regenerativa
       → salud → legal → cultural (mismo patrón de pérdida cero que Bloque 1)
         ↓
E2  INFRAESTRUCTURA TRANSVERSAL
    └─ Offline-first (sync, IndexedDB, service workers equivalentes)
    └─ Capa de evidencias base (compresión, integridad, almacenamiento)
         ↓
E3  M03 GPS/UTM → LEVANTAMIENTOS → TRAZABILIDAD
    └─ Es el eje funcional con mayor correspondencia al backend actual
         ↓
E4  M02 ATR: laboratorio, sanidad, diagnóstico, agricultura digital
    └─ Sobre el conocimiento ya consolidado
         ↓
E5  M04 NEGOCIOS: escrow, marketplace, Melantios
    └─ Solo tras E0 (decisiones de negocio resueltas)
         ↓
E6  M07–M12: escuela, comunidad, salud, finanzas, proyectos, legal
         ↓
E7  PRUEBAS DE REGRESIÓN PATRIMONIAL
    └─ Comparación antes/después por elemento migrado
         ↓
E8  LIMPIEZA HISTÓRICA
    └─ Solo elementos con equivalente preservado y verificado
         ↓
E9  DESCARTABLES
    └─ Último paso, con autorización explícita por elemento
```

**Justificación**: la seguridad y las decisiones de negocio son prerequisitos reales (bloqueadores), no formales. El conocimiento se consolida antes que la lógica porque la lógica lo consume. La infraestructura transversal precede a los módulos que dependen de ella (evidencias, offline). M03 tiene prioridad funcional porque levantamientos/GPS ya tienen esquema y endpoints en el backend actual.

## 7. Relación con el consolidado de cultivos

`backend/modules/asistente_tecnico/knowledge/consolidado/cultivos_consolidado.json`:

- Permanece intacto, no promovido al runtime (`KnowledgeService` usa glob no recursivo — el subdirectorio `consolidado/` queda fuera de carga automática).
- Estado: `PATRIMONIO CONSOLIDADO PENDIENTE DE VALIDACIÓN`.
- Sus 2 conflictos internos (labores plátano) permanecen documentados en `CONFLICTOS_Y_DECISIONES.md`.
- Es el patrón de referencia para las consolidaciones E1.

## 8. Gobernanza del Bloque 4

Cada elemento migrado requerirá: fuente exacta, destino, dependencias verificadas, decisión aplicada (si aplica), criterio de aceptación, pruebas, trazabilidad y **autorización explícita**. Nada en este plan autoriza ejecución.

## 9. Documentos del bloque

| Documento | Contenido |
|---|---|
| `MATRIZ_MIGRACION.md` | Matriz priorizada completa |
| `CONFLICTOS_Y_DECISIONES.md` | Conflictos de negocio/versión/datos |
| `BLOQUEADORES_Y_DEPENDENCIAS.md` | Bloqueadores + grafo de dependencias |
| `BACKLOG_MIGRACION.md` | Backlog MIG-001… ordenado |
| `ALERTAS_SEGURIDAD.md` | Alertas (sin secretos) |
| `CRITERIOS_ACEPTACION_MIGRACION.md` | No-pérdida + plan de pruebas futuras |
