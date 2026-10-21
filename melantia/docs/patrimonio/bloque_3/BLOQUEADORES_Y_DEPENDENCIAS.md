# BLOQUEADORES Y DEPENDENCIAS DE MIGRACIÓN

## 1. Bloqueadores de migración

| ID | Elemento | Bloqueador | Tipo | Dependencia | Decisión requerida | Prioridad |
|---|---|---|---|---|---|---|
| BLOQ-01 | Evidencias (`modulo11_logica.js`, `registro_evidencia_fotografica.js`, pipeline M11) | Sin proveedor de storage definido en arquitectura actual | Infraestructura | Storage blobs + tabla | Proveedor de almacenamiento (Supabase u otro) y esquema PG | P0 |
| BLOQ-02 | Credencial Supabase histórica | `anonKey` real en histórico (ver `ALERTAS_SEGURIDAD.md`) | Seguridad | — | Rotación/verificación como tarea autorizada | P0 |
| BLOQ-03 | Motor Melantios (MIG-040) | Reglas internas contradictorias (CONF-02..06) | Negocio | CONF-01..06 | Reglas de negocio aprobadas | P0 (decisión) |
| BLOQ-04 | Escrow `pasarela_garantia` (MIG-023) | Comisión histórica 2% vs decisión 3%; sin proveedor de pagos real | Negocio+integración | CONF-01; proveedores de pago | Parámetros y proveedor | P0 (decisión) |
| BLOQ-05 | Suscripciones/afiliados (MIG-042/043) | Dos versiones de planes; catálogo vigente no determinado | Negocio | CONF-07 | Planes actuales | P1 |
| BLOQ-06 | Modelos IA (`cerebro.h5`, `model.tflite`) | Runtime de inferencia no definido | Arquitectura | CONF-13 | Estrategia IA (LLM actual vs modelos propios) | P2 |
| BLOQ-07 | Offline (3 service workers) | Estrategias divergentes | Arquitectura | CONF-14 | Una estrategia offline | P1 |
| BLOQ-08 | Todo acceso SQLite histórico | Backend actual es PostgreSQL | Arquitectura | CONF-12 | (Resuelto en diseño: portar a PG) | P1 |
| BLOQ-09 | `cultivos_consolidado.json` | Pendiente validación humana | Proceso | MIG-003 | Aprobación de consolidado | P0 |
| BLOQ-10 | Pagos (PayPhone/Deuna/PeiGO) | Sin adapters reales en histórico; solo specs | Integración | Proveedores reales | Proveedor(s) de pago actuales | P1 |

## 2. Grafo lógico de dependencias

```text
SEGURIDAD (BLOQ-02)
   └─ desbloquea ──> limpieza y exposición futura del histórico

DECISIONES DE NEGOCIO (CONF-01..07)
   └─ desbloquea ──> M04 escrow / Melantios / marketplace
                     M01 suscripciones / afiliados
                     M10 microcrédito

VALIDACIÓN CONSOLIDADO CULTIVOS (MIG-003)
   └─ habilita ──> patrón de consolidación E1
                     (veterinaria, manuales, regenerativa, salud, cultural)

INFRAESTRUCTURA TRANSVERSAL
   Estrategia offline (BLOQ-07, MIG-020)
      └─> supervivencia/cola offline (MIG-013)
            └─> tracking de entregas (MIG-019)
   Storage de evidencias (BLOQ-01)
      └─> pipeline M11 (MIG-012)
            └─> QR productor con evidencia (MIG-018)
                  └─> trazabilidad (MIG-017)

PostgreSQL actual (CONF-12)
   └─ requerido por ──> QR productor, OCDS→DB, control palmas,
                        laboratorio, suscripciones, Melantios

M03 EJE FUNCIONAL
   GPS/UTM (MIG-010/011)
      └─> Levantamientos (ya existe en backend)
            └─> Gestión de Fincas
                  └─> Trazabilidad (MIG-017)
                        └─> Evidencias (MIG-012)
                              └─> Marketplace (MIG-041) / Proyectos carbono (MIG-028)

M02 CONOCIMIENTO → LÓGICA
   Consolidados de conocimiento (MIG-021/022/026/029/051)
      └─> Diagnóstico/triaje (MIG-030)
            └─> Laboratorio (MIG-014), Sanidad (MIG-015), Agricultura digital (MIG-016)
                  └─> Buscador Escuela (MIG-025) consume corpus consolidado
```

## 3. Dependencias por migración clave

| Migración | Depende de | Es requerida por |
|---|---|---|
| MIG-010 GPS/UTM | — (algoritmo puro) | Levantamientos, fincas, trazabilidad |
| MIG-012 Evidencias | BLOQ-01 storage | M04 marketplace, M06 carbono, M03 trazabilidad |
| MIG-014 Laboratorio | Esquema PG de análisis (por definir) | ATR diagnóstico |
| MIG-017 Trazabilidad | Modelo finca actual (schema `levantamientos.sql` existe) | Evidencias, marketplace, carbono |
| MIG-018 QR productor | PostgreSQL (sustituye SQLite) | Trazabilidad, reputación |
| MIG-019 Tracking | Cola offline (MIG-013/020) | Marketplace entregas |
| MIG-020 Offline | CONF-14 estrategia | Toda la app (offline-first) |
| MIG-021/022/026 Conocimiento | Patrón consolidado validado (MIG-003) | ATR, Escuela, diagnósticos |
| MIG-023 Escrow | CONF-01 + proveedor pagos | Marketplace |
| MIG-025 Buscador | Corpus escuela consolidado (MIG-026) | Escuela de Campo |
| MIG-027 Docs legales | `legal_data/` plantillas | M08 comunidad, M12 |
| MIG-028 Carbono PDF | `pdf_generator/`, schema proyectos | M06 proyectos |
| MIG-030 Diagnóstico | Consolidados + motor de reglas | ATR |
| MIG-040 Melantios | CONF-02..06 | M04, M10 |
| MIG-048 Ingestas externas | PostgreSQL | M04 oportunidades, M02 sanidad |

Dependencias no verificadas en el patrimonio auditado se marcaron `DEPENDENCIA NO CONFIRMADA` en el backlog cuando aplican.
