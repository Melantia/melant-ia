# MELANTIA — Entorno de desarrollo

## Entorno Python (backend + tests)

El `venv/` del proyecto corre con un subconjunto mínimo de
`backend/requirements.txt` suficiente para la suite completa
(los tests no importan tensorflow/opencv/pandas):

```bash
venv/Scripts/python.exe -m pip install \
  "fastapi==0.115.0" "uvicorn==0.30.6" "pydantic==2.13.5" \
  "pydantic-settings==2.6.1" "email-validator" \
  "psycopg[binary]==3.2.3" "psycopg-pool==3.2.3" \
  "python-dotenv==1.0.1" "python-jose[cryptography]==3.3.0" \
  "passlib==1.7.4" "bcrypt==4.0.1" "httpx==0.27.0" "pytest==9.1.1"
```

`psycopg[binary]` es obligatorio en Windows sin PostgreSQL instalado
(aporta libpq empaquetado).

## PostgreSQL local portable

No hay Docker/Podman ni PostgreSQL del sistema. Se usa una instancia
portable en `.pg16/` (EDB binaries 16.15-5, gitignored):

```bash
# arrancar / parar
.pg16/pgsql/bin/pg_ctl.exe -D .pg16/data -l .pg16/pg.log start
.pg16/pgsql/bin/pg_ctl.exe -D .pg16/data stop

# psql
.pg16/pgsql/bin/psql.exe -U postgres -h localhost -d melantia_db
```

Auth `trust` en localhost — solo desarrollo. Bases:
`melantia_db` (app; m2–m7) y `melantia_test` (suite; **m2–m9**
+ seeds geográficos — m8/m9 de sincronización aún no aplicadas a
la base de desarrollo).

## Tests

```bash
MELANTIA_TEST_DATABASE_URL="postgresql://postgres@localhost:5432/melantia_test" \
  venv/Scripts/python.exe -m pytest backend/tests -q
```

Sin la variable, los tests de BD hacen skip explícito (conftest
fail-closed). Estado 2026-10-21: **444 passed, 0 skipped**.

## Orden de aplicación del schema (docs/DB_MIGRATION_EXECUTION_PHASE1.md)

```
extensions → geografia → usuarios → auth_puente → sesiones →
gestion_fincas → modulos/{animales, labores_pecuarias} → trazabilidad →
modulos/negocios_rurales_v2 → evidencias → registros_campo →
mediciones_campo → levantamientos → suscripciones →
ecosistema_profesional → migraciones m2→m9 → seeds/*
(m8/m9 solo en melantia_test por ahora)
```

## Frontend

```bash
npm run dev    # vite
npm run lint   # oxlint
npm run build
```

## Convenciones

- Seeds idempotentes en `backend/database/seeds/` (ON CONFLICT /
  NOT EXISTS), separados del DDL.
- Registro diario en `MELANTIA_PROJECT_MASTER_FULL.md`
  (`## YYYY-MM-DD — Registro diario`), regla §25 del master.
- `.legacy_extract/` es la cuarentena de código legacy/prototipos
  (gitignored).
- Migraciones en `backend/database/migraciones/`: convención
  m2–m9 = header PROPUESTA + pre-chequeos + `BEGIN;`/`COMMIT;` +
  `IF NOT EXISTS`, aditivas. Ejecutar con `psql -1 -f` (los warnings
  de transacción son cosméticos, documentados en m7).
- `melantia/{assets,business,core_python,data,.pytest_cache}` son
  directorios **vacíos** con ACL de Windows restrictiva (git los
  reporta "permission denied"); pendiente decisión de borrado.
- Módulos nuevos: convención EP — `router.py` agregador +
  `routes/` + `schemas/` + `services/` → `shared/repositories/`.
  Routers delgados, SQL en repos, `get_db`+`get_current_user`,
  404 indistinguible para recurso ajeno, prefijo `/api/v1/*`.
  Referencia viva: `modules/gestion_fincas/` +
  `tests/test_gestion_fincas_api.py`.
- NUNCA commitear: `.env`, `.pg16/`, `venv/`, `../API OpenRouter/`
  (contiene `antigua_clave/` con credenciales), dumps `*.backup.gz`,
  `pgadmin4.exe`.
