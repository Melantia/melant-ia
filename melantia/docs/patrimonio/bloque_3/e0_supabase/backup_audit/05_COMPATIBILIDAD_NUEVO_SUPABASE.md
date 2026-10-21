# 05 — COMPATIBILIDAD CON EL NUEVO PROYECTO SUPABASE

Análisis **conceptual** (sin conexión ni modificación del proyecto nuevo) de qué ocurriría al aplicar `db_cluster-29-09-2026@17-17-59.backup.gz` sobre un Supabase nuevo.

---

## 5.1 Qué pasaría si se ejecutara el dump completo tal cual

El dump es un `pg_dumpall` de clúster. Reproducirlo íntegro sobre un Supabase nuevo **fallaría casi inmediatamente**:

| Orden en el dump | Sentencia | Resultado sobre proyecto nuevo |
|---|---|---|
| Global | `CREATE ROLE anon; CREATE ROLE postgres; …` | **ERROR** — todos los roles ya existen |
| Global | `ALTER ROLE … WITH …` / `ALTER ROLE … SET` | Conflictos/atributos distintos de plataforma |
| Global | `GRANT … TO authenticator … GRANTED BY supabase_admin` | Requiere ejecutarse como `supabase_admin` (superuser) — no disponible para el usuario normal |
| postgres | `CREATE SCHEMA auth; CREATE SCHEMA storage; …` | **ERROR** — esquemas ya existen |
| postgres | `CREATE EXTENSION pg_graphql …` | `IF NOT EXISTS` → se salta, pero versiones pueden diferir |
| postgres | `CREATE TABLE auth.users …` | **ERROR** — ya existe (y además GoTrue nuevo puede tener columnas distintas) |
| postgres | `COPY auth.schema_migrations` (82 filas) | Insertaría versiones de GoTrue antiguo → **corrompería el registro de migraciones del GoTrue nuevo** |
| postgres | Tablas/funciones de `storage`, `realtime`, `vault`, `pgbouncer` | Mismos conflictos + desalineación de versiones de servicios |
| postgres | Event triggers + `CREATE PUBLICATION supabase_realtime` | **ERROR** — ya existen |
| postgres | Esquema `public` (17 tablas, 4 enums, fn, triggers, vista, COPY) | **Única sección aplicable limpiamente** en un proyecto nuevo |

Además, ejecutar el dump requiere `psql` con soporte de `\restrict`/`\unrestrict` (psql ≥ 17.6 recomendado; versiones anteriores emiten warning e ignoran el guard, lo cual reduce la protección anti-sql-injection durante el replay pero no lo impide).

## 5.2 Clasificación de objetos

### A. Restaurables directamente (en el `public` de un proyecto nuevo)
- Las **17 tablas** `public.*` con sus PK/UNIQUE/CHECK/FK y 7 secuencias identity.
- Los **4 enums** `public.*`.
- `public.procesar_logica_comercial()` + 2 triggers.
- La vista `v_archivos_gama_baja_a_limpiar`.
- El seed de `public.precios_sustentabilidad_ecuador` (3 filas).
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY` de las 7 tablas (estructural; ver §5.3).

### B. Restaurables con cuidado / adaptación
- **Extensiones**: `uuid-ossp`, `pgcrypto`, `pg_stat_statements`, `pg_graphql`, `supabase_vault` — ya vienen disponibles; solo verificar `CREATE EXTENSION IF NOT EXISTS`.
- **GRANTs sobre `public`**: el dump otorga `ALL ON public.* TO anon/authenticated/service_role` — aplicarlos es opcional y debe revisarse (de hecho otorgar ALL a `anon` suele ser indeseado; lo correcto sería definir GRANTs + políticas RLS deliberadas).
- **`storage.objects`/`storage.buckets`**: estructura ya existe en el nuevo; datos vacíos → nada que migrar.
- **RLS**: `ENABLE RLS` se restaura con la tabla; las **políticas no existen** → hay que diseñarlas (no se pueden "restaurar" lo que nunca existió).

### C. NO restaurar (internos de plataforma)
- Roles y membresías (`supabase_*`, `postgres`, `authenticator`, `pgbouncer`, `dashboard_user`, …).
- Todo `auth.*`, `storage.*`, `realtime.*`, `vault.*`, `pgbouncer.*`, `graphql.*`, `graphql_public.*`, `extensions.*`.
- `auth.schema_migrations`, `storage.migrations`, `realtime.schema_migrations` (inyectar historiales ajenos rompería los servicios del proyecto nuevo).
- Event triggers `issue_*` / `pgrst_*`; publication `supabase_realtime`.
- `ALTER ROLE … SET`, DEFAULT PRIVILEGES de esquemas internos.
- La sección `\connect template1` (vacía, innecesaria).

## 5.3 Dependencias

| Dependencia | Estado |
|---|---|
| Con `auth.users` | **Ninguna desde `public`** (verificado: 0 FKs public→auth). `perfiles_usuario` está desacoplado. |
| Con `storage.objects`/`buckets` | Ninguna desde `public`; columnas `*_url` son texto plano sin FK. |
| Con roles | `public.*` es owned by `postgres`; GRANTs a `anon/authenticated/service_role` requieren que esos roles existan (en Supabase nuevo, existen). |
| Con extensiones | `extensions.uuid_generate_v4()` usado en 10 defaults → requiere `uuid-ossp` en schema `extensions` (estándar Supabase). `gen_random_uuid()` nativo (pgcrypto/pg13+). |
| Con funciones Supabase | Ninguna función `public` depende de `auth.uid()`/`auth.jwt()` — **no hay políticas** que las usen. |
| Conflictos de esquema | Todo lo no-`public` choca con objetos preexistentes del proyecto nuevo. |

## 5.4 Veredicto de compatibilidad

- **PostgreSQL 17.6 → nuevo Supabase (PG 15/17 según región):** si el nuevo proyecto es PG 15, el dump podría usar sintaxis/features 17-only (los metacomandos `\restrict` ya son un indicio de toolchain 17). **Restauración segura solo hacia PostgreSQL ≥ 17** — verificar versión del proyecto nuevo antes de planear.
- **La restauración completa es inviable por diseño** (no es defecto del backup: Supabase genera dumps de clúster para uso propio). El procedimiento correcto es **extracción selectiva del schema `public`** (ver `06_PLAN_RESTAURACION.md`).
- Como no hay datos de usuarios ni de negocio, la "migración" se reduce a **recrear DDL de public + 3 filas seed** — conceptualmente equivalente a aplicar una migración de esquema, no a una restauración de datos.
