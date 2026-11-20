import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { EstadoVacio } from '@/components/EstadoVacio';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { usePermiso } from '@/hooks/usePermiso';

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function PantallaReservas() {
  const {
    prestamos,
    reservasEnEspera,
    avisos,
    devolverLibro,
    activarRecordatorio,
    desactivarRecordatorio,
    limpiarAviso,
  } = useBiblioteca();

  const { estado, concedido, bloqueado, pedirPermiso, actualizarEstado } =
    usePermiso('notificaciones');

  const [mensajePermiso, setMensajePermiso] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void actualizarEstado();
    }, [actualizarEstado]),
  );

  async function manejarCambioRecordatorio(isbn: string, activar: boolean) {
    setMensajePermiso(null);

    if (!activar) {
      await desactivarRecordatorio(isbn);
      return;
    }

    if (concedido) {
      await activarRecordatorio(isbn);
      return;
    }

    if (bloqueado) {
      setMensajePermiso(
        'Las notificaciones están bloqueadas en Ajustes. Podés habilitarlas para recibir el recordatorio a los 15 segundos.',
      );
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones' },
      });
      return;
    }

    const otorgado = await pedirPermiso();
    if (otorgado) {
      await activarRecordatorio(isbn);
    } else {
      setMensajePermiso(
        'No otorgaste permiso de notificaciones. Podés seguir usando la app y verás los avisos acá mismo.',
      );
    }
  }

  const textoEstadoNotificaciones =
    estado === 'cargando'
      ? 'Verificando...'
      : concedido
        ? 'Notificaciones permitidas'
        : bloqueado
          ? 'Notificaciones bloqueadas'
          : 'Notificaciones sin activar';

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <View style={estilos.bannerPermiso}>
        <Text style={estilos.etiquetaPermiso}>Estado de notificaciones:</Text>
        <Text
          style={[
            estilos.valorPermiso,
            concedido ? estilos.textoExito : estilos.textoAdvertencia,
          ]}
        >
          {textoEstadoNotificaciones}
        </Text>
      </View>

      {mensajePermiso ? (
        <View style={estilos.avisoLocal}>
          <Text style={estilos.textoAvisoLocal}>{mensajePermiso}</Text>
        </View>
      ) : null}

      {avisos.length > 0 ? (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Avisos de la biblioteca</Text>
          {avisos.map((aviso) => (
            <View key={aviso.id} style={estilos.tarjetaAviso}>
              <Text style={estilos.textoAviso}>{aviso.mensaje}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Descartar aviso"
                onPress={() => limpiarAviso(aviso.id)}
                style={estilos.botonDescartar}
              >
                <Text style={estilos.textoDescartar}>Entendido</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>Mis préstamos</Text>
        {prestamos.length === 0 ? (
          <EstadoVacio
            titulo="Sin préstamos activos"
            descripcion="Cuando reserves un libro con ejemplares disponibles aparecerá acá."
          />
        ) : (
          prestamos.map((prestamo) => (
            <View key={prestamo.isbn} style={estilos.tarjeta}>
              <Text style={estilos.tituloLibro}>{prestamo.titulo}</Text>
              <Text style={estilos.detalle}>
                Devolución: {formatearFecha(prestamo.fechaDevolucion)}
              </Text>

              <View style={estilos.filaInterruptor}>
                <View style={estilos.textoInterruptorContenedor}>
                  <Text style={estilos.etiquetaInterruptor}>Recordarme</Text>
                  <Text style={estilos.ayudaInterruptor}>
                    {prestamo.recordarme
                      ? 'Recordatorio programado en 15 segundos'
                      : 'Activá para recibir un recordatorio local'}
                  </Text>
                </View>
                <Switch
                  value={prestamo.recordarme}
                  onValueChange={(valor) => {
                    void manejarCambioRecordatorio(prestamo.isbn, valor);
                  }}
                  accessibilityLabel={`Recordarme devolver ${prestamo.titulo}`}
                />
              </View>

              <BotonPrimario
                titulo="Devolver"
                variante="secundario"
                onPress={() => {
                  void devolverLibro(prestamo.isbn);
                }}
              />
            </View>
          ))
        )}
      </View>

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>En lista de espera</Text>
        {reservasEnEspera.length === 0 ? (
          <EstadoVacio
            titulo="Sin reservas en espera"
            descripcion="Si reservás un libro sin ejemplares, vas a ver tu posición acá."
          />
        ) : (
          reservasEnEspera.map((reserva) => (
            <View key={reserva.isbn} style={estilos.tarjeta}>
              <Text style={estilos.tituloLibro}>{reserva.titulo}</Text>
              <Text style={estilos.detalle}>
                Tu posición en la fila: #{reserva.posicion}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.lg,
    paddingBottom: ESPACIADOS.xxl,
  },
  bannerPermiso: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaPermiso: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
  },
  valorPermiso: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '700',
  },
  textoExito: {
    color: COLORES.exito,
  },
  textoAdvertencia: {
    color: COLORES.advertencia,
  },
  avisoLocal: {
    backgroundColor: COLORES.advertenciaFondo,
    borderRadius: TAMANIOS.radio,
    padding: ESPACIADOS.md,
    borderWidth: 1,
    borderColor: COLORES.advertencia,
  },
  textoAvisoLocal: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.advertencia,
    fontWeight: '600',
  },
  seccion: {
    gap: ESPACIADOS.md,
  },
  tituloSeccion: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  tarjetaAviso: {
    backgroundColor: COLORES.primarioClaro,
    borderRadius: TAMANIOS.radio,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.sm,
  },
  textoAviso: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.primario,
    fontWeight: '600',
  },
  botonDescartar: {
    alignSelf: 'flex-end',
    minHeight: TAMANIOS.areaTactilMinima,
    minWidth: TAMANIOS.areaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: ESPACIADOS.sm,
  },
  textoDescartar: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '700',
    color: COLORES.primario,
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.md,
  },
  tituloLibro: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  detalle: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
  },
  filaInterruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ESPACIADOS.md,
    paddingVertical: ESPACIADOS.xs,
  },
  textoInterruptorContenedor: {
    flex: 1,
    gap: ESPACIADOS.xs,
  },
  etiquetaInterruptor: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '600',
    color: COLORES.texto,
  },
  ayudaInterruptor: {
    fontSize: TAMANIOS.chico,
    color: COLORES.textoSuave,
  },
});
