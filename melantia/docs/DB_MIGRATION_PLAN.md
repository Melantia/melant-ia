# MELANTIA — Plan de Migración `melantia_db` (PostgreSQL 17)

Propuesta de orden exacto desde una base **vacía**. Nada aquí está
ejecutado — esperando aprobación.

## Principios

- Fuente canónica: `backend/database/schema/` (versiones más nuevas con
  `updated_at`, CHECKs, NOT NULL). `migracion_inicial.sql` se usa solo
  para lo que `schema/` no cubre — **no se ejecuta entero**.
- Todo aditivo: `IF NOT EXISTS`, sin DROP, sin borrar archivos.
- Patrón offline-first en tablas nuevas: `UUID PK (uuid_generate_v4())`,
  `created_at`/`updated_at`, `sync_status` donde aplique.

## Orden de ejecución propuesto

### Paso 0 — Extensiones
```
schema/extensions.sql   — uuid-ossp siempre; postgis SOLO si está
                          instalado (ver §Cambios mínimos, C1)
```

### Paso 1 — Catálogos geográficos (INEC)
```
schema/geografia.sql    — provincias, cantones, parroquias, ciiu
```
(seeds de provincias/cantones quedan pendientes — no existen archivos
de seed todavía; `usuarios.provincia_id` es nullable, no bloquea)

### Paso 2 — Core usuarios + auth
```
schema/usuarios.sql     — usuarios + storage_usado_mb + password_hash
```

### Paso 3 — Gestión de fincas (M3 base + contexto M2)
```
schema/gestion_fincas.sql   — fincas, lotes, hatos_ganaderos,
                              practicas_regenerativas + índices
```

### Paso 4 — Pecuario detalle (M3 ampliado)
```
schema/modulos/animales.sql          — animales
schema/modulos/labores_pecuarias.sql — eventos_animales
```

### Paso 5 — Motor de trazabilidad (M3)
```
schema/trazabilidad.sql   — 6 tablas + índices
```

### Paso 6 — Negocios rurales (M4, v2 canónico)
```
schema/modulos/negocios_rurales_v2.sql
```
⚠ Requiere decisión previa: el controlador actual usa columnas v1
(ver auditoría P4). Recomendado: **adaptar el controlador a v2**,
no crear el schema v1.

### Paso 7 — Evidencias y registro de campo (M11 + main.py legacy)

`evidencias_documentos` y `registros_campo` solo existen dentro de
`migracion_inicial.sql` (§6 y §9). Propuesta: extraerlos a
`schema/evidencias.sql` y `schema/registros_campo.sql` (nuevos archivos
de extracción — el original NO se borra), ampliando `registros_campo`
con las 5 columnas que el código ya usa:

```sql
-- columnas requeridas por main.py (auditoría P3)
especie_afectada        VARCHAR(100),
diagnostico_usuario     TEXT,
clasificacion_ia        VARCHAR(150),
es_activo_conocimiento  BOOLEAN DEFAULT FALSE,
hash_transaccion        VARCHAR(64)          -- dedup idempotente offline
```

y su trigger de cuota `verificar_limite_almacenamiento_melantia()`
(migracion_inicial §10) + `usuarios.storage_usado_mb` (ya en paso 2).

### Paso 8 — Tablas faltantes que el código ya usa (nuevas)

`schema/suscripciones.sql` (nuevo) — consolidando el incentivo Melantios
que main.py escribe hoy:

```sql
CREATE TABLE IF NOT EXISTS usuarios_suscripciones (
    usuario_id             UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre                 VARCHAR(150) NOT NULL,
    plan_actual            VARCHAR(50)  NOT NULL DEFAULT 'Standard',
    melantios_balance      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ultima_sincronizacion  TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perfil_economico_productor (
    usuario_id             UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    area_total_cultivos_m2 NUMERIC(14,2) DEFAULT 0,
    cabezas_ganado_total   INT DEFAULT 0,
    score_productivo_melantia INT DEFAULT 0,
    fecha_ultimo_calculo   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Paso 9 — Índices de apoyo restantes
Los ya cubiertos por cada archivo + (si se extrae evidencias):
```
idx_evidencias_hash        evidencias_documentos(hash_transaccion)
idx_registros_campo_user   registros_campo(usuario_id)
idx_registros_campo_hash   registros_campo(hash_transaccion)
```
(los índices de gestion_fincas/trazabilidad/negocios ya vienen en su archivo)

## Cambios mínimos necesarios (propuestos, no aplicados)

| # | Cambio | Archivo | Motivo |
|---|---|---|---|
| C1 | Hacer `postgis` opcional o moverlo a migración posterior | `schema/extensions.sql` | PG17 vanilla no lo trae; ninguna columna lo usa aún |
| C2 | Crear `schema/evidencias.sql` extrayendo §6 de migracion_inicial | nuevo | evidencias_documentos solo existe dentro del plano maestro |
| C3 | Crear `schema/registros_campo.sql` extrayendo §9–10 + 5 columnas del código | nuevo | P3 — 5 columnas usadas y no definidas |
| C4 | Crear `schema/suscripciones.sql` (Paso 8) | nuevo | P2 — dos tablas sin DDL |
| C5 | Adaptar `modules/negocios_rurales/controllers.py` a bolsa v2 (`producto_servicio`, `cantidad`+`unidad`, estados lowercase, sin comision_app/valor_neto en oferta) | backend | P4 — incompatibilidad objetiva |
| C6 | Marcar `migracion_inicial.sql` como documento histórico (comentario de cabecera) | migraciones/ | evitar doble fuente de verdad (P5); NO borrar |

## NO tocar

- `supabase/migrations/` — destino Supabase, pendiente de decisión
  Supabase-vs-local y depuración de duplicados.
- `init_db.py` — bootstrap SQLite legacy; su rol queda documentado,
  decisión de retiro para etapa posterior.
- `docker-compose.yml` — Podman queda como referencia.
- `evidencias_documentos` mezcla custodia+comercial (P6): crear tal cual
  ahora; la separación evidencia/transacción es un rediseño M11 posterior.

## Post-migración (verificación)

```
\dt                                  → 26 tablas esperadas
POST /api/auth/registro              → 201 + JWT
POST /api/auth/login                 → 200 + JWT
GET  /api/auth/me                    → 200 usuario
GET  /api/v1/asistente/contexto/fincas → 200 [] (lista vacía)
pytest                               → 54/54 sin regresión
```
