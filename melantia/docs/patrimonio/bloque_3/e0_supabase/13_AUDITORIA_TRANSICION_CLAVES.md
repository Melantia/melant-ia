# 13 — AUDITORÍA DE TRANSICIÓN DE CLAVES SUPABASE (E0.5)

**De `anon`/`service_role` → `publishable`/`secret`**
Fecha: 2026-10-03 · Modo: SOLO LECTURA. Ningún archivo, credencial, clave, `.env`, Supabase, PostgreSQL ni Git fue modificado (excepción autorizada por el usuario: `icacls /reset` sobre `melantia/backend/` para hacerla legible — restaura permisos heredados, no toca contenido).

---

## 1. Resumen ejecutivo

**El cambio `anon → publishable` y `service_role → secret` es hoy prácticamente trivial para MELANTIA**, porque las cuatro variables Supabase presentes en `.env` alimentan exclusivamente código **placeholder/muerto**:

- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` → `settings.supabase_url` / `settings.supabase_service_role_key` → consumidas **solo** por `SupabaseAuth` en `backend/core/security.py`, clase que **nunca es importada ni usada** (verificado: 0 imports fuera de su propio archivo). Su método de negocio (`get_user_by_token`) es un `TODO` que retorna `None`.
- `VITE_SUPABASE_ANON_KEY` → leída por el backend vía alias pydantic → solo alimenta `SupabaseAuth` (muerto).
- `VITE_SUPABASE_URL` → **nadie la lee** (el frontend no la consume; el backend mapea `supabase_url` ← `SUPABASE_URL`).
- El **frontend no usa Supabase en absoluto**: `frontend/src` tiene 0 referencias a `supabase`, 0 dependencias `supabase-js`/`gotrue`/`postgrest` en `package.json`, y `frontend/.env` contiene únicamente `VITE_API_URL`. El único camino de datos activo es `React → apiClient (axios, VITE_API_URL) → FastAPI → psycopg → PostgreSQL`.
- La **autenticación activa es local**: JWT HS256 firmado con `MELANTIA_JWT_SECRET_KEY` (+ fallback inseguro en código), emitido por `backend/modules/auth/controllers.py` contra la tabla `usuarios` (cédula + bcrypt). `get_current_user` valida ese JWT local — no hay soporte Supabase JWT implementado.

Por tanto: **hoy no hay nada de runtime que romper** al renombrar/introducir las nuevas claves. El trabajo real llegará cuando se implemente la arquitectura objetivo del ADR E0.3 (D2 opción C: Supabase Auth → JWT → FastAPI), momento en que sí harán falta `sb_publishable_*`/`sb_secret_*` funcionales.

---

## 2. Variables actuales encontradas

Presentes en `melantia/.env` (raíz — **ignorado por git**, ver §12). Solo se listan nombres, nunca valores:

| Variable | Lector real | Estado de uso |
|---|---|---|
| `VITE_APP_NAME` | (no auditado en código; var de plantilla) | probablemente NO_USADO |
| `VITE_APP_VERSION` | idem | probablemente NO_USADO |
| `VITE_ENVIRONMENT` | idem | probablemente NO_USADO |
| `VITE_SUPABASE_URL` | **ninguno** | NO_USADO (muerta) |
| `VITE_SUPABASE_ANON_KEY` | `backend/core/config.py:67` (alias pydantic) | CONFIGURACIÓN → alimenta solo código muerto (`SupabaseAuth`) |
| `SUPABASE_URL` | `backend/core/config.py:65` | CONFIGURACIÓN → solo `SupabaseAuth` (muerto) |
| `SUPABASE_SERVICE_ROLE_KEY` | `backend/core/config.py:66` | CONFIGURACIÓN → solo `SupabaseAuth` (muerto) |
| `PATH_VOSK_MODEL` | (no auditado; modelo de voz local) | fuera de alcance Supabase |
| `VITE_PAYPHONE_PUBLIC_KEY` | `backend/core/config.py:82` (alias) | CONFIGURACIÓN (pagos, fuera de Supabase) |
| `PAYPHONE_SECRET_KEY` | `backend/core/config.py:83` (alias) | CONFIGURACIÓN (pagos, fuera de Supabase) |

`frontend/.env`: contiene **solo `VITE_API_URL`** → consumida por `frontend/src/shared/api/apiClient.js` y reexportada por `frontend/src/config/axiosConfig.js` (que lleva un comentario explícito: *"FastAPI, VITE_API_URL — no Supabase"*).

**Variables buscadas y NO encontradas en código ni `.env`:** `SUPABASE_ANON_KEY` (sin prefijo VITE, como nombre de variable), `SUPABASE_SERVICE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_KEY`, `SUPABASE_KEY`. No existe `.env.example`.

## 3. Variables futuras propuestas (del encargo — aún no creadas)

| Variable futura | Sustituye a | Rol previsto |
|---|---|---|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_ANON_KEY` | browser/frontend, protegida por RLS |
| `SUPABASE_SECRET_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | backend/server-side privilegiado |
| `SUPABASE_URL` | `SUPABASE_URL` | **CONSERVAR** (ya válida para ambos sistemas) |
| `VITE_SUPABASE_URL` | `VITE_SUPABASE_URL` | **CONSERVAR** (cuando el frontend realmente use Supabase) |

Nota arquitectónica: `sb_secret_*` **jamás** debe llegar al navegador ni a un archivo servido al cliente (regla D/CRÍTICO del encargo). Hoy no existe ese riesgo: el frontend no consume ninguna clave Supabase.

## 4. Matriz de usos

| Archivo | Línea(s) | Variable | Lenguaje | Componente | Finalidad | Clasificación |
|---|---|---|---|---|---|---|
| `backend/core/config.py` | 65 | `SUPABASE_URL` (→ `supabase_url`) | Python | BACKEND_FASTAPI | settings pydantic | ACTIVO (carga) pero consumidor muerto |
| `backend/core/config.py` | 66 | `SUPABASE_SERVICE_ROLE_KEY` (→ `supabase_service_role_key`) | Python | BACKEND_FASTAPI | settings pydantic | idem |
| `backend/core/config.py` | 67 | `VITE_SUPABASE_ANON_KEY` (alias → `supabase_anon_key`) | Python | BACKEND_FASTAPI | settings pydantic | idem |
| `backend/core/security.py` | 174–176, 233 | las tres anteriores | Python | BACKEND_FASTAPI | clase `SupabaseAuth` + instancia global | **NO_USADO** (dead code: 0 imports externos) |
| `backend/core/security.py` | 301–302 | export en `__all__` | Python | BACKEND_FASTAPI | exportación nominal | NO_USADO |
| `frontend/src/shared/api/apiClient.js` | 9 | `VITE_API_URL` | JS | FRONTEND_BROWSER | baseURL axios → FastAPI | ACTIVO (único camino real) |
| `frontend/src/config/axiosConfig.js` | 1–5 | reexport | JS | FRONTEND_BROWSER | compat | ACTIVO |
| `supabase/migrations/supabase_trazabilidad_fotos.sql` | 147–148 | `window.MELANTIA_SUPABASE_CONFIG` (plantilla comentada con `anonKey: 'TU_ANON_KEY'`) | SQL/JS-doc | DOCUMENTACIÓN | config esperada para pipeline legado de evidencias | HISTÓRICO/DOCUMENTACIÓN |
| `supabase/.temp/pooler-url` | 1 | conninfo `postgresql://postgres.<ref>@…` | texto | CONFIGURACIÓN | CLI Supabase local (link) | CONFIGURACIÓN (contiene ref del proyecto, sin password en el archivo) |
| `supabase/.temp/linked-project.json` | 1 | `ref` proyecto | JSON | CONFIGURACIÓN | CLI link → **proyecto nuevo `lizqreiyysrqgkzyddff` "Restauracion Melantia"** | CONFIGURACIÓN |
| Docs `e0_supabase/01,04,06,08` + `backup_audit/06` | varios | nombres de variables | MD | DOCUMENTACIÓN | auditorías previas | DOCUMENTACIÓN |
| Docs `e0_supabase/01,06,07,08,09,10,11,12` | varios | `sb_secret_`, `sb_publishable_` (como concepto) | MD | DOCUMENTACIÓN | decisiones D1a/D1c del ADR | DOCUMENTACIÓN |

**No auditable por permisos** (DACL vacías, no reparadas por decisión del usuario): `assets/`, `backups/`, `business/`, `core_python/`, `data/`, `.legacy_extract/`, `.cursor/`, `.pytest_cache/`, `.venv/`, `.vscode/`. El código histórico de Supabase (p. ej. `gestor_evidencia_fotos.js` documentado en `03_AUDITORIA_STORAGE_EVIDENCIAS.md`) vive presumiblemente en `.legacy_extract/` o `melantia_old_version/` — **uso histórico no verificable en esta pasada**. `node_modules/`, `venv/` excluidos por diseño.

## 5. Backend

- `SUPABASE_SERVICE_ROLE_KEY` se carga vía `pydantic-settings` (`env_file=".env"`, `load_dotenv()`) en `settings.supabase_service_role_key`. **No se usa en runtime**: el único consumidor (`SupabaseAuth.get_auth_headers`) jamás se invoca — la clase no tiene ni un solo importador.
- No hay uso de Supabase para: Auth (placeholder), Storage (0 refs), REST/Data API (0 refs), Realtime (0 refs), operaciones administrativas (0 refs).
- La conexión a datos es **`settings.database_url`** (computada de `MELANTIA_DB_HOST/NAME/USER/PASS/PORT`) con pools `psycopg` async+sync en `backend/database.py`. **Totalmente independiente de las API keys de Supabase** — apunta hoy a PostgreSQL local y apuntará a `db.<ref>.supabase.co` por conninfo, no por API key.
- `backend/integrations/payphone.py`: stub de pagos con URL hardcodeada; no lee settings ni claves Supabase.
- `backend/requirements*.txt`: **no existen** dependencias `supabase`, `supabase-py`, `gotrue`, `postgrest`, `storage3`, `realtime`. El cambio de claves no exige cambiar dependencias (hasta implementar un cliente real).
- `backend/tests/`: 0 referencias a Supabase/keys.

## 6. Frontend

- **0 usos de Supabase**: sin `createClient`, sin `@supabase/supabase-js` en `package.json` (13 deps, ninguna Supabase), sin `import.meta.env.VITE_SUPABASE_*`, sin llamadas a `*.supabase.co`, sin `storage/v1`.
- Único env consumido: `VITE_API_URL` (axios → FastAPI).
- `frontend/dist/`: sin referencias a supabase/`sb_*`/`service_role`.
- **Implicación**: cuando llegue el momento, `VITE_SUPABASE_PUBLISHABLE_KEY` será una variable **nueva** para el frontend — no una sustitución 1:1, porque hoy no hay cliente que sustituir.

## 7. Auth

- Implementación actual (activa): login cédula+RUC/contraseña → `usuarios.password_hash` (bcrypt, columna aditiva NULL en históricos) → `create_access_token` JWT **HS256** → `get_current_user` en `core/dependencies.py` valida con `verify_token`/`get_user_id_from_token` (`jose`).
- Firma: `SECRET_KEY = os.getenv("MELANTIA_JWT_SECRET_KEY", "melantia_secret_key_change_in_production_2026")` — **el fallback está hardcodeado en `security.py:30`** (debilidad propia, documentada aquí como hallazgo, no un secreto Supabase).
- `SupabaseAuth` (`security.py:165–233`): **placeholder inactivo** — `is_configured` depende de `supabase_url`+`service_role_key`; `get_user_by_token` es TODO que retorna `None`. **No hay soporte real de Supabase JWT implementado** (ni verificación de JWT GoTrue, ni llamada a `/auth/v1/user`).
- Relación identidad: tabla local `usuarios` (perfil de negocio) ↔ `usuarios_perfiles` **local** (junction usuario↔perfil profesional, `ecosistema_profesional.sql`) — **semántica distinta** del `usuarios_perfiles` de `supabase/migrations/0001_fase1_core.sql` (puente `id = auth.users.id`, RLS `auth.uid() = id`). Esta **colisión de nombres** está documentada en el ADR E0.3 (D4/D6) y debe vigilarse al converger los dos esquemas.
- El puente documentado en E0.3 (cadena `auth.users → usuarios_perfiles → usuarios`) existe **solo como diseño + migración SQL no ejecutada**; el backend no lo consume aún.

## 8. Storage

- **Código actual: 0 referencias** a `storage/v1`, `storage.objects`, buckets, `gestor_evidencia_fotos`, `evidencia_fotos_nube` en `backend/` ni `frontend/src/`.
- `backend/core/config.py:storage_dir` es una **ruta de filesystem local** (`backend/storage/`), usada por `main.py` para estáticos — nada que ver con Supabase Storage.
- `supabase/migrations/supabase_trazabilidad_fotos.sql` define (SQL, no ejecutada aquí) políticas sobre bucket `melantia-trazabilidad` y documenta la plantilla `window.MELANTIA_SUPABASE_CONFIG { url, anonKey, bucket, table }` del pipeline legado — código histórico en directorios no auditables.
- Variables implicadas por flujo (según diseño legado + ADR D5): subida browser → `publishable` + RLS/policies; signed URLs / administración → `secret` en backend. **Nada implementado hoy.**

## 9. REST/Data API

- **0 llamadas** a `https://<ref>.supabase.co/rest/v1/...` en código auditado. Toda la lectura/escritura de datos pasa por FastAPI + psycopg.
- La intención de `SupabaseAuth.get_auth_headers` (apikey+Bearer con service_role) sería el único consumidor REST — está sin implementar.

## 10. Realtime

- **0 referencias** a Realtime (`realtime-js`, websockets, `postgres_changes`, channels) en backend ni frontend auditados. La publicación `supabase_realtime` del dump antiguo no tiene tablas suscritas tampoco.

## 11. Seguridad

Inventario de presencia/ubicación de credenciales (sin valores):

| Credencial | Ubicación | ¿Versionada? | ¿En `.env`? | ¿Frontend? | Clasificación |
|---|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (valor `service_role` JWT) | `melantia/.env` | No (ignorado) | Sí | No | Sensible — correcto en `.env`; aparece solo como *nombre* en `config.py` (HEAD) |
| `VITE_SUPABASE_ANON_KEY` | `melantia/.env` | No | Sí | No (frontend no la lee) | Baja (anon es público por diseño) |
| `SUPABASE_URL`, `VITE_SUPABASE_URL` | `melantia/.env` | No | Sí | No | No-secreta (URL pública) |
| `PAYPHONE_SECRET_KEY` | `melantia/.env` | No | Sí | No | Sensible — D1b del ADR autoriza rotación futura |
| `VITE_PAYPHONE_PUBLIC_KEY` | `melantia/.env` | No | Sí | No | Pública por diseño |
| `sb_secret_*` / `sb_publishable_*` | **solo en documentación** (8 docs e0_supabase, como concepto) | — | No | No | No existen aún como credenciales en el repo |
| `MELANTIA_JWT_SECRET_KEY` fallback | `backend/core/security.py:30` (**literal en código**) | **Sí, en HEAD** | — | No | ⚠️ secreto por defecto en código — mitigable solo si el env siempre está set; recomendable eliminar fallback en fase futura |
| `melantia_offline_2026` (default `MELANTIA_DB_PASS`) | `backend/core/config.py:59` (**literal**) | **Sí, en HEAD** | — | No | ⚠️ password por defecto de dev en código |

**CRÍTICO (regla del encargo):** no se encontró `sb_secret_*` ni `service_role` dentro de `frontend/`, `src/`, `public/` ni JS servido al navegador. ✔

`supabase/.temp/` (CLI state, **¿versionado?** — verificar en commit futuro si debe ignorarse) contiene `linked-project.json` con ref `lizqreiyysrqgkzyddff` (proyecto nuevo) y `pooler-url` con conninfo **sin password**.

## 12. Git

- `.env` y `.env.*` cubiertos por `.gitignore` en la **raíz del repo** (`E:\Desktop\MELANTIA\.gitignore`): `git check-ignore` confirma `.env` y `frontend/.env` ignorados. **No existe `.gitignore` dentro de `melantia/`** — la protección viene del padre.
- `git ls-files` → **0 archivos `.env` versionados**.
- `git grep` sobre HEAD → único archivo versionado que menciona estas variables: `backend/core/config.py` (solo *nombres*, sin valores). ✅ Sin credenciales en historial (búsqueda `git log -S` no arrojó hits de claves).
- Pre-existente en `git status`: eliminaciones masivas bajo `melant_ia/src/` y warnings de directorios con permisos denegados — **estado previo del repo, no causado por esta auditoría**. No se ejecutó `git add/commit/push`.

## 13. Cambios NECESARIOS (para la migración futura — no ejecutar ahora)

1. **Ninguno en runtime activo** — el sistema actual no depende funcionalmente de ninguna clave Supabase.
2. Cuando se implemente Supabase Auth real (ADR D2): crear `SUPABASE_SECRET_KEY` (backend) y, si el browser habla directo con Supabase, `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend). Hoy ambas serían variables **nuevas**, no sustituciones de código vivo.
3. Si se decide conservar `SupabaseAuth` como implementación base: mapear `supabase_service_role_key ← SUPABASE_SECRET_KEY` (renombrar campo o alias en `config.py:66`) y terminar `get_user_by_token` con `httpx` (ya instalado).
4. Documentar/crear un `.env.example` (inexistente hoy) con los nombres nuevos.

## 14. Cambios RECOMENDADOS

1. Eliminar el **fallback JWT hardcodeado** en `security.py:30` cuando se migre a Supabase Auth (o exigir `MELANTIA_JWT_SECRET_KEY` obligatorio mientras tanto).
2. Eliminar el default de password de DB (`config.py:59`) o marcarlo explícitamente como dev-only.
3. Resolver la **colisión semántica de `usuarios_perfiles`** (local junction vs. puente auth.users de `0001`) antes de converger esquemas — ver ADR §6.
4. Considerar ignorar `supabase/.temp/` en `.gitignore` (estado local de CLI con project-ref).
5. Deprecar o implementar `SupabaseAuth`: hoy es código muerto que sugiere una capacidad inexistente — riesgo de falsa confianza.
6. Mantener `PAYPHONE_*` fuera del alcance de esta transición (clave de tercero, no Supabase).

## 15. Cambios que NO deben hacerse

- **No renombrar `VITE_SUPABASE_URL`/`SUPABASE_URL`** — las URLs no cambian entre sistemas de claves.
- **No crear `VITE_SUPABASE_PUBLISHABLE_KEY` mientras el frontend no tenga cliente Supabase** — una var `VITE_*` se incrusta en el bundle; crearla antes de tiempo la expone sin beneficio.
- **No usar `SUPABASE_SECRET_KEY`/`service_role` en frontend jamás** (bypass RLS).
- **No "restaurar" las claves del proyecto antiguo** (`upfwgaacznljbzmbgcul`) — proyecto distinto; rotar/no reutilizar (riesgo R-15 del backup audit).
- **No tocar `VITE_SUPABASE_ANON_KEY`→`publishable` en `config.py:67` sin rediseñar**: el backend leyendo una var `VITE_*` es un acoplamiento raro que conviene eliminar, no perpetuar.
- No ejecutar migraciones `supabase/migrations/*` como parte de esta transición de claves (son cambios de esquema, separados).

## 16. Riesgos

| # | Riesgo | Nivel |
|---|---|---|
| 1 | Falsa sensación de integración: `SupabaseAuth` sugiere soporte Supabase que no existe | medio |
| 2 | `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env` parecen "en uso" pero están muertas → confusión operativa al rotar | bajo |
| 3 | Fallback JWT + DB password hardcodeados en código versionado | medio (propio, no Supabase) |
| 4 | Colisión `usuarios_perfiles` (dos modelos, mismo nombre) al aplicar `0001` | alto si se migra sin resolver D6 |
| 5 | Introducir `publishable` en bundle sin RLS/policies aún inexistentes (backup muestra 0 policies) | medio-futuro |
| 6 | Cobertura incompleta de auditoría: directorios con DACL vacía podrían contener más referencias históricas (legacy ya documentadas en auditoría 03) | bajo |

## 17. Plan de migración futuro (conceptual — NO ejecutar)

```text
FASE A — Auditar        [ESTA TAREA — completada]
FASE B — Crear/confirmar variables nuevas
         SUPABASE_SECRET_KEY (backend) · VITE_SUPABASE_PUBLISHABLE_KEY (frontend, solo cuando haya cliente)
         ↓
FASE C — Adaptar backend
         decidir suerte de SupabaseAuth · remapear config · implementar verificación JWT Supabase (ADR D2)
         ↓
FASE D — Adaptar frontend
         añadir @supabase/supabase-js solo si el diseño lo requiere · consumir publishable
         ↓
FASE E — Pruebas (login, endpoints, RLS deny por defecto)
         ↓
FASE F — Verificar RLS (policies reales en el proyecto nuevo — el backup muestra 0)
         ↓
FASE G — Eliminar dependencia de claves antiguas (quitar vars muertas del .env y del config)
         ↓
FASE H — Rotación/deprecación controlada (panel Supabase: deshabilitar anon/service_role cuando nada las use)
```

---

## Estado final confirmado

- Archivos existentes modificados: **0**
- `.env` modificado: **0** (legible; valores intactos, nunca impresos)
- Supabase / PostgreSQL / migraciones: **0 modificaciones**
- Claves generadas/rotadas/borradas: **0**
- Secretos mostrados en esta auditoría: **0** (solo nombres y prefijos)
- Git add / commit / push: **NO / NO / NO**
- Documento creado: `e0_supabase/13_AUDITORIA_TRANSICION_CLAVES.md` (este)
- Reparación de permisos autorizada por el usuario aplicada a `backend/` (252 objetos, `/reset` herencia — sin cambio de contenido)
