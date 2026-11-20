import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  deshabilitado?: boolean;
};

export function BotonPrimario({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
}: Props) {
  const estiloFondo =
    variante === 'secundario'
      ? estilos.fondoSecundario
      : variante === 'peligro'
        ? estilos.fondoPeligro
        : estilos.fondoPrimario;

  const estiloTexto =
    variante === 'secundario' ? estilos.textoSecundario : estilos.textoClaro;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        estiloFondo,
        deshabilitado ? estilos.deshabilitado : null,
        pressed && !deshabilitado ? estilos.presionado : null,
      ]}
    >
      <Text style={[estilos.texto, estiloTexto]}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: TAMANIOS.areaTactilMinima,
    minWidth: TAMANIOS.areaTactilMinima,
    paddingHorizontal: ESPACIADOS.lg,
    paddingVertical: ESPACIADOS.md,
    borderRadius: TAMANIOS.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fondoPrimario: {
    backgroundColor: COLORES.primario,
  },
  fondoSecundario: {
    backgroundColor: COLORES.superficieSecundaria,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  fondoPeligro: {
    backgroundColor: COLORES.error,
  },
  deshabilitado: {
    opacity: 0.5,
  },
  presionado: {
    opacity: 0.85,
  },
  texto: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '600',
  },
  textoClaro: {
    color: COLORES.textoSobrePrimario,
  },
  textoSecundario: {
    color: COLORES.texto,
  },
});
