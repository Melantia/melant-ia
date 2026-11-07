// Identidad de dispositivo F1b — UUID persistente por instalación.
// Se envía en login; el backend lo reutiliza si es conocido del
// usuario o crea la fila `dispositivos` dentro del alta de sesión.
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const K_DEVICE = 'melantia.dispositivo_id';

export async function dispositivoId(): Promise<string> {
  let id = await SecureStore.getItemAsync(K_DEVICE);
  if (!id) {
    id = uuidv4();
    await SecureStore.setItemAsync(K_DEVICE, id);
  }
  return id;
}

export function dispositivoNombre(): string {
  const nombre = (Constants as any).deviceName as string | undefined;
  return nombre?.slice(0, 100) || 'dispositivo-movil';
}
