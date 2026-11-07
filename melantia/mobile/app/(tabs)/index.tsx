// Dashboard F0 — bienvenida MELANTIA (placeholder offline-first).
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-slate-50 px-6 pt-10">
      <Text className="text-3xl font-bold text-emerald-800">MELANTIA</Text>
      <Text className="mt-2 text-base text-slate-600">
        Bienvenido. Tu finca, lotes y sincronización offline-first
        se habilitan aquí (F1).
      </Text>
      <TouchableOpacity
        className="mt-8 rounded-2xl bg-emerald-700 p-5 shadow-sm"
        onPress={() => router.push('/fincas')}>
        <Text className="text-lg font-bold text-white">Mis Fincas</Text>
        <Text className="mt-1 text-sm text-emerald-100">
          Registra fincas y lotes aunque no haya señal.
        </Text>
      </TouchableOpacity>
    </View>
  );
}
