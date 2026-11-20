import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarraRecientes } from '@/components/BarraRecientes';
import { EstadoCarga } from '@/components/EstadoCarga';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { useLibros } from '@/hooks/useLibros';

export default function PantallaCatalogo() {
  const { libros, cargando, error, reintentar } = useLibros();
  const {
    ultimosTresVistos,
    obtenerEjemplaresDisponibles,
    obtenerCantidadEspera,
  } = useBiblioteca();

  if (cargando) {
    return <EstadoCarga mensaje="Cargando catálogo de la biblioteca..." />;
  }

  if (error) {
    return <EstadoError mensaje={error} alReintentar={reintentar} />;
  }

  return (
    <FlatList
      data={libros}
      keyExtractor={(item) => item.isbn}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <View style={estilos.encabezado}>
          <View style={estilos.acciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buscar libros por título o autor"
              onPress={() => router.push('/buscar')}
              style={({ pressed }) => [
                estilos.botonAccion,
                pressed ? estilos.presionado : null,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORES.primario}
              />
              <Text style={estilos.textoAccion}>Buscar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escanear código de barras de un libro"
              onPress={() => router.push('/escanear')}
              style={({ pressed }) => [
                estilos.botonAccion,
                pressed ? estilos.presionado : null,
              ]}
            >
              <Ionicons
                name="barcode-outline"
                size={20}
                color={COLORES.primario}
              />
              <Text style={estilos.textoAccion}>Escanear</Text>
            </Pressable>
          </View>

          <BarraRecientes
            libros={ultimosTresVistos}
            alSeleccionar={(isbn) =>
              router.push({ pathname: '/libro/[isbn]', params: { isbn } })
            }
          />

          <Text style={estilos.seccionTitulo}>Todos los libros</Text>
        </View>
      }
      ListEmptyComponent={
        <EstadoVacio
          titulo="No hay libros en el catálogo"
          descripcion="Por el momento no encontramos títulos disponibles."
        />
      }
      renderItem={({ item }) => (
        <TarjetaLibro
          libro={item}
          ejemplaresDisponibles={obtenerEjemplaresDisponibles(item)}
          cantidadEspera={obtenerCantidadEspera(item.isbn)}
          onPress={() =>
            router.push({
              pathname: '/libro/[isbn]',
              params: { isbn: item.isbn },
            })
          }
        />
      )}
      ItemSeparatorComponent={() => <View style={estilos.separador} />}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: ESPACIADOS.lg,
    paddingBottom: ESPACIADOS.xxl,
    flexGrow: 1,
  },
  encabezado: {
    gap: ESPACIADOS.lg,
    marginBottom: ESPACIADOS.md,
  },
  acciones: {
    flexDirection: 'row',
    gap: ESPACIADOS.md,
  },
  botonAccion: {
    flex: 1,
    minHeight: TAMANIOS.areaTactilMinima,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADOS.sm,
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.primario,
    borderRadius: TAMANIOS.radio,
    paddingHorizontal: ESPACIADOS.md,
    paddingVertical: ESPACIADOS.sm,
  },
  presionado: {
    opacity: 0.8,
  },
  textoAccion: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '600',
    color: COLORES.primario,
  },
  seccionTitulo: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  separador: {
    height: ESPACIADOS.md,
  },
});
