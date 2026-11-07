// Mercado F0 — placeholder de ofertas (backend FASE pendiente).
import { FlatList, Text, View } from 'react-native';

const PLACEHOLDER: { id: string; titulo: string; precio: string }[] = [
  { id: '1', titulo: 'Finca ejemplo — Manabí', precio: 'USD 120.000' },
  { id: '2', titulo: 'Lote café robusta — 2,4 ha', precio: 'USD 8.500' },
  { id: '3', titulo: 'Tractor usado — John Deere', precio: 'USD 22.000' },
];

export default function OfertasScreen() {
  return (
    <View className="flex-1 bg-slate-50 px-4 pt-6">
      <Text className="px-2 text-2xl font-bold text-slate-800">
        Mercado
      </Text>
      <FlatList
        className="mt-4"
        data={PLACEHOLDER}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-xl bg-white p-4 shadow-sm">
            <Text className="text-base font-semibold text-slate-800">
              {item.titulo}
            </Text>
            <Text className="mt-1 text-sm text-emerald-700">
              {item.precio}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-slate-400">
            Sin ofertas aún.
          </Text>
        }
      />
    </View>
  );
}
