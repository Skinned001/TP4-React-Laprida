import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { LIBROS } from '@/data/libros';

function esIsbnValido(valor: string): boolean {
  return /^\d{13}$/.test(valor);
}

export default function PantallaDetalleLibro() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? (isbn[0] ?? '') : (isbn ?? '');

  const formatoValido = esIsbnValido(isbnNormalizado);
  const libro = formatoValido
    ? LIBROS.find((item) => item.isbn === isbnNormalizado)
    : undefined;

  const {
    registrarVisto,
    obtenerEjemplaresDisponibles,
    obtenerCantidadEspera,
    tieneLibroReservado,
  } = useBiblioteca();

  useEffect(() => {
    if (libro) {
      registrarVisto(libro);
    }
  }, [libro, registrarVisto]);

  if (!formatoValido || !libro) {
    return (
      <View style={estilos.contenedorError}>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <Text style={estilos.errorTitulo}>
          {formatoValido ? 'Libro no encontrado' : 'ISBN inválido'}
        </Text>
        <Text style={estilos.errorMensaje}>
          {formatoValido
            ? `No encontramos ningún libro con el ISBN ${isbnNormalizado} en el catálogo.`
            : 'El código ISBN debe tener exactamente 13 dígitos numéricos.'}
        </Text>
        <BotonPrimario
          titulo="Volver al catálogo"
          onPress={() => router.replace('/')}
        />
      </View>
    );
  }

  const disponibles = obtenerEjemplaresDisponibles(libro);
  const enEspera = obtenerCantidadEspera(libro.isbn);
  const yaReservado = tieneLibroReservado(libro.isbn);

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Stack.Screen options={{ title: libro.titulo }} />

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>Año de publicación</Text>
          <Text style={estilos.valor}>{libro.anio}</Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>ISBN</Text>
          <Text style={estilos.valor}>{libro.isbn}</Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>Ejemplares disponibles</Text>
          <Text
            style={[
              estilos.valor,
              disponibles > 0 ? estilos.textoExito : estilos.textoAdvertencia,
            ]}
          >
            {disponibles}
          </Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>Personas en lista de espera</Text>
          <Text style={estilos.valor}>{enEspera}</Text>
        </View>
      </View>

      {yaReservado ? (
        <View style={estilos.avisoReservado}>
          <Text style={estilos.textoAviso}>
            Ya tenés este libro en préstamo o en lista de espera.
          </Text>
          <BotonPrimario
            titulo="Ver en Mis reservas"
            variante="secundario"
            onPress={() => router.push('/reservas')}
          />
        </View>
      ) : (
        <BotonPrimario
          titulo="Reservar"
          onPress={() =>
            router.push({
              pathname: '/reservar/[isbn]',
              params: { isbn: libro.isbn },
            })
          }
        />
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.lg,
  },
  contenedorError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIADOS.xl,
    gap: ESPACIADOS.md,
  },
  errorTitulo: {
    fontSize: TAMANIOS.titulo,
    fontWeight: '700',
    color: COLORES.error,
    textAlign: 'center',
  },
  errorMensaje: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
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
    fontSize: TAMANIOS.subtitulo,
    color: COLORES.textoSecundario,
    marginBottom: ESPACIADOS.xs,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ESPACIADOS.sm,
    borderTopWidth: 1,
    borderTopColor: COLORES.superficieSecundaria,
  },
  etiqueta: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
  },
  valor: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  textoExito: {
    color: COLORES.exito,
  },
  textoAdvertencia: {
    color: COLORES.advertencia,
  },
  avisoReservado: {
    backgroundColor: COLORES.primarioClaro,
    borderRadius: TAMANIOS.radio,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.md,
  },
  textoAviso: {
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.primario,
    fontWeight: '600',
    textAlign: 'center',
  },
});
