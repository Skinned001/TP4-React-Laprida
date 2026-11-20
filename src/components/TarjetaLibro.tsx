import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  ejemplaresDisponibles: number;
  cantidadEspera: number;
  onPress: () => void;
};

export function TarjetaLibro({
  libro,
  ejemplaresDisponibles,
  cantidadEspera,
  onPress,
}: Props) {
  const hayDisponibles = ejemplaresDisponibles > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        estilos.tarjeta,
        pressed ? estilos.tarjetaPresionada : null,
      ]}
    >
      <View style={estilos.contenido}>
        <Text style={estilos.titulo} numberOfLines={2}>
          {libro.titulo}
        </Text>
        <Text style={estilos.autor}>
          {libro.autor} · {libro.anio}
        </Text>
      </View>
      <View style={estilos.pie}>
        <View
          style={[
            estilos.insignia,
            hayDisponibles ? estilos.insigniaDisponible : estilos.insigniaAgotado,
          ]}
        >
          <Text
            style={[
              estilos.textoInsignia,
              hayDisponibles ? estilos.textoDisponible : estilos.textoAgotado,
            ]}
          >
            {hayDisponibles
              ? `${ejemplaresDisponibles} disponibles`
              : 'Sin ejemplares'}
          </Text>
        </View>
        {cantidadEspera > 0 ? (
          <Text style={estilos.espera}>{cantidadEspera} en espera</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    minHeight: TAMANIOS.areaTactilMinima,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.sm,
  },
  tarjetaPresionada: {
    opacity: 0.85,
  },
  contenido: {
    gap: ESPACIADOS.xs,
  },
  titulo: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ESPACIADOS.xs,
  },
  insignia: {
    paddingHorizontal: ESPACIADOS.sm,
    paddingVertical: ESPACIADOS.xs,
    borderRadius: TAMANIOS.radioChico,
  },
  insigniaDisponible: {
    backgroundColor: COLORES.exitoFondo,
  },
  insigniaAgotado: {
    backgroundColor: COLORES.advertenciaFondo,
  },
  textoInsignia: {
    fontSize: TAMANIOS.chico,
    fontWeight: '600',
  },
  textoDisponible: {
    color: COLORES.exito,
  },
  textoAgotado: {
    color: COLORES.advertencia,
  },
  espera: {
    fontSize: TAMANIOS.chico,
    color: COLORES.textoSuave,
  },
});
