import { Stack } from 'expo-router';
import { BibliotecaProvider, useBiblioteca } from '@/context/BibliotecaContext';
import { COLORES } from '@/constants/tema';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NavegadorRaiz() {
  const { sesionPersonal } = useBiblioteca();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.superficie },
        headerTintColor: COLORES.texto,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORES.fondo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buscar" options={{ title: 'Buscar libros' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear ISBN' }} />
      <Stack.Screen
        name="reservar/[isbn]"
        options={{ presentation: 'modal', title: 'Confirmar reserva' }}
      />
      <Stack.Screen
        name="permisos/[recurso]"
        options={{ presentation: 'modal', title: 'Permiso necesario' }}
      />
      <Stack.Screen name="reserva" options={{ headerShown: false }} />
      <Stack.Protected guard={!sesionPersonal}>
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', title: 'Ingreso del personal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={sesionPersonal}>
        <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
      </Stack.Protected>
      <Stack.Screen
        name="+not-found"
        options={{ title: 'Página no encontrada' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <BibliotecaProvider>
      <NavegadorRaiz />
    </BibliotecaProvider>
  );
}
