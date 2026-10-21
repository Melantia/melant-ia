# 03 — AUDITORÍA DE STORAGE Y EVIDENCIAS

## 3.1 Implementación histórica de Storage

Dos pipelines completos encontrados:

### A. `gestor_evidencia_fotos.js` (veterinario/trazabilidad) — el más completo (~2.9K líneas)

```text
captura (dataURL, comprimida webp)
   ↓
localStorage: inventario local + flags (sincronizado:false)
   ↓
sincronizarConSupabase(config)
   ├─ _leerConfigSupabase(): window.MELANTIA_SUPABASE_CONFIG
   │     o localStorage 'melantia_supabase_config' (url, anonKey, bucket, table)
   ├─ _crearRutaSupabase(): {pathPrefix}/{animal|lote}/{ts}.{ext}
   ├─ PUT {url}/storage/v1/object/{bucket}/{ruta}   (apikey+Bearer anon)
   ├─ publicUrl = {url}/storage/v1/object/public/{bucket}/{ruta}
   ├─ POST {url}/rest/v1/{table}   (metadata: id_animal, etapa, peso,
   │     id_lote, lat, lon, precision_gps, url_nube, mime_type)
   └─ purge local tras confirmación
```

Incluye además: QR generation, hash de seguridad, cláusula de trazabilidad, privacidad de ubicación (`_CLAVE_PRIVACIDAD_UBICACION`), reportes. **Clasificación**: funcionalidad + algoritmo + integración — el pipeline offline→Storage→metadata ya resuelto.

### B. `modulo11_logica.js` (evidencias M11)

```text
fotoBlob → comprimirImagen (≤500KB, ≤1280px, browser-image-compression)
   → supabase.storage.from('evidencias').upload()
   → supabase.from('evidencias').insert({finca_id, url, ...})
```

Más simple; sin cola offline ni purge.

### C. `servicios_financieros.js`

`storage.from(bucket).upload` de docs KYC + `.from('solicitudes_credito').insert` directo desde cliente.

### D. `asistente_visual.py`

Cola local de registros `sincronizado:false` → "listos para subir a Supabase" (pendiente, sin implementar el upload).

## 3.2 Infraestructura histórica preparada (sin desplegar)

`supabase_trazabilidad_fotos.sql` (en HEAD melant_ia y en `melantia/supabase/migrations/` untracked):

- Bucket `melantia-trazabilidad`: **público**, límite 5MB, MIME webp/jpeg/png
- Tabla `public.evidencia_fotos_nube`: `id_local, id_animal, etapa, fecha_toma, peso_estimado, id_lote, latitud, longitud, precision_gps_m, url_nube (UNIQUE), mime_type, timestamps`
- Trigger `set_updated_at`, índices por animal/lote/etapa
- RLS tabla: select/insert/update para `anon, authenticated` — **permisivo (`using true`)**
- RLS storage.objects: read/insert/update/delete limitadas a `bucket_id='melantia-trazabilidad'` para `anon, authenticated`
- Comentario propio: "estas políticas permiten operar con la anon key... Para multiusuario con auth real, endurecer por usuario/finca"

## 3.3 Estado actual (`evidencias_documentos`)

| Campo actual | Presente | Campo futuro conceptual | Presente |
|---|---|---|---|
| `id` UUID | ✓ | `id` | ✓ |
| `usuario_id` | ✓ | `usuario_id` | ✓ |
| `categoria_bien`, `nombre_documento` | ✓ | `tipo` | ~ (renombrar/mapear) |
| `monto_total`, `comision_app` (3%), `monto_liberado` | ✓ | — (campos de custodia, no de archivo) | — |
| `url_foto_evidencia_firmas`, `url_foto_soporte_legal` | ✓ | `storage_bucket`, `storage_path` | ✗ (solo URL opaca) |
| `estado_pago` ('En Custodia'→'Fondos Liberados'), `confirmacion_vendedor/comprador` | ✓ | `estado` (del archivo) | parcial |
| `hash_transaccion` (QR inmutable, UNIQUE) | ✓ | `hash_sha256` (del archivo) | ✗ semántica distinta |
| — | | `mime_type`, `tamaño` | ✗ |
| `created_at` | ✓ | timestamps | ✓ |

**Conclusión clave**: `evidencias_documentos` actual es un **registro de custodia/escrow comercial** (comisión 3%, doble confirmación, liberación de fondos — implementa la lógica `pasarela_garantia`), NO un almacén genérico de archivos. Los dos conceptos históricos distintos:

1. **Evidencia de archivo** (foto + metadata + hash + integridad) → `evidencia_fotos_nube` histórica.
2. **Custodia contractual** (documento + montos + confirmaciones) → `evidencias_documentos` actual.

Información que se perdería si solo se conserva el esquema actual: `id_animal`, `etapa`, `peso_estimado`, `id_lote`, `lat/long`, `precision_gps_m`, `mime_type`, `id_local` (vínculo offline), fecha de toma. Toda esa metadata agrícola/GPS existe en el modelo histórico y no tiene columna actual.

## 3.4 Offline-first + Storage

Existe históricamente (probado en `gestor_evidencia_fotos.js`):

```text
capturar sin internet → guardar en localStorage (inventario JSON)
   → marcar pendiente (sin flag explícita: presencia en inventario local)
   → sincronizarConSupabase() al recuperar conexión
   → subir blob → insertar metadata → purgar local tras confirmación
```

También `asistente_visual.py` (cola `sincronizado:false`) y `rastreo_trayecto` (cola propia JSON). Patrón consistente: **cola local → sync → confirmación → purge**.

Brechas del diseño histórico: sin reintentos exponenciales, sin hash de integridad verificado en subida (el hash existe pero para QR/trazabilidad, no para verificación del objeto en Storage), purge inmediato tras HTTP 200 (sin verificación de metadata confirmada).

## 3.5 Qué debe recuperarse del histórico

| Elemento | Recuperar | Adaptar |
|---|---|---|
| Compresión cliente (webp, ≤500KB/1280px) | Sí | Mantener en frontend |
| Cola offline + purge tras confirmación | Sí | Reintentos + hash verificado |
| Ruta `{prefix}/{entidad}/{ts}.ext` | Sí | `evidencias/{usuario|finca|lote}/{uuid}.webp` |
| Metadata agrícola (animal/etapa/peso/GPS) | Sí | Tabla propia o columnas en `evidencias_documentos` — decisión de esquema pendiente |
| Subida directa con anonKey desde cliente | **No** — viola API-first | FastAPI firma URLs o recibe el blob y sube con secret key |
| RLS permisivo `using(true)` | No | Reescribir por usuario (requiere Supabase Auth o service_role backend) |
| Tabla `evidencia_fotos_nube` | Referencia | Campos a absorber en `evidencias_documentos` o tabla hermana |
