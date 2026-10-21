# 01 — AUDITORÍA DE REFERENCIAS A SUPABASE

Auditoría de solo lectura. Ninguna clave se muestra completa (`[REDACTED]`).

## 1.1 Cobertura

| Árbol | Archivos con referencias Supabase | Estado |
|---|---|---|
| `melantia/` (repo actual) | `backend/core/config.py`, `backend/core/security.py`, `melantia/.env`, `melantia/supabase/` (10 migraciones + `init_db.js`), `melantia/core_python/payphone_payment.py` | Mezcla vigente/local |
| `melant_ia/` (HEAD, eliminado en working tree) | 18 archivos | Histórico |
| `melantia_old_version/src` | ~45 archivos | Histórico (gitignored) |
| `melantia_old_version/respaldo_melantia/melant_ia` | ~45 archivos + `.env` + `supabase/` (migraciones) | Histórico (gitignored) |

## 1.2 Configuración histórica existente

**Proyecto único identificado**: `https://upfwgaacznljbzmbgcul.supabase.co`

Tres formatos de config encontrados:

1. `window.MELANTIA_SUPABASE_CONFIG` (`supabase_config.js` raíz y `database/supabase_config.js` en respaldo):
   ```js
   url, anonKey: 'sb_publishable_[REDACTED]',
   bucket: 'melantia-trazabilidad',
   table: 'evidencia_fotos_nube',
   schema: 'public',
   pathPrefix: 'trazabilidad'
   ```
2. `modules/supabase_config.js`: cliente `createClient(url, anonKey)` real (CDN fallback supabase-js v2).
3. `modules/08_comunidad_virtual/supabase_config.js` y `comunidad_virtual/`: **solo placeholders** (`TU_SUPABASE_URL`).
4. `database/supabase_config.js` en old_version: archivo `.js` que contiene **Python SQLAlchemy** (anomalía CONF-09 del Bloque 3) con `SUPABASE_API_URL = ".../rest/v1/"`.

## 1.3 Consumidores de la configuración (histórico)

| Consumidor | Mecanismo | Datos tocados |
|---|---|---|
| `gestor_evidencia_fotos.js` (~2.9K líneas) | `PUT /storage/v1/object/...` + `POST /rest/v1/evidencia_fotos_nube` con `apikey`+`Bearer` | Fotos de evidencia (webp), metadata (animal/lote/GPS/peso) |
| `gestor_rural_melantia.js` | `fetch` directo a `/rest/v1/...` | Tabla centro de mando |
| `servicios_financieros.js` | `supabase.storage.from(bucket).upload` + `.from('solicitudes_credito').insert` | Docs KYC + solicitudes de crédito |
| `modulo11_logica.js` | `supabase.storage.from('evidencias').upload` + `.from('evidencias').insert` | Evidencias M11 |
| `persistencia_fincas.js` / `gestion_fincas.js` | `.from('fincas').select/insert` | Fincas |
| `monte_tienda_virtual.js` | `.from('tiendas').select/insert` | Tiendas |
| `calculadora_agricola.js` | `window.supabase?.from(...)` condicional | Cálculos |
| `vision_satelital.js` | anonKey | Referencias satelitales |
| `tienda_virtual_supabase.py` | `supabase.create_client` Python (placeholder creds) | productos/ventas |

**Patrón dominante**: el frontend histórico hablaba **directamente** con Supabase (PostgREST `/rest/v1` + Storage REST), sin pasar por una API propia — lo contrario del objetivo API-first actual.

## 1.4 SQL histórico relacionado

| Archivo | Contenido |
|---|---|
| `modules/schemas/supabase/melantia_supabase_schema.sql` | Schema completo 12 módulos para Supabase (uuid-ossp + **postgis**) |
| `modules/traceability/photos/supabase_trazabilidad_fotos.sql` | Bucket `melantia-trazabilidad` (public, 5MB, webp/jpeg/png) + tabla `evidencia_fotos_nube` + índices + trigger updated_at + **políticas RLS** (permisivas: anon+authenticated `using(true)`/insert/update/delete en bucket) |
| `respaldo/.../supabase/migrations/` (5 archivos) | `mapeo_modulos`, `agro_melant_ia`, `esquema_agro_interoperable`, `esquema_fitosanitario`, `tablas_control_palmas` |
| `melantia/supabase/migrations/` (repo actual, **untracked**) | `0001_fase1_core.sql` (RBAC moderno — ver §1.6) + copias de los anteriores + `sql_panel_multiusuario*.sql` (SQLite histórico) + `init_db.js` (SQLite legacy) |

## 1.5 Supabase en el runtime actual

| Elemento | Estado |
|---|---|
| `backend/core/config.py` | 3 settings: `supabase_url`, `supabase_service_role_key`, `supabase_anon_key` (alias `VITE_SUPABASE_ANON_KEY`) — todos `Optional`, default `None` |
| `backend/core/security.py` | Clase `SupabaseAuth`: lee settings, `is_configured` flag, `get_auth_headers()`, `get_user_by_token()` → **placeholder TODO que siempre retorna `None`** |
| `melantia/supabase/` | Directorio **no trackeado** (`??`) con migraciones — artefacto local no integrado al backend |
| `melantia/frontend/` | **Cero referencias** a Supabase encontradas |
| Runtime efectivo | Ningún endpoint usa `supabase_auth`; la autenticación real es JWT propio |

**Conclusión §1.5**: no existe código de producción activo que dependa funcionalmente de Supabase. La dependencia es solo de configuración (settings opcionales) y un artefacto de migración no trackeado.

## 1.6 `melantia/supabase/migrations/0001_fase1_core.sql` (untracked)

Diseño Supabase-first ya esbozado localmente:

- `public.roles`, `public.permisos`, `public.roles_permisos` — RBAC
- `public.usuarios_perfiles` — **`id REFERENCES auth.users(id) ON DELETE CASCADE`** (perfil de negocio anclado a Supabase Auth)
- `public.configuraciones_globales`
- `set_updated_at()` trigger genérico
- RLS **habilitado** en las 5 tablas con políticas `*_lectura_autenticados` (lectura para `authenticated`; escritura/admin solo vía `service_role` desde backend — anotado en comentario)

Esto evidencia una dirección de diseño previa hacia **Opción C** (Supabase Auth como identidad). Es trabajo previo valioso, no autorizado ni integrado aún.

## 1.7 Matriz: ¿se usa la clave hoy?

| Archivo | Tipo | Contiene clave | Runtime actual | Referenciado | Riesgo |
|---|---|---|---|---|---|
| `melantia/.env` | env | publishable + **secret** + PayPhone | Sí (leído por config.py si backend corre local) | gitignored ✓ | ALTO (secret en disco local) |
| `melant_ia/src/supabase_config.js` | config JS | publishable | No (tree eliminado) | **COMMITTED en HEAD** | MEDIO (publishable en git) |
| `melant_ia/src/modules/supabase_config.js` | config JS | publishable | No | Committed en HEAD | MEDIO |
| `melantia_old_version/**/supabase_config.js` | config JS | publishable | No | gitignored (fuera de git) | BAJO |
| `respaldo/melant_ia/.env` | env | publishable + **secret** + PayPhone | No | gitignored (fuera de git) | ALTO (secret en disco) |
| `backend/core/config.py` | settings | no (solo nombres) | Sí | Tracked | — |
| `backend/core/security.py` | código | no | Sí (placeholder inerte) | Tracked | — |

## 1.8 Respuestas directas

- **¿Dónde aparece Supabase?** Config backend actual (inerte), `.env` local, `melantia/supabase/` untracked, ~50 archivos históricos (cliente-directo).
- **¿Hay código de producción que dependa de Supabase?** No. `SupabaseAuth.get_user_by_token` es un stub que retorna `None`; ningún endpoint lo invoca.
- **¿Qué configuración histórica existe?** Un proyecto (`upfwgaacznljbzmbgcul`), bucket `melantia-trazabilidad`, tabla `evidencia_fotos_nube`, cliente directo desde frontend.
