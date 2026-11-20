import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { BotonPrimario } from '@/components/BotonPrimario';
import { EstadoCarga } from '@/components/EstadoCarga';
import { COLORES, ESPACIADOS, TAMANIOS } from '@/constants/tema';
import { LIBROS } from '@/data/libros';
import { usePermiso } from '@/hooks/usePermiso';

export default function PantallaEscanear() {
  const { estado, bloqueado, actualizarEstado } = usePermiso('camara');

  const [isbnManual, setIsbnManual] = useState<string>('');
  const [avisoEscaneo, setAvisoEscaneo] = useState<string | null>(null);
  const [errorManual, setErrorManual] = useState<string | null>(null);

  const yaNavegoRef = useRef<boolean>(false);
  const ultimoNoEncontradoRef = useRef<string>('');

  useFocusEffect(
    useCallback(() => {
      void actualizarEstado();
    }, [actualizarEstado]),
  );

  function manejarCodigoEscaneado(resultado: BarcodeScanningResult) {
    if (yaNavegoRef.current) {
      return;
    }

    const codigo = resultado.data.trim();
    const existe = LIBROS.some((libro) => libro.isbn === codigo);

    if (existe) {
      yaNavegoRef.current = true;
      router.replace({
        pathname: '/libro/[isbn]',
        params: { isbn: codigo },
      });
      return;
    }

    if (ultimoNoEncontradoRef.current !== codigo) {
      ultimoNoEncontradoRef.current = codigo;
      setAvisoEscaneo(
        `El código ${codigo} no pertenece a ningún libro del catálogo. Podés seguir escaneando otro libro.`,
      );
    }
  }

  function abrirIsbnManual() {
    const limpio = isbnManual.trim();
    if (!/^\d{13}$/.test(limpio)) {
      setErrorManual('Ingresá un ISBN válido de exactamente 13 dígitos.');
      return;
    }

    setErrorManual(null);
    router.replace({
      pathname: '/libro/[isbn]',
      params: { isbn: limpio },
    });
  }

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={estilos.zonaCamara}>
        {estado === 'cargando' ? (
          <EstadoCarga mensaje="Verificando permiso de cámara..." />
        ) : estado === 'concedido' ? (
          <View style={estilos.camaraContenedor}>
            <CameraView
              style={estilos.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
              onBarcodeScanned={manejarCodigoEscaneado}
            />
            {avisoEscaneo ? (
              <View style={estilos.avisoFlotante}>
                <Text style={estilos.textoAvisoFlotante}>{avisoEscaneo}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={estilos.tarjetaPermiso}>
            <Text style={estilos.tituloPermiso}>
              {bloqueado
                ? 'Cámara bloqueada en Ajustes'
                : 'Necesitamos permiso de cámara'}
            </Text>
            <Text style={estilos.descripcionPermiso}>
              {bloqueado
                ? 'Habilitá el acceso a la cámara desde los Ajustes del sistema para escanear códigos de barras, o escribí el ISBN manualmente abajo.'
                : 'Para leer el código de barras de la contratapa del libro necesitamos usar tu cámara. También podés escribir el ISBN a mano.'}
            </Text>
            <BotonPrimario
              titulo={bloqueado ? 'Ir a Ajustes' : 'Permitir cámara'}
              onPress={() =>
                router.push({
                  pathname: '/permisos/[recurso]',
                  params: { recurso: 'camara' },
                })
              }
            />
          </View>
        )}
      </View>

      <View style={estilos.zonaManual}>
        <Text style={estilos.tituloManual}>Ingresar ISBN manualmente</Text>
        <View style={estilos.filaManual}>
          <TextInput
            value={isbnManual}
            onChangeText={setIsbnManual}
            placeholder="Ej: 9780132350884"
            placeholderTextColor={COLORES.textoSuave}
            keyboardType="number-pad"
            maxLength={13}
            style={estilos.entradaManual}
            accessibilityLabel="Ingresar código ISBN de 13 dígitos"
          />
          <BotonPrimario titulo="Abrir" onPress={abrirIsbnManual} />
        </View>
        {errorManual ? (
          <Text style={estilos.errorManual}>{errorManual}</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.lg,
  },
  zonaCamara: {
    flex: 1,
    borderRadius: TAMANIOS.radio,
    overflow: 'hidden',
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  camaraContenedor: {
    flex: 1,
    position: 'relative',
  },
  camara: {
    flex: 1,
  },
  avisoFlotante: {
    position: 'absolute',
    left: ESPACIADOS.md,
    right: ESPACIADOS.md,
    bottom: ESPACIADOS.md,
    backgroundColor: COLORES.advertenciaFondo,
    borderRadius: TAMANIOS.radioChico,
    padding: ESPACIADOS.md,
    borderWidth: 1,
    borderColor: COLORES.advertencia,
  },
  textoAvisoFlotante: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.advertencia,
    fontWeight: '600',
    textAlign: 'center',
  },
  tarjetaPermiso: {
    flex: 1,
    padding: ESPACIADOS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADOS.md,
  },
  tituloPermiso: {
    fontSize: TAMANIOS.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
    textAlign: 'center',
  },
  descripcionPermiso: {
    fontSize: TAMANIOS.secundario,
    color: COLORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },
  zonaManual: {
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIADOS.lg,
    gap: ESPACIADOS.sm,
  },
  tituloManual: {
    fontSize: TAMANIOS.secundario,
    fontWeight: '700',
    color: COLORES.texto,
  },
  filaManual: {
    flexDirection: 'row',
    gap: ESPACIADOS.sm,
    alignItems: 'center',
  },
  entradaManual: {
    flex: 1,
    minHeight: TAMANIOS.areaTactilMinima,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: TAMANIOS.radioChico,
    paddingHorizontal: ESPACIADOS.md,
    fontSize: TAMANIOS.cuerpo,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
  },
  errorManual: {
    fontSize: TAMANIOS.chico,
    color: COLORES.error,
    fontWeight: '600',
  },
});
