import { Pressable, StyleSheet, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

function BotonPersonalHeader() {
  const { sesionPersonal } = useBiblioteca();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        sesionPersonal ? 'Ir al mostrador del personal' : 'Ingreso del personal'
      }
      onPress={() => router.push(sesionPersonal ? '/mostrador' : '/login')}
      style={({ pressed }) => [
        estilos.botonHeader,
        pressed ? estilos.presionado : null,
      ]}
    >
      <Text style={estilos.textoBotonHeader}>Personal</Text>
    </Pressable>
  );
}

export default function CatalogoStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.superficie },
        headerTintColor: COLORES.texto,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORES.fondo },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Catálogo',
          headerRight: () => <BotonPersonalHeader />,
        }}
      />
      <Stack.Screen
        name="libro/[isbn]"
        options={{
          title: 'Detalle del libro',
        }}
      />
    </Stack>
  );
}

const estilos = StyleSheet.create({
  botonHeader: {
    minWidth: TAMANIOS.areaTactilMinima,
    minHeight: TAMANIOS.areaTactilMinima,
    paddingHorizontal: ESPACIADOS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.7,
  },
  textoBotonHeader: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '600',
    color: COLORES.primario,
  },
});
