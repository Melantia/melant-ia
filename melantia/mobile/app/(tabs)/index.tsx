// Dashboard F0 — bienvenida MELANTIA (placeholder offline-first).
import { Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-slate-50 px-6 pt-10">
      <Text className="text-3xl font-bold text-emerald-800">MELANTIA</Text>
      <Text className="mt-2 text-base text-slate-600">
        Bienvenido. Tu finca, lotes y sincronización offline-first
        se habilitan aquí (F1).
      </Text>
      <View className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-sm font-semibold text-slate-500">
          ESTADO DE SINCRONIZACIÓN
        </Text>
        <Text className="mt-2 text-lg text-slate-800">
          Cola offline: 0 operaciones pendientes
        </Text>
      </View>
    </View>
  );
}
