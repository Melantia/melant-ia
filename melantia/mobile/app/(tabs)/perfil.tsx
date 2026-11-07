// Perfil F0 — usuario de prueba + placeholder de dispositivo.
import { Text, View } from 'react-native';

export default function PerfilScreen() {
  return (
    <View className="flex-1 bg-slate-50 px-6 pt-10">
      <Text className="text-2xl font-bold text-slate-800">Perfil</Text>
      <View className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-base font-semibold text-slate-700">
          Usuario de prueba
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          productor@melantia.ec
        </Text>
        <Text className="mt-4 text-xs text-slate-400">
          Dispositivo y sesión se registran en F1 (sync_queue +
          identidad). Backend: POST /api/v1/sync/push + pull ya
          operativos.
        </Text>
      </View>
    </View>
  );
}
