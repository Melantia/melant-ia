# 09 — BLOQUEADORES DE LA FASE E0

| ID | Problema | Evidencia | Qué bloquea | Dependencia | Decisión necesaria | Pri |
|---|---|---|---|---|---|---|
| BLOQ-KEY | `sb_secret_*` real en 2 `.env` locales + publishable en git | `06_AUDITORIA_SECRETOS.md` S1–S3 | Cualquier compartición del repo/árbol; uso seguro del proyecto Supabase | Tarea de rotación autorizada | ¿El proyecto `upfwgaacznljbzmbgcul` sigue en uso? ¿rotar secret+publishable+PayPhone? | **P0** |
| BLOQ-AUTH | Modelo de identidad sin decidir: `usuarios` propio (cédula) vs `auth.users` (0001_fase1 untracked) — dos esquemas convivirían | `02_AUDITORIA_AUTH.md`, `04 §4.4` | Toda migración Auth/Storage/RLS | Decisión D1–D4 | Opción C destino vs A permanente; mapeo cédula; reset passwords | **P0** |
| BLOQ-STORAGE | Sin proveedor/diseño de storage decidido; histórico sube cliente-directo con anon | `03 §3.5`, `05 §5.1` | M11 evidencias, QR, KYC docs, cualquier archivo | Decisión storage + auth | ¿FastAPI sube con secret (server-side) o signed URLs? ¿bucket privado? | P1 |
| BLOQ-EVIDENCE | `evidencias_documentos` actual = custodia/escrow, no store de archivos; metadata agrícola histórica sin columna destino | `03 §3.3` | Consolidación del modelo de evidencias | Diseño de schema | ¿ampliar `evidencias_documentos`, tabla hermana `archivos_evidencia`, o dos tablas? | P1 |
| BLOQ-POSTGRES | `database_url` sin sslmode; pool propio + pooler Supabase sin validar; dos esquemas SQL paralelos (canónico vs supabase/migrations) | `04 §4.2/4.4` | Paso a producción Supabase PG | Prueba de conexión autorizada | ¿Se valida conexión de lectura al proyecto remoto? ¿unificar esquemas? | P1 |
| BLOQ-OFFLINE | Cola offline de evidencias existe históricamente pero el patrón general offline no está decidido (BLOQ-07 de Bloque 3) | `03 §3.4` | Diseño de sync de archivos | Estrategia offline única | Confirmar patrón cola→sync→confirmación→purge como estándar | P1 |
| BLOQ-RLS | RLS histórico permisivo (`using(true)` para anon) — publishable key habilitaba escrituras abiertas | `05 §5.1`, trazabilidad SQL | Seguridad de cualquier dato en Supabase | BLOQ-AUTH | RLS por usuario (requiere Supabase Auth) o storage solo server-side | P1 |
| BLOQ-SCHEMA | `melantia/supabase/` untracked — trabajo previo sin dueño/estado claro; mezcla RBAC nuevo + SQL legacy | `01 §1.6`, `04 §4.4` | Claridad del esquema objetivo | Revisión del autor/estado | ¿Se adopta `0001_fase1_core` como base de C? ¿qué pasa con el resto del dir? | P1 |

## Cadena de desbloqueo

```text
BLOQ-KEY (rotación) ──desbloquea──> uso seguro del proyecto
BLOQ-AUTH (Opción C/A) ──desbloquea──> BLOQ-STORAGE, BLOQ-RLS, BLOQ-SCHEMA,
                                      modelo de usuarios_perfiles
BLOQ-STORAGE ──desbloquea──> BLOQ-EVIDENCE (diseño tabla) ──> M11 real
BLOQ-POSTGRES ──desbloquea──> producción Supabase PG
BLOQ-OFFLINE ──desbloquea──> sync de evidencias estandarizado
```

## Riesgos clasificados

| Nivel | Riesgo |
|---|---|
| CRÍTICO | `sb_secret_*` posiblemente válida circulando en `.env` locales/backups/zip |
| ALTO | RLS histórico permisivo + publishable en git → acceso abierto si proyecto vivo |
| ALTO | AuthZ placeholders (`require_role` etc. permiten todo) si se montan en rutas reales |
| MEDIO | Divergencia dos modelos de usuario (`usuarios` vs `auth.users`/`usuarios_perfiles`) |
| MEDIO | JWT sin refresh + secreto con fallback hardcodeado |
| MEDIO | Pérdida de metadata agrícola si evidencias solo conserva schema actual |
| MEDIO | `melantia/supabase/` untracked: conocimiento de diseño sin resguardo (un commit mal hecho lo publica o un borrado lo pierde) |
| BAJO | REST/Data API histórica — patrón a prohibir, código ya fuera del runtime |
| BAJO | Realtime/Edge — inexistentes, sin deuda |
