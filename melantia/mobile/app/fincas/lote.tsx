// Nuevo lote F1c — captura offline bajo una finca local.
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { abrirDb } from '../../services/db';
import { capturarLote } from '../../services/queue';

export default function NuevoLoteScreen() {
  const { fincaId } = useLocalSearchParams<{ fincaId: string }>();
  const [nombre, setNombre] = useState('');
  const [cultivo, setCultivo] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!fincaId) { setError('Falta la finca padre.'); return; }
    if (!nombre.trim()) { setError('El nombre del lote es obligatorio.'); return; }
    setError(null);
    setGuardando(true);
    try {
      const db = await abrirDb();
      await capturarLote(db, fincaId, {
        nombre_lote: nombre.trim(),
        cultivo_principal: cultivo || undefined,
        area_metros_cuadrados: area ? Number(area) : undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
      <Text className="text-2xl font-bold text-slate-800">Nuevo lote</Text>
      <Text className="mb-1 mt-6 text-sm font-semibold text-slate-600">
        Nombre del lote *
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Lote Norte"
      />
      <Text className="mb-1 mt-4 text-sm font-semibold text-slate-600">
        Cultivo principal (opcional)
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={cultivo}
        onChangeText={setCultivo}
        placeholder="Ej. Cacao"
      />
      <Text className="mb-1 mt-4 text-sm font-semibold text-slate-600">
        Área (m² — opcional)
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={area}
        onChangeText={setArea}
        keyboardType="decimal-pad"
        placeholder="24000"
      />
      {error && <Text className="mt-3 text-sm text-red-600">{error}</Text>}
      <TouchableOpacity
        className={`mt-8 items-center rounded-xl py-4 ${guardando ? 'bg-emerald-400' : 'bg-emerald-700'}`}
        onPress={guardar}
        disabled={guardando}>
        <Text className="text-base font-bold text-white">
          {guardando ? 'Guardando…' : 'Guardar lote'}
        </Text>
      </TouchableOpacity>
      <View className="h-10" />
    </ScrollView>
  );
}
