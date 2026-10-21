# 04 — AUDITORÍA DE POSTGRESQL (LOCAL Y SUPABASE)

## 4.1 Configuración actual

| Elemento | Valor | Fuente |
|---|---|---|
| Driver | **Psycopg 3** (`psycopg` + `psycopg_pool`) | `database.py` |
| Pool | `AsyncConnectionPool` (min 2/max 10) + `ConnectionPool` sync (min 1/max 5, deprecated progresivo) | `database.py` |
| Row factory | `dict_row` (convención de proyecto) | `database.py` |
| Cadena de conexión | `postgresql://{user}:{pass}@{host}:{port}/{db}` computada de `MELANTIA_DB_*` | `core/config.py:database_url` |
| Defaults dev | `localhost:5432 / melantia_db / postgres / melantia_offline_2026` | `config.py` |
| Ciclo de vida | pools `open=False`, abiertos explícitamente en lifespan FastAPI | `database.py` |
| Caché | `SingleFlightManager` (coalescing + TTL) | `database.py` |

## 4.2 ¿Hay lógica acoplada a PostgreSQL local?

**No.** La aplicación solo conoce `settings.database_url`. Cambiar host/puerto/db/user/pass vía entorno no toca código:

```text
DESARROLLO:  MELANTIA_DB_HOST=localhost
PRODUCCIÓN:  MELANTIA_DB_HOST=db.<proyecto>.supabase.co (o pooler :6543)
```

Puntos de atención reales para Supabase:

| Tema | Situación |
|---|---|
| Conexiones directas vs pooler | Pool propio (max 10) + pooler de Supabase (PgBouncer transaction mode) → psycopg3 funciona; en transaction mode hay que vigilar prepared statements y features de sesión (LISTEN/NOTIFY no aplicaría — no se usa) |
| `uuid-ossp` | Disponible en Supabase ✓ |
| Contraseña en `database_url` | Va embebida en conninfo — normal; nunca loguearla |
| SSL | Supabase exige SSL → conninfo necesitará `sslmode=require` (o parámetro equivalente) — **no configurado actualmente**; el `database_url` actual no incluye sslmode |
| Row-level security | No aplicable si la conexión es con usuario `postgres`/rol dueño — la app usa credenciales directas, no tokens de usuario; RLS queda como defensa extra opcional |

## 4.3 Compatibilidad del esquema actual con Supabase PostgreSQL

Inventario de features usadas en `backend/database/schema/`:

| Feature | Uso | ¿Soportado en Supabase? |
|---|---|---|
| `uuid-ossp` / `uuid_generate_v4()` | 41 | Sí (extensión habilitable; `gen_random_uuid()` nativo también existe) |
| `TIMESTAMPTZ` | 53 | Sí |
| `JSONB` + GIN | 4+3 | Sí |
| `CREATE TRIGGER` | 7 | Sí |
| `CREATE EXTENSION` | 3 (uuid-ossp; postgis **comentado**) | uuid-ossp sí; postgis disponible pero decisión pendiente (B1) |
| `CREATE FUNCTION` plpgsql | sí (triggers) | Sí |
| FKs, UNIQUE, CHECK, índices | general | Sí |
| Transacciones | psycopg3 pools | Sí |
| PostGIS columns | **ninguna aún** | — |
| `auth.users` FK | no (schema canónico actual no lo usa) | Solo en `supabase/migrations/0001` untracked |

**Veredicto**: el esquema canónico actual es 100% compatible con Supabase PostgreSQL sin cambios. PostGIS es extensión habilitable cuando se decida (B1).

## 4.4 Dos esquemas paralelos detectados (riesgo de divergencia)

| Esquema | Ubicación | Estado | Naturaleza |
|---|---|---|---|
| Canónico | `backend/database/schema/*.sql` (11 archivos) | Trackeado, vigente | PostgreSQL puro (usuarios, fincas, levantamientos, EP, suscripciones, evidencias, trazabilidad, geografía) |
| Supabase | `melantia/supabase/migrations/*.sql` (10 archivos) | **UNTRACKED** | `0001_fase1_core.sql` = RBAC nuevo con `auth.users` FK; resto = copias de SQL histórico (agro, fitosanitario, palmas, panel multiusuario SQLite, trazabilidad fotos) |
| Supabase histórico | `respaldo/.../supabase/migrations/` | Histórico | versiones anteriores de los mismos |
| Schema histórico completo | `modules/schemas/supabase/melantia_supabase_schema.sql` | Histórico | 12 módulos, diseñado para Supabase con postgis |

**Hallazgo**: `0001_fase1_core.sql` introduce `usuarios_perfiles.id → auth.users` — un modelo de identidad **distinto** del canónico (`usuarios` propio con `cedula_ruc`). Si ambos esquemas se aplicaran a la misma base habría dos modelos de usuario conviviendo. Debe resolverse en la decisión de arquitectura auth (ver `07_DECISION_AUTH.md`).

## 4.5 Contrato de configuración propuesto (sin crear `.env`)

```bash
# Identidad de conexión (ya existe el patrón MELANTIA_DB_*)
MELANTIA_DB_HOST=            # localhost | db.<ref>.supabase.co | aws-...pooler.supabase.com
MELANTIA_DB_PORT=            # 5432 (direct) | 6543 (pooler transaction)
MELANTIA_DB_NAME=            # melantia_db | postgres
MELANTIA_DB_USER=            # postgres | postgres.<ref>
MELANTIA_DB_PASS=            # local | secreto gestor de secretos
MELANTIA_DB_SSLMODE=         # disable (local) | require (supabase)   ← A AÑADIR

# Servicios Supabase (ya existen en config.py, opcionales)
SUPABASE_URL=                # https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=    # nombre nuevo del alias VITE_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY=         # equivalente moderno de service_role — SOLO backend
SUPABASE_JWT_ISSUER=         # https://<ref>.supabase.co/auth/v1  ← A AÑADIR si Opción C
SUPABASE_STORAGE_BUCKET=     # melantia-trazabilidad (u otro)      ← A AÑADIR si Storage
```

Variables ya existentes en `config.py`: `supabase_url`, `supabase_service_role_key`, `supabase_anon_key` (alias `VITE_SUPABASE_ANON_KEY`), `payphone_public_key`, `payphone_secret_key` — la estructura ya anticipa el contrato; faltan `sslmode`, `jwt_issuer`, `storage_bucket` y normalizar nombres publishable/secret.

## 4.6 Separación desarrollo/producción — factibilidad

| Componente | Desarrollo | Producción | ¿Factible hoy? |
|---|---|---|---|
| FastAPI | local | remoto | Sí |
| PostgreSQL | `localhost:5432` | Supabase PG | Sí — solo env vars + sslmode |
| Auth | JWT propio | JWT propio o Supabase Auth (decisión) | Sí (parcial — ver 07) |
| Storage | `storage_dir` local (ya existe en config) | Supabase Storage | Parcial — falta capa de abstracción de storage en backend |
| Evidencias | metadata PG + archivo local | metadata PG + objeto Storage | Requiere implementar |

La arquitectura ya permite el split BD local ↔ Supabase PG con un cambio de entorno. Lo que falta para Storage es exactamente la abstracción `storage_dir` (local) ↔ bucket (remoto).
