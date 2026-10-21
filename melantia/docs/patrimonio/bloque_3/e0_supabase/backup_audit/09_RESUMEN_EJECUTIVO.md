# 09 — RESUMEN EJECUTIVO

**Auditoría forense de respaldos — proyecto Supabase antiguo `upfwgaacznljbzmbgcul`**
Fecha: 2026-10-03 · Modo: solo lectura. Ningún archivo, base de datos ni servicio fue modificado.

---

## 1. Qué contiene exactamente cada backup

### `upfwgaacznljbzmbgcul.storage.zip` (22 B)
Un **ZIP válido completamente vacío** (0 entradas). Es la exportación de Storage de un proyecto **sin buckets ni objetos**. No contiene archivos, metadata ni configuración.

### `db_cluster-29-09-2026@17-17-59.backup.gz` (43 KB → 295 KB SQL)
Un **dump lógico completo de clúster** (`pg_dumpall`, formato SQL plano comprimido gzip), generado el 29-09-2026 desde PostgreSQL **17.6** con pg_dump **17.11**. Contiene:

- **15 roles** estándar Supabase (sin contraseñas) + configs + membresías.
- **8 esquemas** de plataforma: `auth`, `storage`, `realtime`, `vault`, `graphql`, `graphql_public`, `pgbouncer`, `extensions` — todos con DDL completo de servicios internos.
- **Esquema `public` de aplicación:** 17 tablas, 4 enums, 1 función (`procesar_logica_comercial` — alerta de precio mínimo + comisión escrow 2 %), 2 triggers, 1 vista, 7 secuencias.
- **5 extensiones:** pg_graphql, pg_stat_statements, pgcrypto, supabase_vault, uuid-ossp.
- **Datos: prácticamente ninguno.** Solo historiales de migración internos (82+83+68 filas) y **3 filas seed** en `precios_sustentabilidad_ecuador`.
- **`auth.users`: 0 usuarios. Todas las tablas de negocio: 0 filas. `storage.buckets`/`objects`: 0 filas. `vault.secrets`: 0.**

## 2. ¿Son suficientes para reconstruir el antiguo entorno MELANTIA?

**Sí para la estructura, NO para los datos.** Se puede reconstruir el esqueleto (schema `public` + plataforma ya viene incluida en cualquier Supabase nuevo), pero **no hay nada que recuperar en términos de usuarios, operaciones de negocio ni archivos**: el proyecto antiguo estaba provisionado pero vacío al momento del backup (las 3 filas seed y los `setval(1,false)` indican uso nulo desde el provisionamiento ~2026-09-01).

Además, el esquema contenido es una **versión anterior del modelo** (marketplace de plátano, colmenas, ganadería) — **no contiene** el modelo `EP_*` actual (`ep_participantes`, `ep_proyecto_concesiones`, `evidencias_documentos`, etc. **no existen** en este backup).

## 3. Qué información falta

- Todos los datos de usuarios/negocio/archivos (nunca existieron, o no están en estos respaldos).
- Políticas RLS (nunca fueron definidas en el origen).
- Buckets y objetos de Storage (no existían).
- Configuración de Auth del proyecto (providers, SMTP, URLs) — no viaja en pg_dumpall.
- Edge Functions, secrets de entorno, config del dashboard — no viajan en estos respaldos.

## 4. Qué puede restaurarse directamente

- **Esquema `public` completo** (DDL): 17 tablas, 4 enums, función, triggers, vista, secuencias — mediante extracción selectiva, sobre un Supabase nuevo con PG ≥ 17.
- Las 3 filas seed de `precios_sustentabilidad_ecuador`.

## 5. Qué requiere procedimiento especial

- **Filtrado del dump**: el archivo es un cluster dump; hay que extraer solo las sentencias `public.*` antes de ejecutar `psql` (ver `06_PLAN_RESTAURACION.md`).
- **Políticas RLS**: deben diseñarse nuevas (el origen no tenía ninguna).
- **Buckets**: creación nueva según necesidad de la app — no hay nada que restaurar.

## 6. Qué NO debe restaurarse

- Sección de **roles** completa (15 roles ya existen en Supabase nuevo).
- Todo `auth.*`, `storage.*`, `realtime.*`, `vault.*`, `pgbouncer.*`, `graphql.*`, `extensions.*` — incluidas las tablas `*_migrations` (inyectarlas corrompería los servicios nuevos).
- Event triggers `issue_*`/`pgrst_*`, publication `supabase_realtime`, `ALTER ROLE … SET`, DEFAULT PRIVILEGES de esquemas internos.
- El `GRANT ALL … TO anon` sobre tablas public sin revisión previa.

## 7. Riesgos principales

| # | Riesgo | Nivel |
|---|---|---|
| 1 | Backup sin datos de usuario/negocio/archivos — objetivo de "recuperación de datos" imposible con estos archivos | **P0** |
| 2 | Ejecutar el dump completo sobre el proyecto nuevo → colisiones masivas y corrupción de `*_migrations` internos | **P0** |
| 3 | Modelo del backup ≠ modelo `EP_*` actual de MELANTIA | **P1** |
| 4 | Destino debe ser PostgreSQL ≥ 17 (dump de 17.6, psql ≥ 17.6 por `\restrict`) | **P1** |
| 5 | RLS activado sin políticas → acceso denegado hasta crear policies nuevas | P2 |
| 6 | `perfiles_usuario` desacoplado de `auth.users` (diferencia de diseño) | P2 |

## 8. Orden recomendado de restauración

```text
1. Verificar PG ≥ 17 en el proyecto nuevo
2. Extraer del dump solo DDL/DCL de schema public (+ COPY del seed)
3. Aplicar con psql + ON_ERROR_STOP contra la DB nueva
4. Crear políticas RLS nuevas (diseño deliberado)
5. Crear buckets nuevos solo si la app los requiere
6. Verificación de objetos y smoke tests
7. Actualizar .env al nuevo project-ref
8. Pruebas de aplicación MELANTIA
```

## 9. Comandos que se usarían (referencia — NO ejecutados)

```bash
# Integridad
sha256sum db_cluster-*.backup.gz upfwgaacznljbzmbgcul.storage.zip

# Preparación
gzip -dc db_cluster-29-09-2026@17-17-59.backup.gz > work_dump.sql
# extraer manualmente el bloque public → restore_public.sql

# Verificar versión destino
psql "$NEW_DB_URL" -c "select version();"

# Restauración selectiva
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f restore_public.sql

# Verificación
psql "$NEW_DB_URL" -c "\dt public.*" -c "select count(*) from public.precios_sustentabilidad_ecuador;"
```

## 10. Criterios de aceptación de una restauración exitosa

1. `public` contiene exactamente 17 tablas, 4 enums, 1 función, 2 triggers, 1 vista, 7 secuencias.
2. `select count(*) from precios_sustentabilidad_ecuador` = **3**.
3. Trigger de comisión verificado: INSERT en `ordenes_compra` produce `monto_comision_app` = 2 % del bruto.
4. Ningún objeto de `auth`/`storage`/`realtime` del proyecto nuevo fue alterado (comparar `\dn`, `pg_extension`, conteos de `*_migrations` antes/después).
5. Políticas RLS nuevas documentadas y funcionando (`pg_policies` no vacío para las 7 tablas con RLS).
6. Backend MELANTIA conecta con el nuevo `.env` y pasa smoke tests.

---

## Confirmación de cumplimiento de reglas

- backups originales modificados: **0**
- backups originales eliminados: **0**
- backups originales movidos: **0**
- nuevo Supabase modificado: **0** (sin conexión alguna)
- PostgreSQL local modificado: **0**
- `.env` modificado: **0**
- código MELANTIA modificado: **0**
- Git add: **NO** · Git commit: **NO** · Git push: **NO**

Documentos creados (únicos artefactos nuevos): esta carpeta `backup_audit/` con los archivos `01`–`09`. Copia de trabajo del dump en `%TEMP%`, fuera del árbol del proyecto.
