# 08 — VERIFICACIÓN DE INTEGRIDAD

Hashes calculados con `sha256sum` sobre los archivos originales, sin modificarlos.
Fecha de verificación: 2026-10-03.

---

## 8.1 Registro de verificación

| Archivo | Tamaño | SHA-256 | Tipo real | Resultado de lectura |
|---|---|---|---|---|
| `upfwgaacznljbzmbgcul.storage.zip` | 22 B | `8739c76e681f900923b900c9df0ef75cf421d39cabb54650c4b9ad19b6a76d85` | ZIP válido (EOCD, 0 entradas) | ✅ Íntegro — **vacío por construcción** |
| `db_cluster-29-09-2026@17-17-59.backup.gz` | 44 383 B | `a0d651059d2914f485fd037812bd24c8759f61347a1032ff95d8c2de73f4bf34` | gzip → SQL texto (pg_dumpall) | ✅ Íntegro — stream gzip leído de extremo a extremo sin errores; descomprime a 301 948 B / 8 633 líneas |

## 8.2 Controles aplicados

| Control | Método | Resultado |
|---|---|---|
| gzip CRC/deflate íntegro | Lectura completa del stream (`gzip.open` + read hasta EOF) | OK, sin excepción |
| ZIP parseable | `zipfile.is_zipfile` + `namelist()` | OK, 0 entradas |
| SQL bien formado en extremos | Cabecera `-- PostgreSQL database cluster dump` y pie `-- PostgreSQL database cluster dump complete` con `\unrestrict` final | OK — dump **completo, no truncado** |
| Coherencia COPY | 55 bloques `COPY … FROM stdin` con terminador `\.` cada uno | OK — todos cerrados |
| Secretos en claro | Búsqueda de `PASSWORD`, `ENCRYPTED`, `ALTER DATABASE … SET` | **0 cláusulas de password**; `vault.secrets` vacío; sin ALTER DATABASE SET |

## 8.3 Uso de los hashes

Los SHA-256 anteriores sirven como **huella de referencia**: cualquier copia futura de estos archivos deberá producir el mismo hash para considerarse idéntica al original auditado. Si el hash difiere, el archivo fue alterado o la copia está corrupta.

## 8.4 Confirmación de no-modificación

Los archivos fueron accedidos exclusivamente en modo lectura (`sha256sum`, `xxd`, `unzip -l`, `gzip -dc` hacia stdout/copia en `%TEMP%`). MTimes conservados: `2026-10-03 14:33:24` / `14:34:04`.
