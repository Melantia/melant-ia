// Configuración de Supabase para Comunidad Virtual MELANTIA
// Reemplaza los valores con los de tu proyecto Supabase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://TU_SUPABASE_URL.supabase.co';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
