import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import type { EstadoPermiso, RecursoPermiso } from '@/types';

type ResultadoPermiso = {
  estado: EstadoPermiso;
  concedido: boolean;
  puedePreguntar: boolean;
  bloqueado: boolean;
  pedirPermiso: () => Promise<boolean>;
  abrirAjustes: () => Promise<void>;
  actualizarEstado: () => Promise<void>;
};

async function asegurarCanalPrestamos(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await setNotificationChannelAsync('prestamos', {
    name: 'Recordatorios de préstamos',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function mapearEstado(
  cargando: boolean,
  granted: boolean,
  canAskAgain: boolean,
): EstadoPermiso {
  if (cargando) {
    return 'cargando';
  }
  if (granted) {
    return 'concedido';
  }
  return canAskAgain ? 'preguntable' : 'bloqueado';
}

export function usePermiso(recurso: RecursoPermiso): ResultadoPermiso {
  const [permisoCamara, pedirPermisoCamara, consultarPermisoCamara] =
    useCameraPermissions();

  const [notifGranted, setNotifGranted] = useState<boolean>(false);
  const [notifCanAskAgain, setNotifCanAskAgain] = useState<boolean>(true);
  const [notifCargando, setNotifCargando] = useState<boolean>(
    recurso === 'notificaciones',
  );

  const actualizarEstado = useCallback(async () => {
    if (recurso === 'camara') {
      await consultarPermisoCamara();
      return;
    }

    const respuesta = await getPermissionsAsync();
    setNotifGranted(respuesta.granted);
    setNotifCanAskAgain(respuesta.canAskAgain);
    setNotifCargando(false);
  }, [recurso, consultarPermisoCamara]);

  useEffect(() => {
    let activo = true;

    async function verificarInicial() {
      if (recurso === 'notificaciones') {
        const respuesta = await getPermissionsAsync();
        if (activo) {
          setNotifGranted(respuesta.granted);
          setNotifCanAskAgain(respuesta.canAskAgain);
          setNotifCargando(false);
        }
      }
    }

    verificarInicial();

    const suscripcion = AppState.addEventListener('change', (siguienteEstado) => {
      if (siguienteEstado === 'active' && activo) {
        void actualizarEstado();
      }
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, [recurso, actualizarEstado]);

  const pedirPermiso = useCallback(async (): Promise<boolean> => {
    if (recurso === 'camara') {
      const respuesta = await pedirPermisoCamara();
      return respuesta.granted;
    }

    await asegurarCanalPrestamos();
    const respuesta = await requestPermissionsAsync();
    setNotifGranted(respuesta.granted);
    setNotifCanAskAgain(respuesta.canAskAgain);
    setNotifCargando(false);
    return respuesta.granted;
  }, [recurso, pedirPermisoCamara]);

  const abrirAjustes = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  if (recurso === 'camara') {
    const estado = mapearEstado(
      permisoCamara === null,
      permisoCamara?.granted ?? false,
      permisoCamara?.canAskAgain ?? true,
    );

    return {
      estado,
      concedido: estado === 'concedido',
      puedePreguntar: estado === 'preguntable',
      bloqueado: estado === 'bloqueado',
      pedirPermiso,
      abrirAjustes,
      actualizarEstado,
    };
  }

  const estado = mapearEstado(notifCargando, notifGranted, notifCanAskAgain);

  return {
    estado,
    concedido: estado === 'concedido',
    puedePreguntar: estado === 'preguntable',
    bloqueado: estado === 'bloqueado',
    pedirPermiso,
    abrirAjustes,
    actualizarEstado,
  };
}
