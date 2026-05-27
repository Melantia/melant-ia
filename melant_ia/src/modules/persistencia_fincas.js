// === Ejemplo de uso ===
// Alta de finca (offline primero)
// await guardarFincaLocal({ id: 'f1', nombre: 'Finca La Esperanza', sincronizada: false });

// Búsqueda combinada (offline+online)
// const resultados = await buscarFincas('esperanza');

// Sincronización manual (cuando hay internet)
// await sincronizarFincasConSupabase();
// await descargarFincasDeSupabase();
// === Sincronización con Supabase ===
// Sube fincas locales pendientes a Supabase
export async function sincronizarFincasConSupabase() {
  const fincas = await listarFincasLocales();
  for (const finca of fincas) {
    if (!finca.sincronizada) {
      // Intenta insertar en Supabase
      const { data, error } = await supabase.from('fincas').insert([finca]);
      if (!error) {
        finca.sincronizada = true;
        await guardarFincaLocal(finca);
      }
    }
  }
}

// Descarga fincas de Supabase y las guarda localmente
export async function descargarFincasDeSupabase() {
  const { data, error } = await supabase.from('fincas').select('*');
  if (data) {
    for (const finca of data) {
      await guardarFincaLocal({ ...finca, sincronizada: true });
    }
  }
}

// Búsqueda combinada: local primero, luego Supabase si hay conexión
export async function buscarFincas(query) {
  let resultados = await buscarFincasLocales(query);
  // Si hay internet, busca también en Supabase y fusiona resultados
  if (navigator.onLine) {
    const { data, error } = await supabase
      .from('fincas')
      .select('*')
      .ilike('nombre', `%${query}%`);
    if (data) {
      // Evita duplicados por id
      const idsLocales = new Set(resultados.map((f) => f.id));
      resultados = resultados.concat(data.filter((f) => !idsLocales.has(f.id)));
    }
  }
  return resultados;
}
// Dependencias necesarias para persistencia y sincronización MELANTIA
// 1. localForage: persistencia offline (IndexedDB, WebSQL, localStorage)
// 2. @supabase/supabase-js: cliente oficial para Supabase

// Instala con:
// npm install localforage @supabase/supabase-js

// Ejemplo de importación en tu JS principal:
import localforage from 'localforage';
import { createClient } from '@supabase/supabase-js';

// Configuración de localForage
localforage.config({
  name: 'melantia',
  storeName: 'fincas', // almacén para fincas
});

// Configuración de Supabase
const supabaseUrl = 'https://TU-PROYECTO.supabase.co';
const supabaseKey = 'TU-API-KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);

// === Persistencia Offline: Funciones básicas ===
export async function guardarFincaLocal(finca) {
  // Usa el id como clave
  await localforage.setItem(`finca_${finca.id}`, finca);
}

export async function obtenerFincaLocal(id) {
  return await localforage.getItem(`finca_${id}`);
}

export async function listarFincasLocales() {
  const fincas = [];
  await localforage.iterate((value, key) => {
    if (key.startsWith('finca_')) fincas.push(value);
  });
  return fincas;
}

export async function buscarFincasLocales(query) {
  const fincas = await listarFincasLocales();
  return fincas.filter(
    (f) => f.nombre && f.nombre.toLowerCase().includes(query.toLowerCase())
  );
}
