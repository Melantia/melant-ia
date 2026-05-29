// supabase_config.js
// Configuración segura para MELANTIA (solo clave anon)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'TU_URL_SUPABASE_AQUI'; // Reemplaza por tu URL real
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_AQUI'; // Solo la clave anon, nunca la service_role

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
