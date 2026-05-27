# Instrucciones para uso offline de visión artificial en MELANTIA

## 1. Descargar ml5.js (versión minificada)

- Ve a: https://github.com/ml5js/ml5-library/releases
- Descarga el archivo `ml5.min.js` de la última versión estable.
- Colócalo en: `assets/ui/ml5.min.js`

## 2. Descargar el modelo COCO-SSD para ml5.js

- Ve a: https://github.com/ml5js/ml5-data-and-models/tree/main/models/coco-ssd
- Descarga la carpeta completa `coco-ssd` (debe contener `model.json` y archivos binarios `.bin`).
- Coloca la carpeta en: `assets/ui/models/coco-ssd/`
  - Ejemplo de estructura:
    - `assets/ui/models/coco-ssd/model.json`
    - `assets/ui/models/coco-ssd/group1-shard1of1.bin`

## 3. Integrar en tu proyecto

- En tu `index.html` (o el HTML principal de la app), antes de tus scripts, agrega:

```html
<script src="/assets/ui/ml5.min.js"></script>
```

- El código de integración ya está listo en `asistencia_tecnica_rural.js`.
- El modelo se cargará automáticamente offline desde la ruta local.

## 4. Uso

- Al abrir el módulo Asistente Técnico Rural, podrás subir una foto y el sistema detectará vacas, plátanos, etc., sin conexión a internet.

---

**Notas:**

- Si usas rutas relativas, asegúrate que la estructura de carpetas sea exactamente como se indica.
- Si tienes problemas de CORS en local, usa Live Server o un servidor local que permita cargar archivos estáticos.
- Puedes agregar más modelos siguiendo el mismo patrón.
