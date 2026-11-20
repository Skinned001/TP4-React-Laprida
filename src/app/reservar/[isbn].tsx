import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { LIBROS } from '@/data/libros';

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function PantallaReservar() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? (isbn[0] ?? '') : (isbn ?? '');

  const libro = /^\d{13}$/.test(isbnNormalizado)
    ? LIBROS.find((item) => item.isbn === isbnNormalizado)
    : undefined;

  const {
    obtenerEjemplaresDisponibles,
    obtenerCantidadEspera,
    tieneLibroReservado,
    reservarLibro,
  } = useBiblioteca();

  const [mensajeError, setMensajeError] = useState<string | null>(null);

  if (!libro) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.tituloError}>Libro no disponible</Text>
        <Text style={estilos.descripcion}>
          No encontramos el libro solicitado en el catálogo.
        </Text>
        <BotonPrimario
          titulo="Cerrar"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const disponibles = obtenerEjemplaresDisponibles(libro);
  const enEspera = obtenerCantidadEspera(libro.isbn);
  const yaReservado = tieneLibroReservado(libro.isbn);

  const fechaEstimada = new Date();
  fechaEstimada.setDate(fechaEstimada.getDate() + 7);
  const fechaTexto = formatearFecha(fechaEstimada.toISOString());

  function confirmarReserva() {
    if (!libro) {
      return;
    }

    const resultado = reservarLibro(libro);
    if (resultado.tipo === 'ya_reservado') {
      setMensajeError(
        'Ya tenés este libro en préstamo o en la lista de espera.',
      );
      return;
    }

    if (router.canDismiss()) {
      router.dismiss();
    }
    router.navigate('/reservas');
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        {yaReservado ? (
          <View style={estilos.bloqueAdvertencia}>
            <Text style={estilos.textoAdvertencia}>
              Ya tenés una reserva o préstamo activo para este libro.
            </Text>
          </View>
        ) : disponibles > 0 ? (
          <View style={estilos.bloqueExito}>
            <Text style={estilos.subtituloEstado}>Préstamo inmediato</Text>
            <Text style={estilos.descripcion}>
              Hay {disponibles} ejemplares disponibles. Si confirmás, el préstamo
              será por 7 días (devolución estimada: {fechaTexto}).
            </Text>
          </View>
        ) : (
          <View style={estilos.bloqueAdvertencia}>
            <Text style={estilos.subtituloEstado}>Ingreso a lista de espera</Text>
            <Text style={estilos.descripcion}>
              No quedan ejemplares en el estante. Ingresarás en la posición{' '}
              <Text style={estilos.negrita}>#{enEspera + 1}</Text> de la lista
              de espera.
            </Text>
          </View>
        )}

        {mensajeError ? (
          <Text style={estilos.textoError}>{mensajeError}</Text>
        ) : null}
      </View>

      <View style={estilos.acciones}>
        {!yaReservado ? (
          <BotonPrimario
            titulo={
              disponibles > 0 ? 'Confirmar préstamo' : 'Confirmar lista de espera'
            }
            onPress={confirmarReserva}
          />
        ) : null}
        <BotonPrimario
          titulo="Cancelar"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.lg,
    justifyContent: 'space-between',
    gap: ESPACIADOS.lg,
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.md,
  },
  titulo: {
    fontSize: TAMANIOS.titulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.textoSecundario,
  },
  bloqueExito: {
    backgroundColor: COLORES.exitoFondo,
    borderRadius: TAMANIOS.radioChico,
    padding: ESPACIADOS.md,
    gap: ESPACIADOS.xs,
  },
  bloqueAdvertencia: {
    backgroundColor: COLORES.advertenciaFondo,
    borderRadius: TAMANIOS.radioChico,
    padding: ESPACIADOS.md,
    gap: ESPACIADOS.xs,
  },
  subtituloEstado: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  descripcion: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
    lineHeight: 20,
  },
  negrita: {
    fontWeight: '700',
    color: COLORES.texto,
  },
  textoAdvertencia: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '600',
    color: COLORES.advertencia,
  },
  tituloError: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.error,
  },
  textoError: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.error,
    fontWeight: '600',
  },
  acciones: {
    gap: ESPACIADOS.md,
    paddingBottom: ESPACIADOS.lg,
  },
});
