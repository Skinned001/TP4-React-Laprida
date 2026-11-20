import { StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

type Props = {
  titulo: string;
  descripcion?: string;
};

export function EstadoVacio({ titulo, descripcion }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIADOS.xl,
    gap: ESPACIADOS.sm,
  },
  titulo: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '600',
    color: COLORES.texto,
    textAlign: 'center',
  },
  descripcion: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
});
