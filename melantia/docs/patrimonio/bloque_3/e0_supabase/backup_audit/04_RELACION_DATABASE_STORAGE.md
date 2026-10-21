# 04 — RELACIÓN ENTRE AMBOS BACKUPS

Comparación cruzada de `db_cluster-29-09-2026@17-17-59.backup.gz` y `upfwgaacznljbzmbgcul.storage.zip`.

---

## 4.1 Respuestas a las preguntas del encargo

| # | Pregunta | Respuesta verificada |
|---|---|---|
| 1 | ¿El backup de PostgreSQL contiene `storage.objects`? | **Sí, solo estructura.** `COPY storage.objects` existe con 14 columnas y **0 filas**. |
| 2 | ¿Contiene `storage.buckets`? | **Sí, solo estructura.** `COPY storage.buckets` con **0 filas** → ni siquiera existe el bucket por defecto ni buckets de aplicación (`evidencias`, etc.). |
| 3 | ¿El archivo `.storage` contiene los objetos físicos? | **No contiene nada** — ZIP con 0 entradas. |
| 4 | ¿Existe correspondencia entre `storage.objects`/`bucket_id`/`name` y rutas del `.zip`? | **No aplicable**: ambos lados están vacíos. No hay ni una fila de metadata ni un solo objeto físico entre los que buscar correspondencia. |
| 5 | ¿Puede reconstruirse la cadena `evidencias_documentos → storage_path → bucket → archivo físico`? | **No.** La tabla `evidencias_documentos` **no existe** en el dump; no hay buckets; no hay objetos; no hay archivos. La cadena completa está ausente en el respaldo. |

## 4.2 Coherencia entre ambos artefactos

```text
DB dump:  storage.buckets   = 0 filas ─┐
          storage.objects   = 0 filas ─┼─→ STORAGE VACÍO (coherente)
ZIP:      entradas          = 0      ──┘
```

Los dos archivos se corroboran mutuamente: el Storage del proyecto `upfwgaacznljbzmbgcul` nunca llegó a contener datos al momento del snapshot (o fue vaciado antes).

## 4.3 Otras relaciones verificadas

- **`auth.users` (0 filas) ↔ `public.*` (0 filas):** aunque `perfiles_usuario` modela usuarios de negocio, **no tiene FK a `auth.users`**, por lo que la ausencia de usuarios Auth no invalida la estructura public — pero tampoco hay perfiles que preservar.
- **Columnas `*_url` en tablas public** (`pdf_denuncia_generada_url`, `archivo_url`, `foto_cedula_*_url`) existen como esquema para futuras referencias a Storage, pero todas las tablas están vacías → no hay URLs huérfanas que reconciliar.
- **`realtime.subscription` (0 filas)** y publicación `supabase_realtime` sin tablas → no había replicación realtime configurada sobre tablas public.
- El project-ref `upfwgaacznljbzmbgcul` aparece únicamente en el **nombre** del zip; el dump SQL no contiene referencias literales al project-ref (los dumps de datos no lo incrustan).

## 4.4 Conclusión

La relación DB↔Storage es **trivialmente consistente porque ambos lados están vacíos**. No existe dependencia de datos a preservar entre ellos. La única "relación" real es que ambos provienen del mismo proyecto y confirman que dicho proyecto estaba **provisionado pero sin uso productivo** al 29-09-2026.
