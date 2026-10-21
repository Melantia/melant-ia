# 02 — AUDITORÍA DEL BACKUP DE BASE DE DATOS

**Archivo:** `E:\Desktop\MELANTIA\db_cluster-29-09-2026@17-17-59.backup.gz`
**Formato real:** `pg_dumpall` SQL plano gzip-comprimido (dump de clúster completo)
**Origen:** PostgreSQL **17.6** · generado con **pg_dump 17.11** (Debian 17.11-1.pgdg12+2)
**Estructura interna:** sección global (roles) → `\connect template1` (vacío) → `\connect postgres` (todo el contenido) → fin.
**No contiene** sentencias `CREATE DATABASE`: asume que las bases `template1` y `postgres` ya existen en el destino.
Usa los metacomandos psql `\restrict`/`\unrestrict` (pg_dump ≥ 17.6; psql antiguos los ignoran con advertencia).

---

## 2.1 Inventario global de objetos (cabeceras `-- Name:`)

| Tipo de objeto | Cantidad |
|---|---|
| ACL (GRANT/REVOKE individuales) | 154 |
| INDEX | 86 |
| CONSTRAINT (PK/UNIQUE/CHECK) | 71 |
| TABLE | 55 |
| COMMENT | 46 |
| FUNCTION | 44 |
| FK CONSTRAINT | 42 |
| ROW SECURITY (ENABLE RLS) | 32 |
| DEFAULT ACL (privilegios por defecto) | 24 |
| TYPE / ENUM | 19 |
| SEQUENCE + SEQUENCE SET | 9 + 9 |
| SCHEMA | 8 |
| TRIGGER | 7 |
| EVENT TRIGGER | 6 |
| EXTENSION | 5 |
| VIEW | 1 |
| PUBLICATION | 1 |
| TABLE DATA (bloques COPY) | 55 |

**Esquemas presentes:** `auth`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `realtime`, `storage`, `vault` (+ `public`, implícito — no lleva `CREATE SCHEMA`).
**Ausentes:** `supabase_migrations`, `supabase_functions`, `cron`, `net`, `pgtle`, `_realtime`. Las referencias a `cron`/`pg_net` existen solo *dentro* del cuerpo de funciones `extensions.grant_*_access()` (event triggers que actúan si la extensión se instala).

**Extensiones** (sin versión fijada → se instala la versión por defecto del destino):
`pg_graphql` (schema graphql), `pg_stat_statements`, `pgcrypto`, `supabase_vault`, `uuid-ossp` (schema extensions).

**Roles** (15, todos roles estándar de plataforma Supabase, **sin contraseñas** en el dump):
`anon`, `authenticated`, `authenticator`, `dashboard_user`, `pgbouncer`, `postgres`, `service_role`, `supabase_admin`, `supabase_auth_admin`, `supabase_etl_admin`, `supabase_privileged_role`, `supabase_read_only_user`, `supabase_realtime_admin`, `supabase_replication_admin`, `supabase_storage_admin`.
Incluye `ALTER ROLE … SET` (search_path, timeouts) y membresías (`GRANT anon TO authenticator`, etc.).

**Event triggers (6):** `issue_graphql_placeholder`, `issue_pg_cron_access`, `issue_pg_graphql_access`, `issue_pg_net_access`, `pgrst_ddl_watch`, `pgrst_drop_watch` — todos de plataforma Supabase.

**Publication:** `supabase_realtime` (`insert, update, delete, truncate`) — **sin tablas añadidas** (no hay `ALTER PUBLICATION … ADD TABLE`).

---

## 2.2 Contenido por esquema

### `auth` (GoTrue — interno Supabase)
- **27 tablas** (estructura completa GoTrue): `users`, `identities`, `sessions`, `refresh_tokens`, `instances`, `audit_log_entries`, `flow_state`, `mfa_*` (5), `oauth_*` (5), `saml_*` (2), `sso_*` (2), `scim_*` (2), `one_time_tokens`, `webauthn_*` (2), `custom_oauth_providers`, `schema_migrations`.
- **9 enums** (`aal_level`, `factor_type`, `one_time_token_type`, …), funciones `uid()`, `jwt()`, `email()`, `role()`, 1 secuencia, 16 tablas con RLS ENABLE.
- **Datos:** `auth.schema_migrations` = **82 filas** de versiones (primera `20171026211738`, última `20260831180000` → GoTrue con migraciones hasta agosto-2026).
- **`auth.users`: 0 filas. `auth.identities`: 0. `auth.sessions`: 0. Todas las demás tablas auth: 0 filas.** → **No existía ningún usuario registrado** en el proyecto antiguo al momento del backup.

### `storage` (Storage API — interno Supabase)
- **8 tablas:** `buckets`, `objects`, `migrations`, `s3_multipart_uploads`, `s3_multipart_uploads_parts`, `buckets_analytics`, `buckets_vectors`, `vector_indexes`.
- 17 funciones internas (`can_insert_object`, `search_v2`, `extension`, `filename`, `foldername`, …), 4 triggers (`protect_*`, `update_objects_updated_at`, `enforce_bucket_name_length`), 1 enum `buckettype`, 8 tablas con RLS ENABLE.
- **Datos:** `storage.migrations` = **68 filas** (hasta migración 67 `objects-null-version-index`, ejecutada 2026-09-09 → Storage API reciente).
- **`storage.buckets`: 0 filas. `storage.objects`: 0 filas.** → **No había buckets ni objetos registrados. El Storage estaba completamente vacío**, lo cual es consistente con el `.storage.zip` vacío.

### `realtime` (interno Supabase)
- 3 tablas: `messages` (**particionada por RANGE sobre `inserted_at`; no se volcó ninguna partición hija**), `schema_migrations` (83 filas, última `20260827120000`), `subscription` (0 filas).
- 15 funciones internas (`broadcast_changes`, `apply_rls`, `send`, `send_binary`, …), 5 types, trigger `tr_check_filters`.

### `pgbouncer`
- Solo la función `get_auth(text)` (plataforma).

### `vault`
- Sin DDL propio (tabla `secrets` y vista `decrypted_secrets` las crea la extensión `supabase_vault`); el dump sí incluye `COPY vault.secrets` → **0 filas (ningún secreto almacenado)**.

### `graphql`, `graphql_public`, `extensions`
- Solo schemas + DEFAULT ACLs + funciones de event-trigger de plataforma. Sin tablas propias.

---

## 2.3 Esquema `public` — objetos de aplicación (MELANTIA-antiguo)

**17 tablas** (todas owner `postgres`):

| Tabla | PK | RLS | Filas | Notas |
|---|---|---|---|---|
| `alertas_emergencia_coip` | `id` uuid | No | 0 | FK→`perfiles_usuario` (SET NULL) |
| `colmenas` | `id` bigint identity | **Sí** | 0 | columnas con tilde: `"fecha_instalación"` |
| `fincas` | `id` bigint identity | **Sí** | 0 | `usuario_id uuid` **sin FK** (default `gen_random_uuid()`) |
| `gps_magnetico_vehicular` | `id` uuid | No | 0 | UNIQUE `imei_dispositivo`; FK→`perfiles_usuario` |
| `historial_gps_ruta` | `id` uuid | No | 0 | FK→`ordenes_compra` |
| `historial_sanitario_movimientos` | `id` bigint identity | **Sí** | 0 | FK→`trazabilida_inventario_animales` |
| `inspecciones_colmenas` | `id` bigint identity | **Sí** | 0 | FK→`colmenas`; columnas con tilde |
| `labores_cultivo` | `(id, created_at)` | **Sí** | 0 | `lote` es **texto**, no tabla |
| `mensajeria_rural_archivos` | `id` uuid | No | 0 | FK→`ordenes_compra`, FK→`perfiles_usuario` |
| `ofertas_platano` | `id` uuid | No | 0 | FK→`perfiles_usuario`; enum `variedad_platano` |
| `ordenes_compra` | `id` uuid | No | 0 | FK→`ofertas_platano` (RESTRICT), 2×FK→`perfiles_usuario` |
| `perfiles_usuario` | `id` uuid | No | 0 | UNIQUE `telefono_whatsapp`; CHECK `acepto_politicas_privacidad=true`; **SIN FK a `auth.users`** |
| `precios_sustentabilidad_ecuador` | `id` uuid | No | **3** | única tabla con datos (seed) |
| `suscripciones_productores` | `id` uuid | No | 0 | FK→`perfiles_usuario`; enum `estado_suscripcion` |
| `trazabilida_inventario_animales` | `id` bigint identity | **Sí** | 0 | (sic: "trazabilida") FK→`fincas` |
| `trazabilidad_exportacion` | `id` bigint identity | **Sí** | 0 | columnas `"num_hectáreas"`, `"coordenadas_UTM"` |
| `verificaciones_identidad` | `id` uuid | No | 0 | UNIQUE `cedula_ruc`; FK→`perfiles_usuario` |

**4 enums:** `tipo_usuario` (PRODUCTOR/COMPRADOR/TRANSPORTISTA/INTERMEDIARIO/ADMINISTRADOR), `variedad_platano` (BARRAGANETE/VERDE/MADURO/ORITO/CAVENDISH), `estado_transaccion` (RETENIDO_GARANTIA/LIBERADO_AGRICULTOR/DISPUTA/REEMBOLSADO), `estado_suscripcion` (ACTIVO/INACTIVO/PENDIENTE_PAGO).

**1 función:** `public.procesar_logica_comercial()` (plpgsql, trigger) — lógica de negocio real: alerta de precio bajo el mínimo de sostenibilidad en `ofertas_platano`, y cálculo de **comisión escrow del 2 %** en `ordenes_compra` (`monto_bruto_total`, `monto_comision_app`, `monto_neto_agricultor`).

**2 triggers:** `trg_alerta_precio_oferta` (BEFORE INSERT `ofertas_platano`), `trg_calculo_comisiones_orden` (BEFORE INSERT `ordenes_compra`).

**1 vista:** `v_archivos_gama_baja_a_limpiar` — archivos de `mensajeria_rural_archivos` con `fecha_envio < now() - 30 days`.

**7 secuencias** identity (todas `setval(1,false)` → nunca usadas). **0 índices secundarios** en public (solo PK/UNIQUE implícitos).

### Datos reales en todo el dump

| Tabla | Filas |
|---|---|
| `realtime.schema_migrations` | 83 |
| `auth.schema_migrations` | 82 |
| `storage.migrations` | 68 |
| `public.precios_sustentabilidad_ecuador` | 3 (BARRAGANETE 7.50 / VERDE 7.31 / MADURO 6.50, fecha 2026-09-01) |
| **Todas las demás (51 tablas)** | **0** |

---

## 2.4 Búsqueda de tablas solicitadas en el encargo

| Tabla solicitada | ¿Presente? |
|---|---|
| `usuarios` / `usuarios_perfiles` | **NO** (el equivalente es `perfiles_usuario`) |
| `ep_participantes` | **NO** |
| `ep_proyecto_concesiones` | **NO** |
| `evidencias_documentos` | **NO** |
| `suscripciones` | NO (existe `suscripciones_productores`) |
| `negocios_rurales` | **NO** |
| `transacciones` | NO (existe `ordenes_compra` con enum `estado_transaccion`) |
| `fincas` | **SÍ** (0 filas) |
| `lotes` | NO (columna `lote` texto en `labores_cultivo`, `lote_origen` en inventario) |
| `levantamientos` | **NO** |
| `trazabilidad` | Parcial (`trazabilida_inventario_animales`, `trazabilidad_exportacion`) |
| `registros de campo` | NO |

**Conclusión:** el esquema `public` del backup corresponde a una **iteración anterior del modelo de datos** (marketplace de plátano + apicultura + ganadería), no al modelo `EP_*` documentado actualmente en `docs/EP_MODELO_DATOS.md`. Ninguna tabla `ep_*` existe en este backup.

## 2.5 Dependencias y observaciones relevantes

1. **`auth.users`/`storage.*`/`storage.objects`: el dump los contiene estructuralmente** pero con 0 filas. `storage.objects` tiene FK `bucket_id → storage.buckets`.
2. **Ninguna tabla `public` referencia `auth.users` ni `storage.objects`** → el esquema de negocio es autocontenido; `perfiles_usuario` está desacoplado de Auth.
3. **RLS activado en 7 tablas public pero 0 `CREATE POLICY` en todo el dump** → tras restaurar, esas tablas negarían todo acceso a `anon`/`authenticated` hasta crear políticas.
4. Columnas con tildes/mayúsculas (`"fecha_instalación"`, `"coordenadas_UTM"`) exigen dobles comillas en cualquier SQL futuro.
5. `realtime.messages` llega como tabla padre particionada **sin particiones** → inserts de realtime fallarían hasta que el servicio cree particiones (comportamiento normal de Supabase, que crea particiones dinámicamente).
6. Objetos internos Supabase que **no deben** restaurarse indiscriminadamente: todo `auth.*`, `storage.*`, `realtime.*`, `vault.*`, `extensions.*`, `pgbouncer.*`, `graphql*`, roles, event triggers, `supabase_realtime` publication — el proyecto nuevo ya los provee y el replay completo chocaría con `CREATE SCHEMA`/`CREATE ROLE`/`CREATE EXTENSION` ya existentes.
7. El dump **no contiene secretos**: sin cláusulas `PASSWORD`, `vault.secrets` vacío, sin `ALTER DATABASE … SET` de configuración sensible.
