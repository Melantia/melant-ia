// indexeddb_sync.js
// Utilidades para sincronización offline de imágenes NDVI y reportes de carbono en MELANTIA
// Requiere la librería idb: https://cdn.jsdelivr.net/npm/idb@7/build/esm/index.min.js

export async function openMelantiaDB() {
  return await window.idb.openDB('melantia-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('ndvi')) {
        db.createObjectStore('ndvi', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('carbono')) {
        db.createObjectStore('carbono', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function guardarImagenNDVIenIndexedDB(
  potreroId,
  urlImagen,
  ndvi,
  fecha,
  tipoSensor
) {
  const db = await openMelantiaDB();
  await db.put('ndvi', {
    potreroId,
    urlImagen,
    ndvi,
    fecha,
    tipoSensor,
  });
  db.close();
}

export async function obtenerUltimaImagenNDVIoffline(potreroId) {
  const db = await openMelantiaDB();
  let result = null;
  let tx = db.transaction('ndvi', 'readonly');
  let store = tx.objectStore('ndvi');
  let all = await store.getAll();
  // Buscar la más reciente por fecha
  all = all.filter((x) => x.potreroId === potreroId);
  all.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (all.length > 0) result = all[0];
  db.close();
  return result;
}

export async function guardarCapturaCarbonoIndexedDB(
  cultivoId,
  biomasa,
  co2,
  metodo,
  fecha
) {
  const db = await openMelantiaDB();
  await db.put('carbono', {
    cultivoId,
    biomasa,
    co2,
    metodo,
    fecha,
  });
  db.close();
}

export async function obtenerUltimaCapturaCarbono(cultivoId) {
  const db = await openMelantiaDB();
  let result = null;
  let tx = db.transaction('carbono', 'readonly');
  let store = tx.objectStore('carbono');
  let all = await store.getAll();
  all = all.filter((x) => x.cultivoId === cultivoId);
  all.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (all.length > 0) result = all[0];
  db.close();
  return result;
}
