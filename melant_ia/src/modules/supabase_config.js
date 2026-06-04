// supabase_config.js
// Configuración segura para MELANTIA (solo clave anon)

const SUPABASE_URL = 'https://upfwgaacznljbzmbgcul.supabase.co'; // URL real del proyecto
const SUPABASE_ANON_KEY = 'sb_publishable_5eG3wS3vXKAhvb7benRZEw_OjqwouvQ'; // Solo la clave anon, nunca la service_role

const tieneConfigValida =
  /^https?:\/\//i.test(SUPABASE_URL) &&
  !SUPABASE_URL.includes('TU_URL_SUPABASE_AQUI') &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('TU_CLAVE_ANON_AQUI');

let supabase = null;

if (tieneConfigValida) {
  let createClient = window?.supabase?.createClient;

  if (!createClient) {
    const mod =
      await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    createClient = mod.createClient;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { supabase, tieneConfigValida };
