import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EstadoCarga } from '@/components/EstadoCarga';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { buscarLibros } from '@/lib/api';
import type { Libro } from '@/types';

export default function PantallaBuscar() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const consulta = Array.isArray(q) ? (q[0] ?? '') : (q ?? '');

  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState<number>(0);

  const { obtenerEjemplaresDisponibles, obtenerCantidadEspera } =
    useBiblioteca();

  const actualizarBusqueda = useCallback((texto: string) => {
    router.setParams({ q: texto });
  }, []);

  const reintentar = useCallback(() => {
    setIntento((anterior) => anterior + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    const textoLimpio = consulta.trim();

    if (textoLimpio.length === 0) {
      return;
    }

    async function ejecutarBusqueda() {
      setCargando(true);
      setError(null);

      try {
        const datos = await buscarLibros(textoLimpio);
        if (!cancelado) {
          setResultados(datos);
        }
      } catch {
        if (!cancelado) {
          setError('No pudimos completar la búsqueda. Intentá nuevamente.');
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    ejecutarBusqueda();

    return () => {
      cancelado = true;
    };
  }, [consulta, intento]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.barraBusqueda}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORES.textoSecundario}
        />
        <TextInput
          value={consulta}
          onChangeText={actualizarBusqueda}
          placeholder="Buscar por título o autor..."
          placeholderTextColor={COLORES.textoSuave}
          style={estilos.entrada}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Campo de búsqueda por título o autor"
        />
        {consulta.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => actualizarBusqueda('')}
            style={estilos.botonLimpiar}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORES.textoSuave}
            />
          </Pressable>
        ) : null}
      </View>

      {cargando ? (
        <EstadoCarga mensaje="Buscando en el catálogo..." />
      ) : error ? (
        <EstadoError mensaje={error} alReintentar={reintentar} />
      ) : consulta.trim().length === 0 ? (
        <EstadoVacio
          titulo="Buscá un libro"
          descripcion="Escribí parte del título o el nombre de quien lo escribió."
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.isbn}
          contentContainerStyle={estilos.lista}
          ListEmptyComponent={
            <EstadoVacio
              titulo="Sin resultados"
              descripcion={`No encontramos libros que coincidan con "${consulta.trim()}".`}
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
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.md,
  },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: TAMANIOS.radio,
    paddingHorizontal: ESPACIADOS.md,
    minHeight: TAMANIOS.areaTactilMinima,
    gap: ESPACIADOS.sm,
  },
  entrada: {
    flex: 1,
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.texto,
    paddingVertical: ESPACIADOS.sm,
  },
  botonLimpiar: {
    minWidth: TAMANIOS.areaTactilMinima,
    minHeight: TAMANIOS.areaTactilMinima,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    paddingBottom: ESPACIADOS.xxl,
    flexGrow: 1,
  },
  separador: {
    height: ESPACIADOS.md,
  },
});
