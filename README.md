# Biblioteca IPF — Trabajo Práctico N° 4

Aplicación móvil desarrollada con **React Native**, **Expo (SDK 58, `expo ~58.0.26`)**, **TypeScript** y **Expo Router** para el Trabajo Práctico N° 4 de *Taller Complementario – React Native II* (Tecnicatura Superior en Desarrollo de Software Multiplataforma · Instituto Politécnico Formosa).

## Descripción del sistema

La aplicación permite a estudiantes consultar el catálogo de la biblioteca, buscar libros por título o autor, escanear el código de barras EAN-13 (o ingresar el ISBN manualmente), realizar reservas o sumarse a listas de espera, gestionar sus préstamos con recordatorios locales y acceder al mostrador del personal para entregar libros respetando el orden de llegada.

## Cómo ejecutar el proyecto

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo de Expo:

   ```bash
   npx expo start
   ```

3. Escanear el código QR mostrado en la terminal con **Expo Go** (Android) o la app Cámara (iOS).
4. Para probar el ingreso del personal en `/login`, usar las credenciales fijas de prueba:
   - **Usuario:** `bibliotecario`
   - **Clave:** `ipf2026`

---

## Árbol de carpetas de `src/app` y navegadores

```text
src/app/
├── _layout.tsx                  # Stack raíz (BibliotecaProvider, modales y Stack.Protected para /login y /mostrador)
├── +not-found.tsx               # Pantalla 404 que muestra la URL inexistente
├── buscar.tsx                   # Buscador (/buscar?q=) en el Stack raíz
├── escanear.tsx                 # Escáner EAN-13 + ingreso manual (/escanear) en el Stack raíz
├── login.tsx                    # Modal de ingreso del personal (/login), solo existe sin sesión
├── mostrador.tsx                # Pantalla de mostrador (/mostrador) en el Stack raíz, solo existe con sesión
├── reserva.tsx                  # Redirección <Redirect href="/reservas" /> para compatibilidad con URL vieja
├── permisos/
│   └── [recurso].tsx            # Modal previo de permisos (/permisos/camara, /permisos/notificaciones)
├── reservar/
│   └── [isbn].tsx               # Modal de confirmación de reserva (/reservar/[isbn])
└── (tabs)/
    ├── _layout.tsx              # Navegador de pestañas (Tabs) con anchor: '(catalogo)'
    ├── reservas.tsx             # Pestaña "Mis reservas" (/reservas)
    └── (catalogo)/
        ├── _layout.tsx          # Stack propio de la pestaña "Catálogo" con botón "Personal" en el header
        ├── index.tsx            # Catálogo principal (/)
        └── libro/
            └── [isbn].tsx       # Detalle del libro (/libro/[isbn]) dentro de la tab Catálogo
```

---

## Configuración de `plugins` en `app.json`

```jsonc
"plugins": [
  // Configura el enrutamiento basado en archivos (Expo Router) y tipado de rutas
  "expo-router",
  [
    // Define la pantalla de carga inicial de la app
    "expo-splash-screen",
    {
      "backgroundColor": "#208AEF",
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 76
    }
  ],
  [
    // Configura expo-camera aplicando el principio de mínimo privilegio:
    // declara el texto de propósito de cámara y desactiva por completo el micrófono
    "expo-camera",
    {
      "cameraPermission": "Usamos tu cámara para escanear el código de barras de los libros del catálogo.",
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ],
  [
    // Configura el módulo nativo de notificaciones locales (color de acento en Android)
    "expo-notifications",
    {
      "color": "#1E40AF"
    }
  ]
]
```

---

## Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se deniega |
| :--- | :--- | :--- | :--- |
| Cámara | `expo-camera` | Al tocar "Permitir cámara" en `/escanear` y luego "Continuar" en la pantalla previa `/permisos/camara`. | Ingreso manual del código ISBN de 13 dígitos en la misma pantalla `/escanear`. |
| Notificaciones locales | `expo-notifications` | Únicamente al activar el interruptor "Recordarme" en un préstamo dentro de `/reservas` (previa creación del canal `"prestamos"` en Android). | Avisos visibles directamente dentro de la pestaña `/reservas` cuando llega el turno o hay novedades. |

---

## Justificación de `blockedPermissions` en Android

En `app.json`, dentro de `android.blockedPermissions`, se bloquean explícitamente permisos que la aplicación no necesita:

- `android.permission.RECORD_AUDIO`: la app solo escanea códigos de barras EAN-13; nunca graba video ni audio.
- `android.permission.ACCESS_FINE_LOCATION` y `android.permission.ACCESS_COARSE_LOCATION`: la app no utiliza geolocalización.
- `android.permission.READ_MEDIA_IMAGES`: la app no accede a la galería ni selecciona imágenes del dispositivo.

---

## Deep links de prueba

Con esquema propio `bibliotecaipf://` (o en Expo Go reemplazando por `exp://<IP>:8081/--/`):

- `bibliotecaipf://libro/9780132350884` → Abre el detalle de *Clean Code* dentro de la pestaña Catálogo.
- `bibliotecaipf://libro/123` → Abre el detalle y muestra mensaje de ISBN inválido con botón para volver al catálogo.
- `bibliotecaipf://buscar?q=borges` → Abre `/buscar` con el texto `"borges"` cargado en el buscador y `(tabs)` debajo en la pila.
- `bibliotecaipf://mostrador` → Sin sesión, `Stack.Protected` no expone la ruta (lleva a `+not-found` / fallback).
- `bibliotecaipf://reserva` → Redirige automáticamente a `/reservas`.
- `bibliotecaipf://escanear` → Abre el escáner (si la cámara está bloqueada, muestra estado bloqueado y el ingreso manual de ISBN).

---

## Salida de verificación (`npx expo lint` y `npx tsc --noEmit`)

```text
> npx tsc --noEmit
(sin errores, código de salida 0)

> npx expo lint
(sin errores ni advertencias, código de salida 0)
```
