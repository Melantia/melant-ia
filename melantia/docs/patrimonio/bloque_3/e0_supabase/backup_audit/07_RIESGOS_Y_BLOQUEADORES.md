# 07 — RIESGOS Y BLOQUEADORES

Clasificación: **P0** bloquea restauración · **P1** riesgo alto · **P2** riesgo medio · **P3** menor.

---

## 7.1 Matriz de riesgos

| ID | Riesgo | Clasificación | Detalle / mitigación |
|---|---|---|---|
| R-01 | **El backup no contiene datos** | **P0 para "recuperar datos"** — nulo para restaurar esquema | `auth.users`, todas las tablas `public` de negocio, `storage.buckets`, `storage.objects`: **0 filas**. Si el objetivo era recuperar usuarios/evidencias/operaciones históricas, **no existe en estos respaldos**. No hay mitigación técnica: habría que localizar otra fuente (otro backup, exportaciones, el proyecto viejo si sigue activo). |
| R-02 | **El ZIP de Storage está vacío** | **P0 para "recuperar archivos"** | 0 entradas verificadas. Los archivos físicos (fotos de cédulas, PDFs de denuncias, evidencias) no existen en el respaldo. |
| R-03 | **El modelo del backup ≠ modelo actual MELANTIA** | **P1** | No existen `ep_participantes`, `ep_proyecto_concesiones`, `evidencias_documentos`, `usuarios`, `negocios_rurales`, `lotes`, `levantamientos`… El backup corresponde a una iteración previa (marketplace plátano + colmenas + ganadería). Restaurarlo **no** reproduce el esquema documentado en `EP_MODELO_DATOS.md`. Decisión: ¿restaurar este esquema viejo o el nuevo ya existe por otra vía? |
| R-04 | **Replay completo del dump rompe el proyecto nuevo** | **P0 si se ejecuta tal cual** | `CREATE ROLE`/`CREATE SCHEMA`/`CREATE TABLE auth.*`/`CREATE PUBLICATION` colisionan con objetos existentes; `COPY auth.schema_migrations`/`storage.migrations`/`realtime.schema_migrations` corrompería los historiales de migración de los servicios del nuevo proyecto. Mitigación: extracción selectiva de `public` (plan 06). |
| R-05 | **Requiere PostgreSQL ≥ 17 en destino** | **P1** | Dump de PG 17.6 con `\restrict`/`\unrestrict`. Si el nuevo proyecto es PG 15, puede haber incompatibilidades. Verificar versión antes. |
| R-06 | **RLS activado sin políticas** | **P2** | 7 tablas public con `ENABLE RLS` y 0 `CREATE POLICY` → tras restaurar, `anon`/`authenticated` verán tablas vacías/denegadas. Requiere diseño de políticas nuevo (no restaurable). |
| R-07 | **`GRANT ALL` indiscriminado a `anon`** | **P2** | El dump otorga ALL sobre tablas public a `anon`/`authenticated`/`service_role`. Aplicarlo tal cual expondría tablas vía PostgREST a cualquier cliente con la anon key (mitigado parcialmente por RLS-que-deniega, pero es una superficie innecesaria). Recomendación: no replicar esos GRANTs ciegamente. |
| R-08 | **Sin FK de `perfiles_usuario` a `auth.users`** | **P2 (diseño)** | El modelo antiguo desacopla perfiles de Auth. Si el modelo nuevo espera `id = auth.users.id`, la semántica difiere. Ver `12_ADR_IDENTIDAD_USUARIOS.md`. |
| R-09 | **`realtime.messages` sin particiones** | **P3** | La tabla padre particionada llega sin hijos; Supabase realtime las crea dinámicamente. Solo relevante si se restaurara el schema realtime (no recomendado de todos modos). |
| R-10 | **Triggers dependen del seed `precios_sustentabilidad_ecuador`** | **P3** | Si se restaura la función/trigger sin las 3 filas seed, la alerta de precio queda inerte silenciosamente (`v_precio_minimo = NULL`). |
| R-11 | **Identidad de columnas con tildes/mayúsculas** | **P3** | `"fecha_instalación"`, `"fecha_inspección"`, `"población_fuerza"`, `"num_hectáreas"`, `"coordenadas_UTM"` — cualquier herramienta/ORM/REST que no quote exactamente fallará. Además `trazabilida_inventario_animales` tiene typo en el propio nombre. |
| R-12 | **Secuencias identity en 1** | **P3** | Consistente con tablas vacías; si se insertaran datos históricos con IDs explícitos, habría que hacer `setval` después. |
| R-13 | **Referencia al project-ref antiguo** | **P2** | `upfwgaacznljbzmbgcul` aparece en el nombre del zip y es el ref del proyecto origen. URLs antiguas en código/`.env` (`*.supabase.co` viejo) deben actualizarse o todo seguirá apuntando a un proyecto potencialmente inactivo. |
| R-14 | **Discrepancia de nombre de archivo** | **P3** | El encargo menciona `17-17-39.backup` pero el archivo real es `17-17-59.backup.gz`. Posible segundo archivo no localizado o simple error de transcripción. Verificar si existe otro backup. |
| R-15 | **Credenciales antiguas** | **P3** | El dump no contiene passwords ni secrets (vault vacío). Las keys del proyecto viejo (si existen en `.env`) deben rotarse/no reutilizarse en el nuevo. |
| R-16 | **Datos incompletos vs. expectativa** | **P1** | Si se restaura solo `public`, se "pierde": nada — porque no había datos. Lo que se pierde de verdad es la ilusión de cobertura: **estos backups no bastan para reconstruir un entorno productivo que nunca existió con datos**. |
| R-17 | **Objetos Supabase internos en el dump** | **P1 si se restauran** | Ya cubierto en R-04: auth/storage/realtime/vault/pgbouncer/graphql/extensions, roles, event triggers, publication. Restaurarlos sobre el proyecto nuevo = conflicto garantizado y posible corrupción de estado de servicios. |
| R-18 | **Extensiones con versión flotante** | **P3** | `CREATE EXTENSION` sin `VERSION` → el nuevo proyecto instala su versión por defecto; funciones de `pg_graphql`/`supabase_vault` pueden diferir de las del dump de funciones plataforma (que tampoco deben restaurarse). |

## 7.2 Bloqueadores efectivos

- **Único P0 real para una restauración técnica:** ejecutar el dump completo sin filtrar (R-04).
- **P0 para el objetivo de negocio "recuperar el MELANTIA antiguo":** el backup está vacío de datos (R-01, R-02) — no hay usuarios, perfiles, órdenes, evidencias ni archivos que recuperar.

## 7.3 Verificación recomendada antes de proceder

1. Confirmar que el proyecto antiguo ya no está accesible (si lo estuviera, un dump con `--data-only` o export de Storage sacaría lo que falte — si es que existe algo más).
2. Confirmar versión de PostgreSQL del proyecto nuevo.
3. Decidir si el esquema antiguo (`public` de este dump) debe convivir con el esquema `EP_*` actual o se descarta como histórico — esto es una **decisión de patrimonio**, no técnica.
