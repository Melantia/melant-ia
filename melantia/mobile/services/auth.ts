// Autenticación F1b — POST /api/auth/login del backend MELANTIA.
// El backend: cédula→email sintético→GoTrue grant→sesión+dispositivo.
// Tokens + dispositivo_id en expo-secure-store — nunca en SQLite.
import * as SecureStore from 'expo-secure-store';
import { config } from './config';
import { dispositivoId, dispositivoNombre } from './dispositivo';

const K_ACCESS = 'melantia.access_token';
const K_REFRESH = 'melantia.refresh_token';
const K_USER = 'melantia.usuario_id';

export type Sesion = {
  accessToken: string;
  refreshToken: string;
  usuarioId: string;
  nombre: string;
  dispositivoId: string;
};

export async function login(cedulaRuc: string, password: string): Promise<Sesion> {
  const res = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cedula_ruc: cedulaRuc,
      password,
      dispositivo_id: await dispositivoId(),
      dispositivo_nombre: dispositivoNombre(),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Login falló (${res.status})`);
  }
  const data = await res.json();
  const sesion: Sesion = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    usuarioId: data.usuario_id,
    nombre: data.nombre,
    dispositivoId: data.dispositivo_id,
  };
  await SecureStore.setItemAsync(K_ACCESS, sesion.accessToken);
  await SecureStore.setItemAsync(K_REFRESH, sesion.refreshToken);
  await SecureStore.setItemAsync(K_USER, sesion.usuarioId);
  await SecureStore.setItemAsync('melantia.dispositivo_id', sesion.dispositivoId);
  return sesion;
}

export async function refresh(): Promise<Sesion | null> {
  const rt = await SecureStore.getItemAsync(K_REFRESH);
  if (!rt) return null;
  const res = await fetch(`${config.apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  await SecureStore.setItemAsync(K_ACCESS, data.access_token);
  await SecureStore.setItemAsync(K_REFRESH, data.refresh_token);
  const uid = (await SecureStore.getItemAsync(K_USER)) ?? '';
  const did = (await SecureStore.getItemAsync('melantia.dispositivo_id')) ?? '';
  return {
    accessToken: data.access_token, refreshToken: data.refresh_token,
    usuarioId: uid, nombre: '', dispositivoId: did,
  };
}

export async function sesionGuardada(): Promise<Sesion | null> {
  const [a, r, u, d] = await Promise.all([
    SecureStore.getItemAsync(K_ACCESS), SecureStore.getItemAsync(K_REFRESH),
    SecureStore.getItemAsync(K_USER), SecureStore.getItemAsync('melantia.dispositivo_id'),
  ]);
  return a && r && u && d ? { accessToken: a, refreshToken: r, usuarioId: u, nombre: '', dispositivoId: d } : null;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(K_ACCESS);
  await SecureStore.deleteItemAsync(K_REFRESH);
  await SecureStore.deleteItemAsync(K_USER);
}
