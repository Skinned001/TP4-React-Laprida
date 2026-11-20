import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  libros: Libro[];
  alSeleccionar: (isbn: string) => void;
};

export function BarraRecientes({ libros, alSeleccionar }: Props) {
  if (libros.length === 0) {
    return null;
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Vistos recientemente</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.lista}
      >
        {libros.map((libro) => (
          <Pressable
            key={libro.isbn}
            accessibilityRole="button"
            onPress={() => alSeleccionar(libro.isbn)}
            style={({ pressed }) => [
              estilos.tarjeta,
              pressed ? estilos.tarjetaPresionada : null,
            ]}
          >
            <Text style={estilos.tituloLibro} numberOfLines={2}>
              {libro.titulo}
            </Text>
            <Text style={estilos.autorLibro} numberOfLines={1}>
              {libro.autor}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIADOS.sm,
  },
  titulo: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '700',
    color: COLORES.textoSecundario,
  },
  lista: {
    gap: ESPACIADOS.sm,
  },
  tarjeta: {
    width: 170,
    minHeight: TAMANIOS.areaTactilMinima,
    backgroundColor: COLORES.primarioClaro,
    borderRadius: TAMANIOS.radio,
    padding: ESPACIADOS.md,
    justifyContent: 'space-between',
    gap: ESPACIADOS.xs,
  },
  tarjetaPresionada: {
    opacity: 0.85,
  },
  tituloLibro: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '700',
    color: COLORES.primario,
  },
  autorLibro: {
    fontSize: TAMANIOS.chico,
    color: COLORES.textoSecundario,
  },
});
