// Nueva finca F1c — captura offline: entidad + op en una transacción.
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { abrirDb } from '../../services/db';
import { capturarFinca } from '../../services/queue';

export default function NuevaFincaScreen() {
  const [nombre, setNombre] = useState('');
  const [parroquiaId, setParroquiaId] = useState('');
  const [gps, setGps] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const db = await abrirDb();
      await capturarFinca(db, {
        nombre: nombre.trim(),
        parroquia_id: parroquiaId ? Number(parroquiaId) : undefined,
        coordenadas_gps: gps || undefined,
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
      <Text className="text-2xl font-bold text-slate-800">Nueva finca</Text>
      <Text className="mt-1 mb-6 text-sm text-slate-500">
        Se guarda en el dispositivo y se sincroniza al recuperar señal.
      </Text>
      <Text className="mb-1 text-sm font-semibold text-slate-600">
        Nombre de la finca *
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. La Esperanza"
      />
      <Text className="mb-1 mt-4 text-sm font-semibold text-slate-600">
        Parroquia (ID — opcional)
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={parroquiaId}
        onChangeText={setParroquiaId}
        keyboardType="number-pad"
        placeholder="ID del catálogo DPA"
      />
      <Text className="mb-1 mt-4 text-sm font-semibold text-slate-600">
        Coordenadas GPS (opcional)
      </Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        value={gps}
        onChangeText={setGps}
        placeholder="-1.2345,-80.5678"
      />
      {error && <Text className="mt-3 text-sm text-red-600">{error}</Text>}
      <TouchableOpacity
        className={`mt-8 items-center rounded-xl py-4 ${guardando ? 'bg-emerald-400' : 'bg-emerald-700'}`}
        onPress={guardar}
        disabled={guardando}>
        <Text className="text-base font-bold text-white">
          {guardando ? 'Guardando…' : 'Guardar finca'}
        </Text>
      </TouchableOpacity>
      <View className="h-10" />
    </ScrollView>
  );
}
