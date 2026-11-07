// Config por entorno — nunca hardcodear URLs ni claves.
// Variables EXPO_PUBLIC_* leídas desde .env / entorno del build.
// Backend: `adb reverse tcp:8000 tcp:8000` o IP de red local.
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};
