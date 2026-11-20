import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BotonPrimario } from '@/components/BotonPrimario';
import { EstadoVacio } from '@/components/EstadoVacio';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { LIBROS } from '@/data/libros';

type ItemMostrador = {
  isbn: string;
  titulo: string;
  autor: string;
  frente: string;
  cantidad: number;
};

export default function PantallaMostrador() {
  const { listasEspera, entregarAlSiguiente, cerrarSesion } = useBiblioteca();
  const [mensajeEntrega, setMensajeEntrega] = useState<string | null>(null);

  const itemsConEspera = useMemo<ItemMostrador[]>(() => {
    const resultado: ItemMostrador[] = [];
    for (const libro of LIBROS) {
      const cola = listasEspera[libro.isbn];
      if (cola && !cola.estaVacia()) {
        resultado.push({
          isbn: libro.isbn,
          titulo: libro.titulo,
          autor: libro.autor,
          frente: cola.verFrente() ?? '',
          cantidad: cola.tamanio,
        });
      }
    }
    return resultado;
  }, [listasEspera]);

  async function manejarEntrega(isbn: string, titulo: string) {
    const resultado = await entregarAlSiguiente(isbn);
    if (resultado.entregadoA) {
      setMensajeEntrega(
        `Se entregó "${titulo}" a ${resultado.entregadoA}.`,
      );
    } else {
      setMensajeEntrega('No hay personas esperando este libro.');
    }
  }

  return (
    <View style={estilos.contenedor}>
      {mensajeEntrega ? (
        <View style={estilos.avisoEntrega}>
          <Text style={estilos.textoAviso}>{mensajeEntrega}</Text>
        </View>
      ) : null}

      <FlatList
        data={itemsConEspera}
        keyExtractor={(item) => item.isbn}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EstadoVacio
            titulo="Sin listas de espera activas"
            descripcion="En este momento no hay personas esperando libros para retirar."
          />
        }
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo}>{item.titulo}</Text>
            <Text style={estilos.autor}>{item.autor}</Text>

            <View style={estilos.filaDato}>
              <Text style={estilos.etiqueta}>Siguiente en la fila:</Text>
              <Text style={estilos.valorDestacado}>{item.frente}</Text>
            </View>

            <View style={estilos.filaDato}>
              <Text style={estilos.etiqueta}>Total en espera:</Text>
              <Text style={estilos.valor}>{item.cantidad}</Text>
            </View>

            <BotonPrimario
              titulo="Entregar al siguiente"
              onPress={() => {
                void manejarEntrega(item.isbn, item.titulo);
              }}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
      />

      <View style={estilos.pie}>
        <BotonPrimario
          titulo="Cerrar sesión"
          variante="peligro"
          onPress={cerrarSesion}
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
    gap: ESPACIADOS.md,
  },
  avisoEntrega: {
    backgroundColor: COLORES.exitoFondo,
    borderRadius: TAMANIOS.radio,
    padding: ESPACIADOS.md,
    borderWidth: 1,
    borderColor: COLORES.exito,
  },
  textoAviso: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '600',
    color: COLORES.exito,
  },
  lista: {
    flexGrow: 1,
    paddingBottom: ESPACIADOS.lg,
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.sm,
  },
  titulo: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
    marginBottom: ESPACIADOS.xs,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  valorDestacado: {
    fontSize: TAMANIOS.cuerpo,
    fontWeight: '700',
    color: COLORES.primario,
  },
  separador: {
    height: ESPACIADOS.md,
  },
  pie: {
    paddingTop: ESPACIADOS.sm,
  },
});
