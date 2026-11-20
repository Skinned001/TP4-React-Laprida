import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje?: string;
};

export function EstadoCarga({ mensaje = 'Cargando...' }: Props) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
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
  texto: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
});
