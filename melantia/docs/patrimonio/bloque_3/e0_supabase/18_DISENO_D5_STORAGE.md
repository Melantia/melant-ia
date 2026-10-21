# 18 — D5: DISEÑO TÉCNICO DE STORAGE

**MELANTIA — evidencias, documentos, archivos y offline-first**
Fecha: 2026-10-03 · **SOLO DISEÑO — NADA IMPLEMENTADO.** Cierra **BLOQ-01** (proveedor de evidencias no definido) como *diseño*, sin elegir proveedor definitivo sin verificación I0.
Base normativa: ADR `14` · D4+D4.2 `15` · D4.1 `16` · **F7a `17`** (sesión, snapshot, `policy_version`, REQUIERE_ONLINE, outbox, revalidación server-side).

---

## 1. Objetivo y alcance

Diseñar dónde y cómo viven los **objetos binarios** de MELANTIA (fotos, PDFs, audio, evidencias, firmas, comprobantes) separados del dato estructurado. No implementa: ni buckets, ni migraciones, ni endpoints, ni proveedor.

## 2. Auditoría de contexto (verificado en código)

| Elemento | Estado | Evidencia |
|---|---|---|
| Upload endpoint | **NO EXISTE** — ningún `UploadFile` en backend | `grep` backend completo |
| Referencia a archivo | `foto_url TEXT` / `url_foto_*` VARCHAR — **string que el cliente envía**, sin verificación de existencia ni autoría | `main.py:259,630`, `evidencias.sql:18-19` |
| Almacenamiento real | `storage_dir` = filesystem local (`backend/storage/`) | `config.py:73` |
| Retención | worker borra foto+registro de `registros_campo` >15 días si `es_activo_conocimiento=FALSE`; borrado acotado a `STORAGE_DIR` (path-traversal safe) | `main.py:442-498` |
| Cuota | trigger BEFORE INSERT: `tipo_suscripcion` → límite MB (Básico 100 / Standard 500 / Empresarial 2000) sobre `usuarios.storage_usado_mb` | `registros_campo.sql:36-68` |
| Dedup offline | `hash_transaccion VARCHAR(64)` (idempotencia cliente) en `registros_campo` y `evidencias_documentos` (UNIQUE) | ambos schemas |
| Integridad | `hash_integridad VARCHAR(64)` en trazabilidad ×2 | `trazabilidad.sql:168,315` |
| Caché/offline | caché de lectura localStorage 7d; **sin outbox de escritura ni de archivos** | F7a §2 verificado |
| Frontend | sin código de upload | `frontend/src` |
| Histórico | pipelines Supabase-evidencias legados (documentados en backup audit 03), `gestor_evidencia_fotos` en dirs históricos | HISTÓRICO — no runtime |

**Conclusión del mapa:** hoy el "storage" es *una ruta de texto que el cliente inventa*. D5 diseña el reemplazo completo: objeto gestionado + metadata + autorización + integridad. La cuota por plan y el dedup por hash son piezas existentes que el diseño **absorbe** en vez de duplicar.

## 3. Separación de planos (regla madre)

```text
DATOS ESTRUCTURADOS   → PostgreSQL        (nunca BLOBs grandes)
ARCHIVOS/OBJETOS      → Object Storage     (nunca en PostgreSQL ni en webroot)
METADATOS DEL OBJETO  → PostgreSQL         (storage_objects — §4)
CACHÉ/OFFLINE LOCAL   → dispositivo        (no autoridad)
COLA DE SUBIDA        → dispositivo        (outbox de archivos §17)
```

Excepción documentada de binarios en PostgreSQL: **ninguna** en D5. Si aparece un caso (ej. QR/firma tiny), requerirá justificación explícita por tabla — regla por defecto = prohibido.

## 4. Modelo lógico de objeto — `storage_objects` (diseño, no DDL)

```text
storage_objects (lógico — tabla futura M-x)
  object_id          UUID PK
  storage_provider   'supabase' | 's3' | 'fs'     (abstracción §27)
  bucket             TEXT
  object_key         TEXT   — identidad física NO predecible (§7)
  mime_type / size_bytes / sha256 / checksum_provider
  owner_usuario_id   UUID → usuarios.id          (quién lo subió)
  owner_subject      {usuario|entidad} + id      (para jurídicas §22.2)
  scope              {tipo: proyecto|finca|lote|evidencia|documento|usuario,
                      id, recurso_tipo?}         — autorización §6
  domain_ref         {tabla, id} opcional        — evidencia_id, etc. §28
  sensitivity        PUBLIC|PRIVATE|SENSITIVE|HIGHLY_SENSITIVE
  estado             PENDING|UPLOADING|UPLOADED|VERIFIED|ACTIVE|
                     SOFT_DELETED|PURGED         (§13, §16)
  version / parent_object_id / supersedes_id / supersede_reason
  visibility         private (default) | public_signed_only | public
  retention_until / legal_hold
  created_by / created_at / uploaded_at / deleted_at
  upload_status / sync_status                    (outbox §17)
  nombre_original    TEXT                        — metadata, NO identidad
  provenance         {device_id, capturado_offline, policy_version}
```

## 5. Tipos de objetos y retención diferenciada

| Clase | Ejemplos | Sensibilidad típica | Retención orientativa |
|---|---|---|---|
| evidencia_foto | campo, plaga, cultivo, veterinaria | PRIVATE–SENSITIVE | larga (auditable) |
| evidencia_documento | escritura, matrícula, comprobante | SENSITIVE–HIGHLY | larga + legal_hold |
| foto_identidad | verificación, reclamo de cuenta | HIGHLY_SENSITIVE | mínima necesaria |
| documento_proyecto | informes EP, concesiones | PRIVATE–SENSITIVE | vida del proyecto |
| documento_financiero | comprobantes, custodia M11 | HIGHLY_SENSITIVE | regulatoria |
| imagen_publica | marketplace, avatar, portada | PUBLIC | libre |
| archivo_generado | PDF exportado, informe | PRIVATE | regenerable → corta |
| audio/video campo | notas de voz, inspección | PRIVATE | media |
| archivo_laboratorio | resultados, análisis | SENSITIVE | larga |
| temporal | procesamiento intermedio | PRIVATE | purge automático |

**Regla:** la retención la define la clase, no el bucket — hoy ya existe precedente (worker 15 días para no-conocimiento) que se generaliza a `retention_until` por clase.

## 6. Propietario, tenancy y autorización

`owner_subject` resuelve el dueño natural o jurídico (D4.2 §22.2 — una evidencia de la empresa pertenece a la entidad, no al técnico que la subió). `scope` conecta el objeto con el grafo de autorización **mismo EP-4E**: `recurso_tipo` mapea al resolver contextual → quien tiene `consulta`+ sobre el proyecto ve sus objetos. El objeto **nunca** se autoriza por su key — siempre por scope → `resolver_permiso` (o su equivalente de dominio). Un archivo no depende del path; depende de su fila `storage_objects` + autorización.

## 7. Object key — estrategia no predecible

```text
object_key = {bucket}/{shard}/{uuid4()}(.ext_normalizada)
   · shard = 2 chars hex del object_id (reparto de dirs)
   · sin cédula/RUC/coords/nombre/usuario en la key
   · extensión del MIME REAL detectado, no del nombre
```

Anti-enumeración (UUID), anti-IDOR (la key no es la autorización), sin PII. `nombre_original` vive en metadata para display/download filename.

## 8. Privacidad y visibilidad

| Nivel | Acceso | Ejemplos |
|---|---|---|
| PUBLIC | URL pública/cacheable | marketplace, avatares, recursos abiertos |
| PRIVATE | signed URL tras autorización | evidencias, docs de proyecto |
| SENSITIVE | signed URL + scope estricto + auditoría de descarga | escrituras, financiero, lab |
| HIGHLY_SENSITIVE | idem + posible cifrado adicional + TTL más corto + sin preview | identidad, clínico, legal |

Default: **private**. Ninguna URL pública permanente para nada no-PUBLIC.

## 9. Buckets / namespaces

Recomendación de diseño: **3–4 buckets por sensibilidad, no por dominio** — `evidencias-priv` (PRIVATE+SENSITIVE), `docs-sens` (HIGHLY_SENSITIVE), `media-pub` (PUBLIC), opcional `staging-uploads` (PENDING→ACTIVE). Ventaja: policy y ciclo de vida por sensibilidad, contención de errores de configuración (un bucket público accidental nunca expone SENSITIVE). Contra: más policies — mitigado porque todas siguen la misma plantilla por nivel.

## 10. Proveedor — comparativa sin decisión

| Criterio | A. Supabase Storage | B. S3-compatible | C. Otro futuro |
|---|---|---|---|
| Integración Auth/JWT | nativa (`auth.uid()` en policies) | IAM propio/firmas | varía |
| RLS sobre `storage.objects` | nativa en el mismo PG | n/a (app-level) | n/a |
| signed URLs/uploads | sí (exp configurable — ⏸️I0) | sí (presigned) | varía |
| multipart/resumable | TUS protocol (⏸️I0) | multipart nativo maduro | varía |
| Latencia Ecuador/LatAm | región del proyecto (⏸️I0) | regiones SA | varía |
| Portabilidad | API compatible parcial con S3 (⏸️I0) | estándar de facto | ⏸️ |
| Acoplamiento | +Supabase | neutro | varía |
| Coste/egress | plan Supabase | maduro/predecible | varía |

**Recomendación conceptual (no definitiva):** A (Supabase) como primera implementación tras la abstracción `StorageProvider` (§27) — misma plataforma que Auth, RLS nativa, menor fricción; la abstracción deja migrar a B si coste/escala lo exige. **PENDIENTE DE VERIFICACIÓN I0** — no aprobado como definitivo.

## 11. Supabase Storage + RLS (conceptual, sin policies)

`storage.objects` es tabla Postgres con RLS propia — **no hereda las policies de `public`**. Patrón conceptual: policy por bucket+nivel consultando `storage_objects` (o claim del JWT `usuarios.id`... ⚠ el JWT trae `auth.users.id` → las policies de Storage deben traducir por el puente igual que la API: `EXISTS (SELECT 1 FROM usuarios_auth_puente p WHERE p.id = auth.uid() AND p.estado='activo')` + scope). Lección del backup audit: **RLS + policy en la misma migración, siempre**.

## 12. Backend como autoridad — dos caminos

| Flujo | Cuándo | Diseño |
|---|---|---|
| **Frontend → FastAPI → Storage** (proxy) | HIGHLY_SENSITIVE, finanzas, identidad | el bytes nunca tocan URL firmada expuesta; máximo control, máximo coste de ancho de banda del API |
| **Frontend → signed upload → Storage** + `POST /confirm` | fotos de campo, audio, PDF grandes (volumen alto) | FastAPI emite upload intent + signed URL tras autorizar scope; el cliente sube directo; confirmación activa el objeto |

Regla: **la signed URL se emite solo tras autorización server-side por scope** — es un *permiso de una operación concreta*, no acceso al bucket. Uploads sensibles pasan por proxy o upload restringido con límites estrictos.

## 13. Upload multi-fase y estados

```text
1. INTENT   POST /storage/intents {nombre, mime, size, sha256, scope}
             → valida cuota (trigger existente como referencia), scope,
               MIME/size → devuelve object_id + signed_upload_url (TTL ⏸️)
2. UPLOAD   cliente → Storage (signed URL, content-hash binding si soporta)
3. CONFIRM  POST /storage/objects/{id}/confirm
             → server verifica existencia + size + sha256 en metadata
4. VERIFY   MIME real (magic bytes) + antivirus si aplica → VERIFIED
5. ACTIVATE → ACTIVE (visible según autorización)
   errores: EXPIRED, SIZE_MISMATCH, HASH_MISMATCH, MIME_MISMATCH,
            QUOTA_EXCEEDED, SCAN_FLAGGED → REJECTED/PURGED
```

Un objeto nunca se sirve antes de `VERIFIED` (o `ACTIVE`). Intents huérfanos expiran → purge job.

## 14. Integridad SHA-256 (y lo que NO es)

- **SHA-256** verifica *integridad* (el archivo no cambió) — cliente lo calcula, servidor lo re-verifica tras upload; también sirve de dedup exacto (`sha256` indexado).
- **NO demuestra** autenticidad/veracidad — la provenance (quién, cuándo, qué dispositivo, `policy_version`, `hash_transaccion` del dominio) la aportan los metadatos + auditoría; `hash_integridad` existente en trazabilidad se mantiene como sello de dominio, distinto del checksum del objeto.
- Autoridad documental (firma, sello QR) sigue siendo tema de dominio (M11 `hash_transaccion` UNIQUE), no de Storage.

## 15. Versionado e inmutabilidad

**Registros originales de campo = inmutables** (principio existente). Corrección → **nueva versión**, nunca sobrescritura:

```text
evidencia_v1 (ACTIVE, inmutable)
   ← supersedes_id ← evidencia_v2 (ACTIVE) — creada_por, razón, timestamp
```

`version`, `parent_object_id`, `supersedes_id`, `supersede_reason`. La consulta "actual" resuelve la última versión ACTIVE; históricas quedan accesibles con auditoría.

## 16. Borrado y retención

| Acción | Diseño |
|---|---|
| Soft delete | `SOFT_DELETED` + `deleted_at` — normal, reversible, auditado |
| Legal hold | `legal_hold=TRUE` bloquea purge — evidencias/financiero/legal |
| Retención por clase | `retention_until` (§5) — generaliza el worker actual de 15 días |
| Purge | físico tras retención+hold check — evento auditado irreversible |
| Restore | desde SOFT_DELETED dentro de ventana ⏸️ |

Evidencias auditables y documentos de custodia (M11): **soft delete + legal_hold por defecto** — nunca purge automático.

## 17. Offline capture → outbox de archivos (integración F7a)

```text
CAPTURA OFFLINE → objeto local (IndexedDB/FS) + hash local + metadata
   → OUTBOX entry (op_id UUID = idempotency key, policy_version)
   → al reconectar: INTENT → UPLOAD → CONFIRM → VERIFY → ACTIVE
        · dedup por sha256: si el objeto ya existe remoto → la
          operación converge, no duplica
        · rechazo por autorización → REJECTED + motivo (regla F7a §19)
```

El archivo **es válido localmente** durante offline — la validez remota se confirma al sincronizar. Rechazo por cuota/permiso ≠ pérdida: queda local + notificación.

## 18. Idempotencia vs deduplicación

- **Idempotencia** (`op_id`/upload intent): el retry de la MISMA subida converge — timeout/red no duplica.
- **Dedup** (`sha256` UNIQUE lógico por owner+scope): el MISMO contenido no crea objeto nuevo — apunta al existente.
- Distintos y complementarios; `hash_transaccion` existente cubre dedup de *negocio* (transacción), el `sha256` cubre dedup de *contenido*.

## 19. Archivos grandes e imágenes

| Aspecto | Diseño |
|---|---|
| Multipart/resumable | para video/audio/PDF grandes — ⏸️ soporte del proveedor I0; límite y umbral ⏸️ |
| Compresión campo | foto ≤150KB ya es convención existente (`registros_campo`) — thumbnail/preview separados del **original intacto** cuando es evidencia |
| EXIF | se conserva en el ORIGINAL si es evidencia (GPS puede ser parte de la prueba); thumbnail/preview público **sin EXIF** — metadata técnica vs metadata de evidencia separadas |
| Almacenamiento local temporal | objeto local con TTL+purge tras upload verificado (espacio del dispositivo) |
| ZIP/traversal | ver §24 threat J/K |

## 20. Documentos sensibles

Identidad/contratos/financiero/clínico/legal → `docs-sens` + HIGHLY_SENSITIVE + proxy o upload restringido + descarga auditada + sin preview público + legal_hold. No comparten reglas con imágenes públicas — política por sensibilidad, no por tipo de archivo.

## 21. Multi-tenancy e IDOR

Key no predecible + autorización por scope en cada acceso (nunca por URL) + signed URL de una operación concreta + RLS sobre `storage.objects` + `storage_objects` con `owner_subject`/`scope`. Cambiar un dígito/URL no revela nada: la key no existe en el espacio adivinable y el check de scope falla. Regla: **ninguna respuesta 404/403 filtra existencia** — mismo principio anti-oráculo del login.

## 22. Auditoría de eventos

`storage_audit`: `UPLOAD_INTENT_CREATED · UPLOAD_STARTED · UPLOAD_COMPLETED · UPLOAD_VERIFIED · DOWNLOAD_REQUESTED · DOWNLOAD_GRANTED · DOWNLOAD_DENIED · VERSION_CREATED · DELETE_REQUESTED · DELETE_COMPLETED · RESTORE · PURGE · SIGNED_URL_ISSUED`. Actores: `usuarios.id` + `session_id` (F7a). Inmutable, append-only.

## 23. Threat model Storage

| # | Amenaza | Impacto | Mitigación | Residual |
|---|---|---|---|---|
| A | signed URL filtrada | lectura hasta exp | TTL corto ⏸️ + un-uso opcional + scope check previo | ventana del TTL |
| B | key predecible | enumeración | UUID+shard (§7) | nulo |
| C | IDOR | acceso cruzado | scope check por objeto, no por key | nulo si siempre se chequea |
| D/E | acceso cruzado usuario/proyecto | fuga tenant | `resolver_permiso` por scope + RLS | bugs de policy — tests obligatorios |
| F | bucket público accidental | fuga masiva | separación por sensibilidad (§9): SENSITIVE nunca en bucket público | misconfig inicial — revisión I0 |
| G | MIME spoofing | servir ejecutable como imagen | magic bytes + ext forzada por MIME real + `Content-Type`/`nosniff` | contenido lícito-daños-UX |
| H/T | archivo malicioso/malware | distribución | validación §24 + scan ⏸️ + no-ejecución (solo descarga) | AV como capa futura |
| I/S | archivo gigante/exhaustion | coste/DoS | límites en intent + cuota por plan (trigger existente se generaliza) | bypass de cuota offline → revalidado |
| J | ZIP bomb | DoS descompresión | no descomprimir server-side; límite de ratio si se procesa | — |
| K | path traversal | escritura fuera de storage | key generada server-side; nunca path del cliente (worker actual ya valida `relative_to`) | nulo |
| L | upload duplicado | cuota/espacio | idempotencia `op_id` + dedup sha256 | colisión teórica |
| M | checksum falso | integridad rota | servidor re-calcula tras upload | — |
| N | eliminación no autorizada | pérdida | soft-delete + legal_hold + purge auditado | purge erróneo → backup §26 |
| O | EXIF expuesto | fuga GPS/PII | preview/thumbnail sin EXIF; original conserva solo si evidencia | original con GPS = por diseño |
| P | fuga docs sensibles | HIGHLY | sens-bucket + proxy + TTL corto + descarga auditada | insider con acceso legítimo |
| Q | signed URL larga TTL | acceso prolongado | TTL PENDIENTE, corto por defecto | — |
| R | acceso post-revocación | uso de URL viva | TTL corto; revocación de objeto invalida emisiones futuras | URLs ya emitidas hasta exp |

## 24. Validación de archivos (diseño, sin herramientas)

`intent`: extensión permitida por clase · MIME declarado · tamaño ≤ límite por clase/plan. `confirm`: existencia + size + sha256. `verify`: magic bytes = MIME declarado · ext normalizada al real · AV/malware scan **fase posterior** (dependencia, no hoy). Nunca confiar en `Content-Type` del cliente ni en el nombre.

## 25. Costos y escalabilidad

Separación ya decidida por arquitectura: **API (FastAPI) ≠ Storage ≠ CDN/delivery ≠ processing**. El servidor FastAPI jamás es el repositorio de objetos a escala (proxy solo para HIGHLY_SENSITIVE puntuales). Millones de fotos/video/satélite/drone → object storage + CDN para PUBLIC/thumbnail; cuotas por plan (trigger existente) = control de coste por usuario ya anclado a suscripción.

## 26. Backup y recuperación

```text
PostgreSQL backup   ≠   Object Storage backup
  pg_dump/restore         versioning + replicación del bucket
  (metadata, punteros)    (objetos; checksum verifica restore)
```

Restore coherente = metadata + objetos + verificación `sha256` post-restore. ⏸️ estrategia de DR por proveedor — I0.

## 27. Portabilidad — `StorageProvider` (abstracción conceptual)

```text
interfaz de dominio (sin implementar):
 create_upload_intent · upload · confirm · download
 delete · copy · move · get_metadata · generate_signed_url
```

El dominio MELANTIA solo conoce la interfaz; `supabase`/`s3`/`fs-local` son adaptadores. El `fs` actual pasa a ser un adaptador más — permite migración incremental y tests offline del backend.

## 28. Relación con el dominio

**M11 (evidencias_documentos):** `evidencia_id` (dominio) ↔ `storage_object_id` (objeto) — **1:N** (original + thumbnail + versiones). Los `url_foto_*` actuales se migrarían a `storage_objects` referenciados (migración futura, ⏸️). `hash_transaccion` UNIQUE se conserva como sello de transacción.

**Trazabilidad:** finca→lote→actividad→evidencia→documento→objeto vive en PostgreSQL (`domain_ref`); Storage solo guarda bytes. `hash_integridad` de dominio ≠ checksum de objeto — ambos se mantienen.

**Auth/F7a:** signed URL = permiso puntual tras autorización, **no** autorización permanente; respetan snapshot/`policy_version` solo para UX offline — al descargar/subir siempre pasa por el servidor (u RLS) con estado real. Descargas de SENSITIVE+ = REQUIERE_ONLINE implícito (signed URL necesita red).

## 29. Decisiones pendientes

| Decisión | Opciones | Recomendación | Estado |
|---|---|---|---|
| Proveedor | Supabase / S3-compat / otro | Supabase tras `StorageProvider` | ⏸️ tras I0 |
| Buckets | 1 / N por sensibilidad | 3–4 por sensibilidad | ⏸️ diseñado, aprobar |
| Sensibilidad | 4 niveles | PUBLIC/PRIVATE/SENSITIVE/HIGHLY | ✅ diseñado |
| TTL signed download | minutos | corto (minutos, ~15-60) | ⏸️ |
| TTL signed upload | minutos–horas | corto + un-uso | ⏸️ |
| Tamaño máx/clase | por clase+plan | foto campo ≤150KB heredado; resto ⏸️ | ⏸️ |
| Multipart/resumable | proveedor I0 | sí para >umbral | ⏸️ I0 |
| Antivirus | ninguno/propuesta/integración | fase posterior | ⏸️ |
| Thumbnails | cliente/server/edge | cliente al capturar + server para públicos | ⏸️ |
| EXIF | strip siempre/selectivo | strip solo en derivados; original evidencia conserva | ✅ diseñado |
| Retención por clase | tabla §5 | adoptar + legal_hold | ⏸️ valores |
| Versionado | sobrescribir/versiones | versiones siempre (inmutable) | ✅ diseñado |
| Backup objetos | versioning/replicación | ambos, por proveedor | ⏸️ I0 |
| Cifrado adicional | server-side/app-level | solo HIGHLY_SENSITIVE | ⏸️ |
| CDN | ninguno/Supabase-CDN/externo | para PUBLIC | ⏸️ |
| Región/latencia | verificar proyecto | LatAm-más-cercano disponible | ⏸️ I0 |

## 30. Dependencias I0 Storage (verificación futura — NO ejecutar)

Storage habilitado en el proyecto · creación de buckets · `storage.objects`+RLS real · signed upload/download URLs y TTLs · soporte TUS/multipart · límite nativo de tamaño · comportamiento delete/versionado · API admin de storage · acceso post-revocación de sesión · endpoint/patrones de `auth.uid()` en policies con el puente.

## 31. Criterios de aceptación (auto-check §38)

```text
[✓] separación PG/Storage/metadata/local/outbox (§3)
[✓] modelo lógico + metadata (§4) · object key (§7) · sensibilidad (§8)
[✓] público/privado (§8-9) · signed URLs (§11-12) · upload seguro (§12-13)
[✓] upload multi-fase (§13) · SHA-256 vs autenticidad (§14) · versionado (§15)
[✓] borrado/retención (§16) · offline capture + outbox (§17) · idempotencia (§18)
[✓] grandes/imágenes/EXIF (§19) · multi-tenant (§21) · auditoría (§22)
[✓] threat model A–T (§23) · validación (§24) · backup (§26) · portabilidad (§27)
[✓] M11 (§28) · trazabilidad (§28) · D4.2 (§6,11) · F7a (§17,28)
[✓] sin proveedor definitivo sin I0 · 0 código/DB/Supabase/.env/deps/git/movimientos
```

## 32. Próximo paso

```text
D5 diseñado → aprobación usuario → I0 (Auth + Storage, solo lectura del
proyecto lizqreiyysrqgkzyddff) → I1+ implementación controlada
```

---

**INTEGRIDAD D5:** documentos 14–17 intactos · único artefacto nuevo: este archivo · runtime/DB/Supabase/.env/tests/deps: 0 cambios · git: sin add/commit/push · archivos movidos/renombrados/eliminados: 0.
