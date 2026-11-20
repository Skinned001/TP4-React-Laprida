import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';

export default function PantallaLogin() {
  const { iniciarSesion } = useBiblioteca();

  const [usuario, setUsuario] = useState<string>('');
  const [clave, setClave] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function manejarIngreso() {
    if (usuario.trim().length === 0 || clave.length === 0) {
      setError('Completá tu usuario y clave para ingresar.');
      return;
    }

    const ok = iniciarSesion(usuario, clave);
    if (!ok) {
      setError(
        'Usuario o clave incorrectos. Verificá los datos e intentá nuevamente.',
      );
      return;
    }

    setError(null);
    router.replace('/mostrador');
  }

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Acceso para personal</Text>
        <Text style={estilos.subtitulo}>
          Ingresá con tu cuenta de biblioteca para gestionar las entregas del
          mostrador.
        </Text>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Usuario</Text>
          <TextInput
            value={usuario}
            onChangeText={setUsuario}
            placeholder="bibliotecario"
            placeholderTextColor={COLORES.textoSuave}
            autoCapitalize="none"
            autoCorrect={false}
            style={estilos.entrada}
            accessibilityLabel="Nombre de usuario del personal"
          />
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Clave</Text>
          <TextInput
            value={clave}
            onChangeText={setClave}
            placeholder="Ingresá tu clave"
            placeholderTextColor={COLORES.textoSuave}
            secureTextEntry
            style={estilos.entrada}
            accessibilityLabel="Clave de acceso del personal"
          />
        </View>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <Text style={estilos.ayuda}>
          Credenciales de prueba: bibliotecario / ipf2026
        </Text>
      </View>

      <View style={estilos.acciones}>
        <BotonPrimario titulo="Ingresar" onPress={manejarIngreso} />
        <BotonPrimario
          titulo="Cancelar"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.lg,
    justifyContent: 'space-between',
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.md,
  },
  titulo: {
    fontSize: TAMANIOS.titulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  subtitulo: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
    lineHeight: 20,
  },
  campo: {
    gap: ESPACIADOS.xs,
  },
  etiqueta: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '600',
    color: COLORES.texto,
  },
  entrada: {
    minHeight: TAMANIOS.areaTactilMinima,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: TAMANIOS.radioChico,
    paddingHorizontal: ESPACIADOS.md,
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
  },
  error: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.error,
    fontWeight: '600',
  },
  ayuda: {
    fontSize: TAMANIOS.chico,
    color: COLORES.textoSuave,
  },
  acciones: {
    gap: ESPACIADOS.md,
    paddingBottom: ESPACIADOS.lg,
  },
});
