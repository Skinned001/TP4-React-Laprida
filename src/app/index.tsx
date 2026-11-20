import { StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

export default function PantallaInicial() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Biblioteca IPF</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.lg,
  },
  titulo: {
    fontSize: TAMANIOS.titulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
});
