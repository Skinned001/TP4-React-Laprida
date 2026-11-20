import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { LIBROS, LISTAS_ESPERA_INICIALES } from '@/data/libros';
import { Cola } from '@/estructuras/Cola';
import { Pila } from '@/estructuras/Pila';
import type { AvisoApp, Libro, Prestamo, ReservaEspera } from '@/types';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const USUARIO_ACTUAL = 'Vos';
export const CREDENCIALES_PERSONAL = {
  usuario: 'bibliotecario',
  clave: 'ipf2026',
} as const;

type ResultadoReserva =
  | { tipo: 'prestamo'; fechaDevolucion: string }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'ya_reservado' };

type ResultadoEntrega = {
  entregadoA: string | null;
};

type BibliotecaContextValue = {
  prestamos: Prestamo[];
  reservasEnEspera: ReservaEspera[];
  listasEspera: Record<string, Cola<string>>;
  ultimosTresVistos: Libro[];
  avisos: AvisoApp[];
  sesionPersonal: boolean;
  registrarVisto: (libro: Libro) => void;
  obtenerEjemplaresDisponibles: (libro: Libro) => number;
  obtenerCantidadEspera: (isbn: string) => number;
  obtenerPosicionUsuario: (isbn: string) => number | null;
  tieneLibroReservado: (isbn: string) => boolean;
  reservarLibro: (libro: Libro) => ResultadoReserva;
  devolverLibro: (isbn: string) => Promise<void>;
  activarRecordatorio: (isbn: string) => Promise<void>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  entregarAlSiguiente: (isbn: string) => Promise<ResultadoEntrega>;
  limpiarAviso: (id: string) => void;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
};

const BibliotecaContext = createContext<BibliotecaContextValue | null>(null);

function crearListasIniciales(): Record<string, Cola<string>> {
  const mapa: Record<string, Cola<string>> = {};
  for (const [isbn, personas] of Object.entries(LISTAS_ESPERA_INICIALES)) {
    mapa[isbn] = new Cola<string>(personas);
  }
  return mapa;
}

function calcularFechaDevolucion(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString();
}

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [listasEspera, setListasEspera] = useState<Record<string, Cola<string>>>(
    () => crearListasIniciales(),
  );
  const [recientes, setRecientes] = useState<Pila<Libro>>(
    () => new Pila<Libro>(),
  );
  const [avisos, setAvisos] = useState<AvisoApp[]>([]);
  const [sesionPersonal, setSesionPersonal] = useState<boolean>(false);

  const registrarVisto = useCallback((libro: Libro) => {
    setRecientes((anterior) => {
      if (anterior.verTope()?.isbn === libro.isbn) {
        return anterior;
      }
      const nuevaPila = anterior.clonar();
      nuevaPila.apilar(libro);
      return nuevaPila;
    });
  }, []);

  const obtenerEjemplaresDisponibles = useCallback(
    (libro: Libro): number => {
      const prestadoAlUsuario = prestamos.some((p) => p.isbn === libro.isbn)
        ? 1
        : 0;
      return Math.max(0, libro.ejemplares - prestadoAlUsuario);
    },
    [prestamos],
  );

  const obtenerCantidadEspera = useCallback(
    (isbn: string): number => {
      return listasEspera[isbn]?.tamanio ?? 0;
    },
    [listasEspera],
  );

  const obtenerPosicionUsuario = useCallback(
    (isbn: string): number | null => {
      const cola = listasEspera[isbn];
      if (!cola) {
        return null;
      }
      const indice = cola.aArray().indexOf(USUARIO_ACTUAL);
      return indice >= 0 ? indice + 1 : null;
    },
    [listasEspera],
  );

  const tieneLibroReservado = useCallback(
    (isbn: string): boolean => {
      const enPrestamo = prestamos.some((p) => p.isbn === isbn);
      const enEspera = obtenerPosicionUsuario(isbn) !== null;
      return enPrestamo || enEspera;
    },
    [prestamos, obtenerPosicionUsuario],
  );

  const reservarLibro = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (tieneLibroReservado(libro.isbn)) {
        return { tipo: 'ya_reservado' };
      }

      const disponibles = obtenerEjemplaresDisponibles(libro);
      if (disponibles > 0) {
        const fechaDevolucion = calcularFechaDevolucion(7);
        const nuevoPrestamo: Prestamo = {
          isbn: libro.isbn,
          titulo: libro.titulo,
          fechaDevolucion,
          recordarme: false,
          notificacionId: null,
        };
        setPrestamos((anterior) => [...anterior, nuevoPrestamo]);
        return { tipo: 'prestamo', fechaDevolucion };
      }

      const colaActual = listasEspera[libro.isbn];
      const nuevaCola = colaActual ? colaActual.clonar() : new Cola<string>();
      nuevaCola.encolar(USUARIO_ACTUAL);
      const posicion = nuevaCola.tamanio;

      setListasEspera((anterior) => ({
        ...anterior,
        [libro.isbn]: nuevaCola,
      }));

      return { tipo: 'espera', posicion };
    },
    [tieneLibroReservado, obtenerEjemplaresDisponibles, listasEspera],
  );

  const devolverLibro = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        await cancelScheduledNotificationAsync(prestamo.notificacionId);
      }
      setPrestamos((anterior) => anterior.filter((p) => p.isbn !== isbn));
    },
    [prestamos],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return;
      }

      if (Platform.OS === 'android') {
        await setNotificationChannelAsync('prestamos', {
          name: 'Recordatorios de préstamos',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      if (prestamo.notificacionId) {
        await cancelScheduledNotificationAsync(prestamo.notificacionId);
      }

      const notificacionId = await scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de devolución',
          body: `Recordá devolver "${prestamo.titulo}" en la biblioteca.`,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 15,
          repeats: false,
          ...(Platform.OS === 'android' ? { channelId: 'prestamos' } : {}),
        },
      });

      setPrestamos((anterior) =>
        anterior.map((p) =>
          p.isbn === isbn
            ? { ...p, recordarme: true, notificacionId }
            : p,
        ),
      );
    },
    [prestamos],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        await cancelScheduledNotificationAsync(prestamo.notificacionId);
      }
      setPrestamos((anterior) =>
        anterior.map((p) =>
          p.isbn === isbn
            ? { ...p, recordarme: false, notificacionId: null }
            : p,
        ),
      );
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string): Promise<ResultadoEntrega> => {
      const colaActual = listasEspera[isbn];
      if (!colaActual || colaActual.estaVacia()) {
        return { entregadoA: null };
      }

      const nuevaCola = colaActual.clonar();
      const siguiente = nuevaCola.desencolar() ?? null;

      setListasEspera((anterior) => ({
        ...anterior,
        [isbn]: nuevaCola,
      }));

      if (siguiente === USUARIO_ACTUAL) {
        const libro = LIBROS.find((l) => l.isbn === isbn);
        const titulo = libro?.titulo ?? `Libro ${isbn}`;
        const fechaDevolucion = calcularFechaDevolucion(7);

        setPrestamos((anterior) => {
          if (anterior.some((p) => p.isbn === isbn)) {
            return anterior;
          }
          return [
            ...anterior,
            {
              isbn,
              titulo,
              fechaDevolucion,
              recordarme: false,
              notificacionId: null,
            },
          ];
        });

        const permisoActual = await getPermissionsAsync();
        if (permisoActual.granted) {
          if (Platform.OS === 'android') {
            await setNotificationChannelAsync('prestamos', {
              name: 'Recordatorios de préstamos',
              importance: AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
            });
          }
          await scheduleNotificationAsync({
            content: {
              title: '¡Tu libro ya está disponible!',
              body: `Pasá a retirar "${titulo}" por el mostrador.`,
            },
            trigger: null,
          });
        } else {
          setAvisos((anterior) => [
            {
              id: `${isbn}-${Date.now()}`,
              mensaje: `¡Tu libro "${titulo}" ya está disponible! Pasá a retirarlo por el mostrador.`,
              fecha: new Date().toISOString(),
            },
            ...anterior,
          ]);
        }
      }

      return { entregadoA: siguiente };
    },
    [listasEspera],
  );

  const limpiarAviso = useCallback((id: string) => {
    setAvisos((anterior) => anterior.filter((a) => a.id !== id));
  }, []);

  const iniciarSesion = useCallback((usuario: string, clave: string): boolean => {
    const valido =
      usuario.trim() === CREDENCIALES_PERSONAL.usuario &&
      clave === CREDENCIALES_PERSONAL.clave;
    if (valido) {
      setSesionPersonal(true);
    }
    return valido;
  }, []);

  const cerrarSesion = useCallback(() => {
    setSesionPersonal(false);
  }, []);

  const ultimosTresVistos = useMemo(
    () => recientes.aArray().slice(0, 3),
    [recientes],
  );

  const reservasEnEspera = useMemo<ReservaEspera[]>(() => {
    const resultado: ReservaEspera[] = [];
    for (const [isbn, cola] of Object.entries(listasEspera)) {
      const posicion = cola.aArray().indexOf(USUARIO_ACTUAL);
      if (posicion >= 0) {
        const libro = LIBROS.find((l) => l.isbn === isbn);
        resultado.push({
          isbn,
          titulo: libro?.titulo ?? `Libro ${isbn}`,
          posicion: posicion + 1,
        });
      }
    }
    return resultado;
  }, [listasEspera]);

  const valor = useMemo<BibliotecaContextValue>(
    () => ({
      prestamos,
      reservasEnEspera,
      listasEspera,
      ultimosTresVistos,
      avisos,
      sesionPersonal,
      registrarVisto,
      obtenerEjemplaresDisponibles,
      obtenerCantidadEspera,
      obtenerPosicionUsuario,
      tieneLibroReservado,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      limpiarAviso,
      iniciarSesion,
      cerrarSesion,
    }),
    [
      prestamos,
      reservasEnEspera,
      listasEspera,
      ultimosTresVistos,
      avisos,
      sesionPersonal,
      registrarVisto,
      obtenerEjemplaresDisponibles,
      obtenerCantidadEspera,
      obtenerPosicionUsuario,
      tieneLibroReservado,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      limpiarAviso,
      iniciarSesion,
      cerrarSesion,
    ],
  );

  return (
    <BibliotecaContext.Provider value={valor}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca(): BibliotecaContextValue {
  const contexto = useContext(BibliotecaContext);
  if (!contexto) {
    throw new Error(
      'useBiblioteca debe usarse dentro de un BibliotecaProvider.',
    );
  }
  return contexto;
}
