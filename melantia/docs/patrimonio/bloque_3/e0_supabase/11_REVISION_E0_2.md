# 11 — REVISIÓN E0.2: CREDENCIALES + ZIP + `0001_fase1_core.sql`

Solo lectura. Sin tocar credenciales (sin rotación, sin cambios de config, sin ejecución en paneles).

## A. Corrección adoptada de clasificación

| Clave | Clasificación corregida | Tratamiento |
|---|---|---|
| `sb_secret_*` | 🔴 **SECRET** (equivalente service_role, bypass de RLS) | Secreto sensible |
| `PAYPHONE_SECRET_KEY` | 🔴 **SECRET** (firma cobros reales) | Secreto sensible |
| `sb_publishable_*` | 🟢 **PUBLISHABLE** (clave de cliente, nomenclatura moderna de Supabase) | **No secreto** — revisar uso/RLS y decidir migración de nomenclatura/config |

Esto sustituye el paquete único "rotar todo" del plan anterior.

## B. Verificación controlada de credenciales (por hash SHA-256, sin valores)

**Resultado: existen exactamente 2 claves reales, idénticas en todas sus copias.**

| Clave | Hash (12) | Len | Ubicaciones verificadas |
|---|---|---|---|
| `sb_publishable_` `7256401ce8c8` | publishable | 46 | `melantia/.env`, `respaldo/.env`, `old_version/src/modules/supabase_config.js`, `old_version/src/database/supabase_config.js`, `respaldo/src/modules/supabase_config.js`, `respaldo/src/database/supabase_config.js`, **git HEAD** `melant_ia/src/supabase_config.js`, **git HEAD** `melant_ia/src/modules/supabase_config.js`, **ZIP** ambas copias → **9 copias, 1 misma clave** |
| `sb_secret_` `400747188bab` | secret | 41 | `melantia/.env`, `respaldo/.env` → **2 copias, 1 misma clave. NUNCA commiteada, NUNCA en el ZIP, NUNCA en código** |
| PayPhone pub + secret | — | — | solo las 2 `.env` |

Conclusiones:
- La superficie real del secreto crítico (`sb_secret`) es mínima: dos `.env` locales gitignored.
- La publishable está por todas partes (git + zip + físico) — pero por su naturaleza de clave de cliente, el riesgo depende del RLS, no de la exposición.
- Ninguna clave legacy `eyJ` (JWT-format anon/service_role antiguo) encontrada → proyecto usa el esquema de claves nuevo.
- No verificada: validez de las claves contra Supabase (requiere decisión del usuario — lectura remota o panel).

## C. Auditoría de `melant_ia.zip` (2.2 GB, 79,074 entradas)

| Hallazgo | Resultado |
|---|---|
| Archivos `.env` dentro del ZIP | **0 — limpio** |
| Archivos con nombres sensibles | 3: los `supabase_config.js` conocidos (publishable, misma clave B) |
| `sb_secret` en contenido de configs | No (solo en las 2 `.env` de disco) |
| SQL Supabase | `database/melantia_supabase_schema.sql` (33 KB — schema completo histórico), `database/supabase_trazabilidad_fotos.sql` |
| Estructura | réplica del tree `melant_ia/` con `.venv` incluido (~44k entradas de dependencias) |
| Fecha | Sep 5 — snapshot pre-cambios recientes |

**Veredicto ZIP**: no es vector de fuga del secreto. Contiene la publishable (pública por diseño) y el código histórico. Puede considerarse respaldo seguro a nivel credenciales, salvo que se publique con intención de compartir el publishable (riesgo bajo, depende de RLS).

## D. Revisión de `supabase/migrations/0001_fase1_core.sql` (untracked)

### Estructura completa

| Objeto | Detalle | Calidad |
|---|---|---|
| `set_updated_at()` | función trigger genérica | Correcta |
| `roles` | `id uuid, nombre UNIQUE, descripcion` | Correcta |
| `permisos` | `codigo 'dominio:accion' UNIQUE` | Modelo estándar sano |
| `roles_permisos` | puente N:M, CASCADE | Correcta |
| `usuarios_perfiles` | `id PK REFERENCES auth.users(id) ON DELETE CASCADE`, `cedula_ruc UNIQUE`, `nombres, apellidos, telefono`, `rol_id REFERENCES roles ON DELETE RESTRICT`, `estado CHECK` | Bien diseñada |
| `configuraciones_globales` | `clave PK, valor jsonb` | Correcta |
| Triggers `updated_at` | 4 | Correctos |
| RLS | habilitado en las 5 tablas: catálogos `SELECT → authenticated`; `usuarios_perfiles` `SELECT → auth.uid() = id` | **Punto de partida seguro** — perfiles solo visibles al dueño; admin vía service_role (anotado) |
| Seed | `admin, tecnico, usuario` idempotente | Correcto |
| Formato | idempotente (`IF NOT EXISTS`, `ON CONFLICT`), comentado, transacción BEGIN/COMMIT | Producción-ready en forma |

### Mapeo `usuarios_perfiles` ↔ `usuarios` canónica

| `usuarios_perfiles` (fase1) | `usuarios` (canónica) | Brecha |
|---|---|---|
| `id = auth.users.id` | `id = uuid_generate_v4()` propio | **modelo de identidad distinto** — la fase1 ancla al proveedor |
| `cedula_ruc UNIQUE` | `cedula_ruc UNIQUE` | Compatible — la cédula se conserva como identificador de negocio (resuelve D3 favorablemente) |
| `nombres + apellidos` | `nombre` (único campo) | Divergencia menor |
| `rol_id → roles` + `estado` | `tipo_suscripcion` | Modelos distintos: RBAC vs etiqueta plan |
| — | `firma_digital, provincia/canton/parroquia, sector_comunidad, contacto, storage_usado_mb, password_hash` | La canónica es más rica en perfil rural |

**Lectura arquitectónica**: `usuarios_perfiles` es la **tabla puente** (identidad Supabase + rol global), NO reemplazo de `usuarios` (perfil de negocio rural). Convierten bien juntas: `usuarios_perfiles.id` (auth) ↔ `usuarios.auth_user_id` (puente a añadir) — o fusión si se decide un solo modelo.

### Respuestas a la decisión auth

- **D1 (C vs A)**: la fase1 demuestra que C es técnicamente sólido y ya fue diseñado con cuidado — incluido RLS correcto.
- **D3 (cédula)**: resuelta en diseño — `cedula_ruc` vive en el perfil; Supabase Auth puede usar email/phone o magic link sin perder la cédula como clave de negocio.
- **D4 (puente)**: `usuarios_perfiles` ES el puente previsto; falta decidir relación con `usuarios` (1:1 por `auth_user_id` o absorber).

## E. Estado de información para D1–D6

| Decisión | Información disponible | Lista para decidir |
|---|---|---|
| D1 rotación secreta | Secret en solo 2 `.env`; publishable en 9 copias/git/zip; ZIP limpio | Sí |
| D2 Opción C vs A | `0001_fase1` revisado — diseño coherente, RLS seguro; AuthZ EP agnóstica | Sí |
| D3 login cédula | `cedula_ruc` persistido en perfil — compatible | Sí |
| D4 puente usuarios | Mapeo de campos documentado arriba | Sí (con matiz de fusión vs puente) |
| D5 storage | Pipelines históricos mapeados; falta decisión server-side vs signed URLs + modelo de tabla | Parcial — falta elegir mecanismo |
| D6 `supabase/` dir | Contenido revisado; `0001` es adoptable; resto = SQL legacy | Sí |

## F. Riesgo residual actualizado

| Riesgo | Nivel | Nota |
|---|---|---|
| `sb_secret` en 2 `.env` locales | CRÍTICO si proyecto vivo | Superficie pequeña y localizada — rotación barata |
| Publishable expuesta | BAJO-MEDIO | No es secreto; el riesgo es RLS histórico permisivo (`using(true)`) — se resuelve endureciendo RLS o moviendo acceso a backend |
| PayPhone secret | MEDIO | Solo 2 `.env`; rotar con proveedor |
| ZIP | BAJO | Sin `.env`; publishable no es secreto |
