# 01 — INVENTARIO DE ARCHIVOS DE RESPALDO

**Auditoría forense de respaldos Supabase — proyecto antiguo `upfwgaacznljbzmbgcul`**
Fecha de auditoría: 2026-10-03 · Modo: SOLO LECTURA (ningún archivo original fue modificado)

---

## 1.1 Archivo 1 — Respaldo de Storage

| Campo | Valor |
|---|---|
| Ruta absoluta | `E:\Desktop\MELANTIA\upfwgaacznljbzmbgcul.storage.zip` |
| Nombre | `upfwgaacznljbzmbgcul.storage.zip` |
| Extensión declarada | `.zip` |
| Tamaño | **22 bytes** |
| Fecha de modificación | 2026-10-03 14:34:04 (-05:00) |
| SHA-256 | `8739c76e681f900923b900c9df0ef75cf421d39cabb54650c4b9ad19b6a76d85` |
| Magic bytes | `50 4B 05 06` (PK\x05\x06 = End Of Central Directory) |
| Tipo MIME / detectado | `application/zip` — **archivo ZIP válido con 0 entradas** |
| Formato real | ZIP vacío (solo registro EOCD; sin local file headers, sin central directory entries) |
| ¿Comprimido? | Contenedor ZIP, pero sin contenido que comprimir |
| ¿Archivo PostgreSQL? | No |
| ¿Inspeccionable sin restaurar? | Sí — inspeccionado con `unzip -l` y `zipfile` (Python): **0 entradas** |

**Conclusión:** el archivo es un **ZIP vacío**. Es el artefacto que produce la exportación de Storage de Supabase cuando el proyecto **no contiene ningún objeto/bucket con archivos**. No hay datos que recuperar de este archivo.

> Nota: el encargo mencionaba el nombre `upfwgaacznljbzmbgcul.storage` (sin `.zip`). El archivo real en disco tiene extensión `.zip`. Se audita el archivo real encontrado.

---

## 1.2 Archivo 2 — Respaldo de base de datos

| Campo | Valor |
|---|---|
| Ruta absoluta | `E:\Desktop\MELANTIA\db_cluster-29-09-2026@17-17-59.backup.gz` |
| Nombre | `db_cluster-29-09-2026@17-17-59.backup.gz` |
| Extensión declarada | `.backup.gz` |
| Tamaño comprimido | **44 383 bytes (~43 KB)** |
| Tamaño descomprimido | 301 948 bytes (~295 KB), 8 633 líneas de texto SQL |
| Fecha de modificación | 2026-10-03 14:33:24 (-05:00) |
| SHA-256 | `a0d651059d2914f485fd037812bd24c8759f61347a1032ff95d8c2de73f4bf34` |
| Magic bytes | `1F 8B 08` (gzip) → contenido interno comienza con `-- PostgreSQL database cluster dump` |
| Tipo MIME / detectado | `application/gzip` → `text/plain` (SQL) |
| Formato real | **pg_dumpall en formato SQL plano** (cluster dump: roles + dumps por base de datos), NO formato `custom`, NO `tar`, NO `directory`, NO backup físico |
| ¿Comprimido? | Sí, gzip (integridad verificada por lectura completa del stream: OK) |
| ¿Archivo PostgreSQL reconocido? | Sí — volcado lógico SQL reproducible con `psql` (no requiere `pg_restore`) |
| ¿Inspeccionable sin restaurar? | Sí — completamente legible tras descompresión en memoria/copia de trabajo |

> Nota: el encargo mencionaba `db_cluster-29-09-2026@17-17-39.backup`; el archivo real es `db_cluster-29-09-2026@17-17-59.backup.gz` (segundos distintos y extensión `.gz` añadida). Se audita el archivo real encontrado.

**Versiones declaradas en la cabecera del dump:**

- `-- Dumped from database version 17.6`
- `-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg12+2)`

---

## 1.3 Observaciones de fase

1. **Fecha de generación vs. fecha de archivo:** el nombre del backup de DB indica generación `29-09-2026 @ 17:17:59`; ambos archivos tienen mtime `2026-10-03`, que corresponde a la fecha de descarga/copia a esta máquina, no a la del snapshot.
2. **Tamaño anómalo:** 43 KB comprimidos es extremadamente pequeño para un clúster Supabase con actividad real. La causa queda confirmada en `02_AUDITORIA_DATABASE_BACKUP.md`: el dump **no contiene datos de usuario**.
3. **Ambos archivos se leyeron íntegramente** sin errores: integridad de transporte correcta (gzip válido de extremo a extremo; ZIP estructuralmente válido aunque vacío).
4. **Ningún original fue abierto en modo escritura**, renombrado, movido ni modificado. La descompresión se hizo hacia una copia de trabajo en `%TEMP%` (`db_cluster_backup.sql`), fuera del árbol del proyecto.
