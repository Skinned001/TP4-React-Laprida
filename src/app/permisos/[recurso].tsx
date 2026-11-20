import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BotonPrimario } from '@/components/BotonPrimario';
import { EstadoCarga } from '@/components/EstadoCarga';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { usePermiso } from '@/hooks/usePermiso';
import type { RecursoPermiso } from '@/types';

const TEXTOS_BENEFICIO: Record<RecursoPermiso, string> = {
  camara:
    'Usamos tu cámara para escanear el código de barras de los libros y abrir su ficha al instante.',
  notificaciones:
    'Usamos tus notificaciones para avisarte cuándo devolver un libro o cuando llegue tu turno en la lista de espera.',
};

export default function PantallaPermisoPrevio() {
  const { recurso } = useLocalSearchParams<{ recurso?: string | string[] }>();
  const recursoTexto = Array.isArray(recurso)
    ? (recurso[0] ?? '')
    : (recurso ?? '');

  const recursoValido: RecursoPermiso =
    recursoTexto === 'notificaciones' ? 'notificaciones' : 'camara';

  const { estado, concedido, bloqueado, pedirPermiso, abrirAjustes } =
    usePermiso(recursoValido);

  useEffect(() => {
    if (concedido && router.canGoBack()) {
      router.back();
    }
  }, [concedido]);

  if (estado === 'cargando') {
    return <EstadoCarga mensaje="Verificando estado del permiso..." />;
  }

  async function manejarAccionPrincipal() {
    if (bloqueado) {
      await abrirAjustes();
      return;
    }

    const otorgado = await pedirPermiso();
    if (otorgado && router.canGoBack()) {
      router.back();
    }
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <View style={estilos.iconoContenedor}>
          <Ionicons
            name={
              recursoValido === 'camara'
                ? 'camera-outline'
                : 'notifications-outline'
            }
            size={48}
            color={COLORES.primario}
          />
        </View>
        <Text style={estilos.beneficio}>
          {TEXTOS_BENEFICIO[recursoValido]}
        </Text>
      </View>

      <BotonPrimario
        titulo={bloqueado ? 'Abrir Ajustes' : 'Continuar'}
        onPress={() => {
          void manejarAccionPrincipal();
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.xl,
    justifyContent: 'space-between',
  },
  tarjeta: {
    marginTop: ESPACIADOS.xl,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.xl,
    alignItems: 'center',
    gap: ESPACIADOS.lg,
  },
  iconoContenedor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORES.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficio: {
    fontSize: TAMANIOS.subtitulo,
    color: COLORES.texto,
    textAlign: 'center',
    lineHeight: 26,
  },
});
