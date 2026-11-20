# Biblioteca IPF — Trabajo Práctico N° 4

Aplicación móvil desarrollada con **React Native**, **Expo (SDK 58)**, **TypeScript** y **Expo Router** para el Trabajo Práctico N° 4 de *Taller Complementario – React Native II* (Tecnicatura Superior en Desarrollo de Software Multiplataforma · Instituto Politécnico Formosa).

## Descripción del sistema

La aplicación permite a estudiantes consultar el catálogo de la biblioteca, buscar libros por título o autor, escanear el código de barras EAN-13 (o ingresar el ISBN manualmente), realizar reservas o sumarse a listas de espera, gestionar sus préstamos con recordatorios locales y acceder al mostrador del personal para entregar libros respetando el orden de llegada.

## Requisitos previos

- Node.js (v18 o superior)
- npm
- Aplicación **Expo Go** instalada en un teléfono Android o iOS (en la misma red Wi-Fi que la computadora)

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

## Verificación de código

- Verificación de tipos con TypeScript:

  ```bash
  npx tsc --noEmit
  ```

- Verificación de estilo y reglas con ESLint:

  ```bash
  npx expo lint
  ```
