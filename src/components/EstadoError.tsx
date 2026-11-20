import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
  textoBoton?: string;
  alReintentar: () => void;
};

export function EstadoError({
  mensaje,
  textoBoton = 'Reintentar',
  alReintentar,
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Ocurrió un problema</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={alReintentar}
        style={({ pressed }) => [
          estilos.boton,
          pressed ? estilos.botonPresionado : null,
        ]}
      >
        <Text style={estilos.textoBoton}>{textoBoton}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIADOS.xl,
    gap: ESPACIADOS.md,
  },
  titulo: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.error,
  },
  mensaje: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  boton: {
    minHeight: TAMANIOS.areaTactilMinima,
    minWidth: TAMANIOS.areaTactilMinima,
    paddingHorizontal: ESPACIADOS.xl,
    paddingVertical: ESPACIADOS.md,
    borderRadius: TAMANIOS.radio,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBoton: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '600',
    color: COLORES.textoSobrePrimario,
  },
});
