import { StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

export default function PantallaNoEncontrada() {
  const rutaActual = usePathname();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.codigo}>404</Text>
      <Text style={estilos.titulo}>Página no encontrada</Text>
      <Text style={estilos.mensaje}>
        La dirección{' '}
        <Text style={estilos.ruta}>{rutaActual}</Text> no existe en Biblioteca
        IPF.
      </Text>
      <BotonPrimario
        titulo="Volver al catálogo"
        onPress={() => router.replace('/')}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.xl,
    gap: ESPACIADOS.md,
  },
  codigo: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORES.primario,
  },
  titulo: {
    fontSize: TAMANIOS.titulo,
    fontWeight: '700',
    color: COLORES.texto,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
    marginBottom: ESPACIADOS.sm,
  },
  ruta: {
    fontWeight: '700',
    color: COLORES.texto,
  },
});
