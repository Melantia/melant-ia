// Pantalla de login F1b — cédula/RUC + password → POST /api/auth/login.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { entrar } = useAuth();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const submit = async () => {
    setError(null);
    setCargando(true);
    try {
      await entrar(cedula.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 justify-center px-8"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text className="text-4xl font-bold text-emerald-800">MELANTIA</Text>
      <Text className="mt-1 mb-8 text-base text-slate-500">
        Tu finca en la mano, incluso sin señal.
      </Text>
      <Text className="mb-1 text-sm font-semibold text-slate-600">Cédula o RUC</Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
        value={cedula}
        onChangeText={setCedula}
        autoCapitalize="none"
        keyboardType="number-pad"
        placeholder="0912345678"
      />
      <Text className="mb-1 mt-4 text-sm font-semibold text-slate-600">Contraseña</Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      {error && <Text className="mt-3 text-sm text-red-600">{error}</Text>}
      <TouchableOpacity
        className={`mt-6 items-center rounded-xl py-4 ${cargando ? 'bg-emerald-400' : 'bg-emerald-700'}`}
        onPress={submit}
        disabled={cargando || !cedula || !password}>
        <Text className="text-base font-bold text-white">
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </Text>
      </TouchableOpacity>
      <Text className="mt-6 text-center text-xs text-slate-400">
        El dispositivo queda registrado en tu cuenta al ingresar.
      </Text>
    </KeyboardAvoidingView>
  );
}
