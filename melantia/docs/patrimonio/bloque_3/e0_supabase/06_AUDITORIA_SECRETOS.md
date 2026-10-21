# 06 — AUDITORÍA DE SECRETOS

> Ningún secreto se muestra completo. Formato: prefijo identificable + `[REDACTED]` + longitud.

## 6.1 Clasificación de la clave histórica

La auditoría anterior la llamó "anonKey". Análisis técnico del formato:

| Clave | Prefijo | Longitud | Clasificación | Evidencia |
|---|---|---|---|---|
| `VITE_SUPABASE_ANON_KEY` / `anonKey` | `sb_publishable_` | 40–48 | **PUBLISHABLE** | Formato nuevo de Supabase (`sb_publishable_*`) que reemplaza a la legacy anon `eyJ...`. Es clave de cliente — diseñada para embeberse en frontend, limitada por RLS. **No es un secreto crítico**, pero sí expone proyecto/bucket/tabla. |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_` | 41–43 | **SECRET** (equivalente service_role) | Formato nuevo `sb_secret_*`. **Bypasea RLS por completo** — privilegios totales sobre la base y storage. **Secreto sensible real.** |
| `VITE_PAYPHONE_PUBLIC_KEY` | `pShbXR...` | 20–22 | Pública | Clave pública de comercio PayPhone — exposición menor. |
| `PAYPHONE_SECRET_KEY` | `oL_FkP_...` | 16–18 | **SECRET** | Secreto de API PayPhone — firma cobros reales. **Secreto sensible.** |

**Respuesta a la pregunta clave**: el "anonKey" de `supabase_config.js` es una **PUBLISHABLE** key (no secreto crítico). Pero el mismo `.env` contiene una **SECRET key real** (`sb_secret_`) que el informe anterior no había separado — eso eleva la alerta.

## 6.2 Inventario de exposición

| # | Archivo | Secreto | Estado | Riesgo | Acción recomendada |
|---|---|---|---|---|---|
| S1 | `melantia/.env` (repo actual, **gitignored**, no commiteado) | `sb_publishable_*`, **`sb_secret_*`**, PayPhone pub+secret | Activo/local | **CRÍTICO si es válida** — secret en disco local | Rotar `sb_secret_*` y PayPhone (tarea autorizada separada); asumir comprometida si este equipo/repo se compartió alguna vez |
| S2 | `melantia_old_version/respaldo_melantia/melant_ia/.env` (gitignored) | mismas claves | Histórico local | ALTO — duplicado del secreto en segundo archivo | Igual que S1; incluir en saneado |
| S3 | `melant_ia/src/supabase_config.js` + `modules/supabase_config.js` + `database/supabase_config.js` (respaldo) | `sb_publishable_*` | **COMMITTED en HEAD** (tree eliminado en working tree pero en historia) | MEDIO — publishable en git; expone proyecto; si RLS histórico era permisivo (`using(true)`) esa clave permitía escrituras | Rotar publishable si el proyecto sigue vivo; asumirla pública en cualquier caso |
| S4 | `melantia_old_version/**/supabase_config.js` (~5 copias físicas) | `sb_publishable_*` | Histórico local (gitignored) | BAJO | Cubierto por rotación de S3 |
| S5 | `backend/core/security.py:33` | default JWT `melantia_secret_key_change_in_production_2026` | Committed (default dev) | MEDIO — secreto de firma JWT con fallback en código | Exigir env sin default en producción (rediseño config futuro) |
| S6 | `ejecutar_asistente.py` + `knowledge_service.py` + `retriever.py` | `OPENAI_API_KEY` leída de env | Histórico, sin valor embebido | BAJO | Ninguna (correcto uso de env) |
| S7 | `servicios_financieros_config.json` | campo `api_key` (valor presente, longitud ~normal de placeholder/dato) | Histórico | DESCONOCIDO — verificar si es clave real o placeholder | Inspección puntual en revisión de seguridad |
| S8 | `system_prompt_openai.js`, `generarFacturaEcuador.js` | `API_KEY` referenciada | Sin valor embebido (leída de config) | BAJO | Ninguna |
| S9 | `melantia/frontend/.env` | `VITE_API_URL` localhost | Actual | Ninguno | — |

## 6.3 Matriz de verdad sobre la publishable key

- ¿Está **commiteada en git**? Sí — `melant_ia/src/supabase_config.js` (HEAD) y `melant_ia/src/modules/supabase_config.js` (HEAD), aunque esos archivos están eliminados del working tree, permanecen en la historia del repo.
- ¿Es secreto? **No crítico** — es la clave de cliente. El riesgo real es que el bucket y las políticas históricas eran permisivos (`using(true)` para anon): **esa clave + URL sí habilitaba operaciones reales** sobre `melantia-trazabilidad` y `evidencia_fotos_nube` si el proyecto sigue activo.
- ¿Debe rotarse? Recomendado si el proyecto Supabase sigue existiendo — no por el formato de la clave sino porque está en git + RLS histórico laxo.
- La `sb_secret_*` **sí es crítica**: aunque no está en git, está en dos `.env` locales y cualquier copia del proyecto (backups, zips, comparticiones) la lleva implícita. `melant_ia.zip` en la raíz del workspace — **verificar si contiene `.env`** (pendiente: no inspeccionado en esta auditoría; añadir a revisión de seguridad).

## 6.4 Acciones recomendadas (NUNCA ejecutadas desde esta fase)

1. **Rotar `sb_secret_*`** (Supabase → API keys → roll secret) — invalida todas las copias locales.
2. **Rotar/regenerar publishable** si el proyecto sigue en uso — barata de hacer.
3. **Rotar `PAYPHONE_SECRET_KEY`** en el panel del comercio.
4. Verificar `melant_ia.zip` y cualquier backup por `.env` incluidos.
5. Escaneo de secretos exhaustivo (gitleaks/trufflehog) antes de publicar cualquier árbol — **pendiente, no ejecutado**.
6. Eliminar el fallback hardcodeado de `MELANTIA_JWT_SECRET_KEY` cuando se rediseñe config de producción.
