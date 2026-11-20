import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '@/constants/tema';

export const unstable_settings = {
  anchor: '(catalogo)',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORES.primario,
        tabBarInactiveTintColor: COLORES.textoSuave,
        tabBarStyle: {
          backgroundColor: COLORES.superficie,
          borderTopColor: COLORES.borde,
        },
        headerStyle: { backgroundColor: COLORES.superficie },
        headerTintColor: COLORES.texto,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="book-outline"
              size={size}
              color={typeof color === 'string' ? color : COLORES.textoSuave}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmark-outline"
              size={size}
              color={typeof color === 'string' ? color : COLORES.textoSuave}
            />
          ),
        }}
      />
    </Tabs>
  );
}
