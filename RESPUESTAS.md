# Respuestas de análisis — TP N° 4: “Biblioteca IPF”

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

**a) Render por render desde el montaje del Catálogo:**

En [src/hooks/useLibros.ts](src/hooks/useLibros.ts#L12-L55):

1. **Render 1 (montaje inicial):** `libros = []`, `cargando = true`, `error = null`, `intento = 0`. Lo provoca el montaje de `PantallaCatalogo` en `src/app/(tabs)/(catalogo)/index.tsx`. En pantalla se muestra `<EstadoCarga />`.
2. **Ejecución del `useEffect` (líneas 22–52):** llama a `cargar()`, que vuelve a invocar `setCargando(true)` y `setError(null)` (como ya tenían esos valores, React puede evitar un re-render adicional) y dispara `await obtenerLibros()`.
3. **Render 2 (resolución exitosa):** cuando `obtenerLibros()` resuelve y `!cancelado`, `setLibros(datos)` y `setCargando(false)` (agrupados en un mismo lote por React 19) provocan el render con `libros = [16 libros]`, `cargando = false`, `error = null`. Aparece la `FlatList`.
4. **Caso de fallo y "Reintentar":**
   - Si `obtenerLibros()` lanza error, el `catch` + `finally` ejecutan `setError(...)` y `setCargando(false)` -> **Render 2 (error):** `libros = []`, `cargando = false`, `error = "No pudimos cargar..."`. Se muestra `<EstadoError />`.
   - Al tocar "Reintentar", `reintentar()` incrementa `intento` (`setIntento((anterior) => anterior + 1)` en la línea 19) -> **Render 3:** cambia `intento` a `1`, lo que dispara de nuevo el `useEffect`.
   - Dentro de `cargar()`, `setCargando(true)` y `setError(null)` -> **Render 4 (cargando de nuevo):** `cargando = true`, `error = null`.
   - Cuando resuelve con éxito, `setLibros(datos)` y `setCargando(false)` -> **Render 5:** aparece la lista.

**b) Desmontaje al cambiar de pestaña vs abrir un detalle:**
- Al cambiar a la pestaña **"Mis reservas"**, el Catálogo **no se desmonta**: el navegador `Tabs` mantiene montadas las pantallas de las pestañas visitadas para conservar su estado y posición de scroll.
- Al abrir un **detalle** (`/libro/[isbn]`), el Catálogo **tampoco se desmonta**: el Stack de la pestaña Catálogo apila el detalle encima del índice, manteniendo `index.tsx` montado debajo.
- Por lo tanto, la limpieza del efecto (`cancelado = true` en `src/hooks/useLibros.ts` líneas 49–51) se ejecuta cuando cambia `intento` (al tocar "Reintentar" antes de que termine el pedido anterior) o si el navegador completo de la pestaña Catálogo se desmontara (por ejemplo, al cerrar la app o reemplazar el Stack raíz).

**c) ¿Por qué no pasar una función `async` directamente a `useEffect`?**
Una función `async` siempre devuelve una `Promise`, mientras que `useEffect` espera que el valor de retorno sea `undefined` o una función de limpieza `() => void`. Si se pasara `useEffect(async () => ...)`, React recibiría una promesa en lugar de la función de limpieza (TypeScript también lo rechaza). Se resolvió declarando `async function cargar()` dentro del efecto y llamándola en la línea 47, devolviendo la función síncrona de limpieza en las líneas 49–51 de [src/hooks/useLibros.ts](src/hooks/useLibros.ts#L22-L52).

**d) Implementación de `reintentar`:**
Se usó un estado numérico `intento` (`useState<number>(0)`, línea 16) incluido en el array de dependencias `[intento]` (línea 52). Al llamar a `reintentar()`, `setIntento((anterior) => anterior + 1)` cambia su valor, React vuelve a ejecutar el efecto y lanza un nuevo `obtenerLibros()`. Se usó un contador entero en lugar de `error` porque si `error` estuviera en las dependencias, al limpiarlo con `setError(null)` al inicio de `cargar()` volvería a cambiar la dependencia y re-dispararía el efecto en bucle.

---

### B2. La condición de carrera del buscador

| Momento | Qué pasa | Sin limpieza: qué se ve | Con tu código: qué se ve |
| :--- | :--- | :--- | :--- |
| `t = 0 ms` | Escribe "bor" → se pide `buscarLibros("bor")` (1.400 ms). | Indicador de carga. | Indicador de carga. |
| `t = 200 ms` | Escribe "borges" → se pide `buscarLibros("borges")` (300 ms). | Indicador de carga. | Al cambiar `consulta`, se ejecuta la limpieza del efecto de "bor" (`cancelado = true`) y comienza la búsqueda de "borges" (indicador de carga). |
| `t = 500 ms` | Llega la respuesta de "borges". | Resultados de "borges". | Resultados de "borges" (`cancelado` de este efecto es `false`). |
| `t = 1.400 ms` | Llega la respuesta de "bor". | **Sobrescribe** la pantalla con los resultados viejos de "bor" mientras el input dice "borges". | **Siguen viéndose los resultados de "borges"**, porque el efecto de "bor" tiene `cancelado === true` e ignora `setResultados(datos)`. |

**a) Qué hace exactamente la limpieza y cuándo se ejecuta:**
En [src/app/buscar.tsx](src/app/buscar.tsx#L40-L73), cada ejecución del `useEffect` crea su propia variable local `let cancelado = false` (línea 41) y devuelve `return () => { cancelado = true; }` (líneas 70–72). Esa función de limpieza se ejecuta justo antes de que corra el efecto siguiente (cuando cambia `consulta` o `intento`) y al desmontar la pantalla. Al poner `cancelado = true` en la clausura de la búsqueda anterior, cuando la promesa vieja resuelve en `t = 1.400 ms`, la condición `if (!cancelado)` (líneas 54, 58 y 62) da `false` y descarta tanto los resultados como el cambio de `cargando`/`error`.

**b) La solución del compañero (`if (texto === q) setResultados(datos)`):**
**No funciona.** Por las **clausuras de JavaScript**, la función pasada al `.then()` captura el valor de `q` del render en el que se creó ese efecto. Para la búsqueda de "bor", tanto `texto` como `q` dentro de esa clausura valen `"bor"`, por lo que `texto === q` siempre será `true` incluso cuando en la pantalla `q` ya haya cambiado a `"borges"`.

**c) URL y botón atrás con `router.setParams` vs `router.push`:**
Con `router.setParams({ q: texto })` ([src/app/buscar.tsx](src/app/buscar.tsx#L32-L34)), la URL se actualiza en el lugar (`/buscar?q=b`, `/buscar?q=bo`, etc.) **sin apilar nuevas entradas** en el historial de navegación; al tocar atrás una sola vez, la persona vuelve directo al Catálogo. Si se usara `router.push`, cada letra tecleada apilaría una pantalla nueva de `/buscar` y la persona tendría que tocar atrás tantas veces como letras escribió.

---

### B3. Mutar o reemplazar

**a) Toca "Anotarme" tres veces:**
El texto sigue mostrando **`Personas en espera: 0`**. Porque `espera.encolar('Ana')` muta el array privado `#items` dentro de la misma instancia de `Cola` sin llamar a ningún `setState`. React no se entera de que ocurrió un cambio y no vuelve a renderizar el componente.

**b) Escribe en un `TextInput` controlado y el número "salta" a 3:**
Al escribir en el `TextInput`, `setTexto(...)` dispara un re-render del componente. Durante ese nuevo render, React vuelve a evaluar `{espera.tamanio}` y lee el valor mutado (`3`) de la misma instancia de `Cola`, provocando que el número "salte" de golpe. Un error intermitente es peor que uno que falla siempre porque depende de un evento externo no relacionado (como otro `setState`), pasa desapercibido en pruebas simples y es mucho más difícil de reproducir y diagnosticar.

**c) Cómo se resolvió en `BibliotecaContext` y comparación:**
En [src/context/BibliotecaContext.tsx](src/context/BibliotecaContext.tsx#L94-L102) y [líneas 153–161](src/context/BibliotecaContext.tsx#L153-L161), tanto `Pila` (`registrarVisto`) como `Cola` (`reservarLibro` y `entregarAlSiguiente`) usan `.clonar()` para crear una **nueva instancia** con los elementos actualizados y pasan esa nueva referencia a `setRecientes` o `setListasEspera`.
- **Alternativa 1 (clonar instancia — elegida):** mantiene la encapsulación de `#items` y entrega una referencia nueva para React. Costo: copiar el array interno en cada actualización (despreciable para listas chicas).
- **Alternativa 2 (contador de versión `version + 1`):** evita copiar el array, pero obliga a recordar incrementar el contador en cada mutación y rompe la inmutabilidad en `useMemo`/`React.memo` que dependen de la referencia del objeto.
- **Alternativa 3 (`useReducer`):** centraliza transiciones complejas, pero igual exige devolver un objeto/instancia nueva en cada acción para disparar el render.

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en tu app | Por qué ahí y no en otro lugar |
| :--- | :--- | :--- |
| Texto del buscador | **URL** (`q` en `/buscar?q=...`) | Sobrevive como parámetro compartible por deep link y sincroniza input y ruta sin estado duplicado (`useLocalSearchParams` + `router.setParams`). |
| Préstamos y reservas | **Context** (`BibliotecaContext`) | Se crean en `/reservar/[isbn]`, se consultan en `/libro/[isbn]`, se gestionan en `/reservas` y se afectan desde `/mostrador`. |
| Listas de espera | **Context** (`BibliotecaContext`) | Las leen Catálogo, Detalle, Reservar, Mis reservas y Mostrador; deben mantenerse consistentes entre todas las pantallas. |
| Vistos recientemente | **Context** (`BibliotecaContext`) | Se escribe en `/libro/[isbn]` y se lee en `/` (Catálogo); vive por encima del Stack para persistir entre navegaciones. |
| Sesión del personal | **Context** (`BibliotecaContext`) | Controla `Stack.Protected` en el layout raíz (`_layout.tsx`) y el link "Personal" en `(catalogo)/_layout.tsx`. |
| Ejemplares disponibles de un libro | **Se calcula** (`obtenerEjemplaresDisponibles`) | Se deriva de `libro.ejemplares` menos si el libro está en `prestamos`, evitando duplicar un mismo dato en dos estados. |
| Estado del permiso de cámara | **Sistema operativo** (consultado vía `usePermiso` / `useCameraPermissions`) | Es propiedad del SO y el usuario puede cambiarlo en Ajustes fuera de la app. |
| Identificador de la notificación programada | **Context** (campo `notificacionId` dentro de cada `Prestamo`) | Permite cancelar la notificación tanto al apagar el interruptor "Recordarme" como al devolver el libro desde `/reservas`. |

**Re-render del Context:**
Cuando cambia el `value` de `BibliotecaContext`, **todos los componentes consumidores de `useBiblioteca()`** se vuelven a renderizar (incluyendo el Catálogo si consume `ultimosTresVistos` del mismo contexto, aunque el cambio haya sido activar un recordatorio en `/reservas`). Para evitarlo se podrían separar contextos por frecuencia de cambio (`RecientesContext`, `PrestamosContext`, `SesionContext`) o usar selectores. En una app de este tamaño (16 libros y pocas pantallas) no vale la pena agregar esa complejidad extra mientras el `value` esté memorizado con `useMemo`.

---

## Parte C · Navegación y rutas

### C1. La pila en tu app

| # | Acción | Pilas resultantes (de base a tope) |
| :--- | :--- | :--- |
| 1 | Abre la app. | **Stack raíz:** `[(tabs)]` · **Tab Catálogo (Stack):** `[index (/)]` |
| 2 | Toca un libro del Catálogo. | **Stack raíz:** `[(tabs)]` · **Tab Catálogo (Stack):** `[index (/), libro/[isbn]]` |
| 3 | Toca "Reservar". | **Stack raíz:** `[(tabs), reservar/[isbn] (modal)]` · **Tab Catálogo (Stack):** `[index (/), libro/[isbn]]` |
| 4 | Toca "Confirmar". | **Stack raíz:** `[(tabs)]` (tab activa cambia a `reservas`) · **Tab Catálogo (Stack):** `[index (/), libro/[isbn]]` |
| 5 | Toca atrás (Android). | **Stack raíz:** `[(tabs)]` · vuelve a la tab anterior o sale según el comportamiento de Tabs; **no** vuelve al modal `reservar/[isbn]` porque fue cerrado con `dismiss()`. |
| 6 | Toca la tab "Catálogo". | **Stack raíz:** `[(tabs)]` · **Tab Catálogo (Stack):** `[index (/), libro/[isbn]]` |

**a) Método usado en el paso 4:**
En [src/app/reservar/[isbn].tsx](src/app/reservar/%5Bisbn%5D.tsx#L67-L70) se usa `if (router.canDismiss()) router.dismiss(); router.navigate('/reservas');`.
- Si se usara `push('/reservas')`, el modal quedaría debajo en el Stack raíz y al tocar atrás volvería a la confirmación.
- Si se usara `replace('/reservas')`, reemplazaría el modal en el Stack raíz en vez de ir limpiamente a la pestaña ya montada en `(tabs)`.
- `dismissTo` requiere una ruta en el mismo Stack padre, mientras que `/reservas` vive dentro de `(tabs)`. `dismiss()` cierra el modal y `navigate('/reservas')` cambia a la pestaña.

**b) En el paso 6, qué ve la persona al tocar la tab "Catálogo":**
Ve el **detalle del libro** (`/libro/[isbn]`), porque la pestaña Catálogo conserva su propio Stack intacto (`[index, libro/[isbn]]`). Es el comportamiento esperado en navegación por pestañas móviles: cada tab preserva su contexto hasta que el usuario vuelve atrás o toca de nuevo la pestaña activa para volver al inicio.

---

### C2. El escáner que dispara de más

**a) `onBarcodeScanned` sin protección:**
Mientras el código sigue frente a la cámara, el callback se dispara decenas de veces por segundo y encola múltiples acciones `router.push` en la cola de navegación, abriendo varias copias apiladas de `/libro/[isbn]` una encima de otra.

**b) `useState` vs `useRef`:**
Se usó `useRef<boolean>(false)` (`yaNavegoRef` en [src/app/escanear.tsx](src/app/escanear.tsx#L25)). Un `useState` puesto en `true` en el primer escaneo **no alcanza**, porque `setState` es asíncrono y el valor dentro del callback no cambia hasta el siguiente render; los llamados que llegan en los milisegundos siguientes siguen leyendo `false` y vuelven a disparar la navegación. `useRef` actualiza `.current` de forma síncrona e inmediata.

**c) Por qué `replace` para ir del escáner al detalle:**
Con `router.replace` ([src/app/escanear.tsx](src/app/escanear.tsx#L41)), `/escanear` sale de la pila al abrir `/libro/[isbn]`. Si se usara `push`, al tocar atrás desde el detalle volvería al escáner con la cámara activa y podría volver a leer el código inmediatamente.

**d) ISBN leído que no está en el catálogo:**
Si no existe en `LIBROS`, se guarda el código en `ultimoNoEncontradoRef.current` ([src/app/escanear.tsx](src/app/escanear.tsx#L49-L54)) y solo se actualiza `avisoEscaneo` si es distinto al último código no encontrado, mostrando un banner flotante dentro de la cámara sin apilar alertas repetidas y permitiendo seguir escaneando.

---

### C3. Deep links y rutas protegidas

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de tu código lo decide |
| :--- | :--- | :--- | :--- |
| `bibliotecaipf://libro/9780132350884` | Ficha de *Clean Code*. | `index (/)` dentro del Stack de Catálogo. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` |
| `bibliotecaipf://libro/123` | Mensaje "ISBN inválido" con botón "Volver al catálogo". | `index (/)` dentro del Stack de Catálogo. | Validación `/^\d{13}$/` en `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (línea 9) |
| `bibliotecaipf://buscar?q=borges` | Buscador con `"borges"` y resultados de Borges. | `(tabs)` gracias a `anchor: '(tabs)'`. | `unstable_settings.anchor` en `src/app/_layout.tsx` + `useLocalSearchParams` en `src/app/buscar.tsx` |
| `bibliotecaipf://mostrador` (sin sesión) | Pantalla no encontrada / ruta inexistente. | `(tabs)` si se navega desde la app. | `<Stack.Protected guard={sesionPersonal}>` en `src/app/_layout.tsx` (líneas 35–37) |
| `bibliotecaipf://reserva` | Pestaña "Mis reservas". | `[]` en el Stack de tabs. | `<Redirect href="/reservas" />` en `src/app/reserva.tsx` |
| `bibliotecaipf://escanear` (cámara bloqueada) | Aviso "Cámara bloqueada en Ajustes", botón "Ir a Ajustes" e ingreso manual de ISBN. | `(tabs)` gracias a `anchor: '(tabs)'`. | `usePermiso('camara')` y render condicional en `src/app/escanear.tsx` |

**¿Por qué `/libro/123` llega a la pantalla de detalle?**
Porque Expo Router hace coincidir el patrón dinámico `[isbn]` por estructura de URL, sin conocer reglas de negocio ni el catálogo. La responsabilidad de validar el formato (13 dígitos) y comprobar si existe en `LIBROS` es exclusivamente de la pantalla `libro/[isbn].tsx`.

---

### C4. Foco, montaje y primer plano

**a) Qué evento detecta cada herramienta:**
- `useEffect(..., [])`: se ejecuta una sola vez al **montar** el componente (y su limpieza al desmontar).
- `useFocusEffect`: se ejecuta cada vez que la pantalla **recibe foco** dentro del navegador (y limpia al perder foco).
- `AppState`: detecta cuando la aplicación pasa entre **primer plano (`active`), segundo plano (`background`) o inactiva (`inactive`)**.

**b) Salir a Ajustes vs cambiar de pestaña:**
- Al salir a Ajustes del sistema, habilitar notificaciones y volver a la app: **solo `AppState`** se entera (la pantalla nunca se desmontó ni perdió foco de React Navigation).
- Al ir a la pestaña Catálogo y volver a "Mis reservas": **solo `useFocusEffect`** se entera (la pestaña sigue montada y la app nunca salió de primer plano).

**c) Qué usamos en la app:**
Se combinaron **`AppState`** dentro de [src/hooks/usePermiso.ts](src/hooks/usePermiso.ts#L86-L95) (para detectar el regreso desde Ajustes) y **`useFocusEffect`** en [src/app/(tabs)/reservas.tsx](src/app/(tabs)/reservas.tsx#L34-L38) y [src/app/escanear.tsx](src/app/escanear.tsx#L28-L32) (para refrescar al cambiar entre pestañas/pantallas). Si se usara únicamente `useEffect(..., [])`, al volver desde Ajustes la pantalla mostraría el estado viejo (`bloqueado`) hasta reiniciar la app.

---

## Parte D · Permisos en tu app

### D1. Recorrido completo de la cámara (Android 14)

| # | Acción | Qué muestra tu app | `status` | `canAskAgain` |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Toca "Escanear" por primera vez. | Pantalla `/escanear` con botón "Permitir cámara" e ingreso manual. | `undetermined` | `true` |
| 2 | "Continuar" → "No permitir". | Vuelve a `/permisos/camara` o `/escanear` en estado preguntable ("Permitir cámara"). | `denied` | `true` |
| 3 | Toca "Escanear" otra vez. | Estado preguntable ("Permitir cámara"). | `denied` | `true` |
| 4 | "Continuar" → "No permitir". | Cambia a estado **bloqueado** ("Abrir Ajustes" / "Ir a Ajustes"). | `denied` | `false` |
| 5 | Toca "Escanear" otra vez. | Estado bloqueado ("Cámara bloqueada en Ajustes", botón "Ir a Ajustes"). | `denied` | `false` |
| 6 | "Abrir Ajustes" → habilita cámara → vuelve a la app. | Estado **concedido**: muestra `<CameraView>` listo para escanear. | `granted` | `true` |

**a) Diferencia en iOS:**
En iOS el sistema pregunta **una sola vez**. En el paso 2, tras el primer "No permitir", `canAskAgain` ya pasa a `false` (`bloqueado`), mostrando "Abrir Ajustes" desde la primera denegación sin esperar a una segunda vez.

**b) Línea que decide entre "Continuar" y "Abrir Ajustes":**
En [src/app/permisos/[recurso].tsx](src/app/permisos/%5Brecurso%5D.tsx#L73):
```tsx
titulo={bloqueado ? 'Abrir Ajustes' : 'Continuar'}
```
Y `bloqueado` se calcula en [src/hooks/usePermiso.ts](src/hooks/usePermiso.ts#L45) usando **`canAskAgain`**: `return canAskAgain ? 'preguntable' : 'bloqueado';`. No alcanza con mirar `status` porque tanto cuando todavía se puede preguntar tras una primera denegación como cuando ya está bloqueado permanentemente, `status` vale `'denied'`.

**c) Qué parte detecta el regreso desde Ajustes en el paso 6:**
El listener de `AppState` en [src/hooks/usePermiso.ts](src/hooks/usePermiso.ts#L86-L90) que ejecuta `actualizarEstado()` cuando `siguienteEstado === 'active'`. Sin esa parte, la app seguiría mostrando "Cámara bloqueada en Ajustes" aunque el usuario ya hubiera habilitado el permiso.

---

### D2. Notificaciones y consistencia

**a) Si no se cancelara la notificación al devolver antes de los 15 segundos:**
La notificación programada dispararía igual a los 15 segundos recordándole al usuario devolver un libro que ya devolvió, generando confusión y pérdida de confianza.

**b) Dónde se guarda `notificacionId` y qué pasa si se cierra la app:**
Se guarda dentro de cada objeto `Prestamo` en el estado de [src/context/BibliotecaContext.tsx](src/context/BibliotecaContext.tsx#L199-L214). Si la app se cierra por completo antes de los 15 segundos, el sistema operativo igual dispara la notificación programada, pero el `notificacionId` en memoria se pierde al reabrir la app (no sabría qué ID cancelar si se devolviera después, a menos que se persista en `AsyncStorage` o se consulte `getAllScheduledNotificationsAsync()`).

**c) Canal `"prestamos"` antes de pedir el permiso en Android 13+ vs Android 12:**
En Android 13 (API 33+), la app no puede mostrar notificaciones sin el permiso `POST_NOTIFICATIONS`, pero la creación de canales (`setNotificationChannelAsync('prestamos', ...)`) **no requiere permiso** y habilita el interruptor de notificaciones de la app en los ajustes del sistema. En Android 12 o inferior el permiso viene concedido por defecto al instalar, pero el canal sigue siendo obligatorio para que la notificación se muestre con la importancia configurada.

**d) Código que decide entre notificación y aviso dentro de la app al entregar desde mostrador:**
En [src/context/BibliotecaContext.tsx](src/context/BibliotecaContext.tsx#L261-L287):
```ts
const permisoActual = await getPermissionsAsync();
if (permisoActual.granted) {
  // programa notificación inmediata
} else {
  setAvisos((anterior) => [ ... ]);
}
```
Consulta el permiso **en ese momento** con `getPermissionsAsync()` en lugar de usar un valor guardado, lo cual importa porque el usuario pudo haber cambiado el permiso en Ajustes del sistema mientras la app estaba abierta.

---

### D3. Lo que tu app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
| :--- | :--- | :--- | :--- |
| iOS | `NSCameraUsageDescription` | Escaneo de códigos de barras EAN-13 en `/escanear`. | Plugin `expo-camera` en `app.json` |
| Android | `android.permission.CAMERA` | Escaneo de códigos de barras EAN-13 en `/escanear`. | Plugin `expo-camera` en `app.json` |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorios de devolución y avisos de turno. | Plugin `expo-notifications` / SDK 33+ |

**a) Por qué no declara `RECORD_AUDIO` aunque usa `expo-camera`:**
En `app.json`, el plugin `expo-camera` tiene `microphonePermission: false` y `recordAudioAndroid: false`, además de `android.permission.RECORD_AUDIO` incluido en `android.blockedPermissions`.

**b) Si mañana piden "elegir una foto de portada desde la galería":**
Usaría `expo-image-picker` (que utiliza el Photo Picker del sistema en Android 13+ e iOS sin requerir acceso amplio a toda la galería en versiones recientes, o `READ_MEDIA_IMAGES` / `NSPhotoLibraryUsageDescription` según configuración). **Hace falta una build nueva** (development build / EAS Build), porque agrega un módulo nativo nuevo y claves nativas en el manifiesto que no existen en el binario actual ni pueden enviarse por actualización OTA.

**c) Qué no se puede verificar del todo en Expo Go:**
Los textos de propósito personalizados de `app.json` (`NSCameraUsageDescription`), los canales propios con ícono/color de app independiente y `android.blockedPermissions`, porque Expo Go usa su propio binario precompilado con sus propios permisos y textos genéricos. Se verifican generando una **development build** (`npx expo run:android` / `eas build --profile development`).

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

**a) Ocho problemas encontrados en el fragmento del compañero:**
1. **Líneas 13–16 (Mala práctica / Rechazo en tiendas):** pide ambos permisos de cámara y notificaciones apenas monta el Catálogo, sin contexto ni pantalla previa de beneficio. Corrección: pedir cámara solo al entrar a `/escanear` previo paso por `/permisos/camara`, y notificaciones solo al activar "Recordarme".
2. **Líneas 18–20 (Error de ejecución / rendimiento):** `useEffect` sin array de dependencias. Se ejecuta en cada render, generando un bucle infinito de pedidos HTTP y re-renders. Corrección: agregar array de dependencias `[]` (o `[intento]`) y función de limpieza `cancelado = true`.
3. **Línea 10 y 22 (Mala práctica TypeScript):** uso de `any[]` y `{ libro: any }`. Corrección: tipar con `Libro[]` y `{ libro: Libro }`.
4. **Línea 22 (Rendimiento / Error de ejecución potencial):** componente `Fila` declarado **dentro** de `Catalogo`. En cada render de `Catalogo` se crea una función componente nueva, desmontando y remontando todas las filas. Corrección: extraer `TarjetaLibro` a nivel de módulo en `src/components/TarjetaLibro.tsx`.
5. **Línea 33 (Rendimiento):** usa `ScrollView` con `.map()` en vez de `FlatList`. Renderiza toda la lista de golpe aunque haya cientos de libros y no tiene `ListEmptyComponent`. Corrección: usar `FlatList` con `ListEmptyComponent`.
6. **Línea 35 (Advertencia / Mala práctica):** `key={i}` usando el índice del array. Corrección: `keyExtractor={(item) => item.isbn}`.
7. **Línea 25 (Mala práctica):** estilos en línea (`style={{ fontSize: 16, ... }}`) con colores/tamaños hardcodeados. Corrección: `StyleSheet.create` y constantes de `src/constants/tema.ts`.
8. **Líneas 18–20 y 33–40 (Mala práctica / UX):** no maneja estados de carga (`cargando`), error (`error` con botón reintentar) ni lista vacía; además la promesa no tiene `.catch()` ni limpieza al desmontar. Corrección: usar `useLibros()` + `<EstadoCarga />`, `<EstadoError />` y `<EstadoVacio />`.
9. **Líneas 24 y 37 (Accesibilidad):** botones `<Pressable>` sin `accessibilityRole="button"`, sin área táctil mínima de 44×44 y el botón de cámara solo con ícono sin `accessibilityLabel`.

**b) Qué pasa durante el primer minuto con el `useEffect` sin dependencias:**
Al montar, el efecto llama a `obtenerLibros()`. A los 800 ms (si no falla) llama a `setLibros(datos)` con una copia nueva de objetos (`[{ ...libro }, ...]`). Como la referencia del array es nueva, React re-renderiza `Catalogo`. Al terminar ese render, como el `useEffect` no tiene array de dependencias, vuelve a ejecutarse y vuelve a pedir `obtenerLibros()`, creando un bucle infinito cada ~800 ms (salvo cuando falla el 20% de las veces, donde una promesa rechazada sin `.catch()` corta la cadena). Si `obtenerLibros()` devolviera **siempre la misma referencia de array**, después del primer `setLibros` (cuando pasa de `[]` inicial a `LIBROS`), en el segundo llamado React compararía por `Object.is(prev, next)` y al ser la misma referencia **no** volvería a re-renderizar, frenando el bucle en el segundo pedido.

**c) Reescritura usando nuestros hooks, componentes y constantes:**
Corresponde exactamente a nuestra implementación en [src/app/(tabs)/(catalogo)/index.tsx](src/app/(tabs)/(catalogo)/index.tsx#L1-L140), usando `useLibros()`, `useBiblioteca()`, `EstadoCarga`, `EstadoError`, `EstadoVacio`, `TarjetaLibro`, `BarraRecientes`, `FlatList` con `keyExtractor={(item) => item.isbn}` y `StyleSheet.create` con `COLORES`, `ESPACIADOS` y `TAMANIOS`.

**d) Rechazo en tienda vs desinstalación primero:**
- **Rechazo en tienda:** pedir permisos de cámara y notificaciones en el montaje inicial sin explicación ni contexto claro (violación de guías de Apple App Store y Google Play sobre solicitud de permisos).
- **Desinstalación primero:** el bucle infinito de `useEffect` consumiendo red y batería constantemente, o una pantalla que se queda en blanco silenciosamente cuando `obtenerLibros()` falla sin `.catch()` ni botón de reintento.

---

### E2. Organización y acoplamiento

**a) Grafo de importaciones:**
- `src/app/*` → importa de `components`, `hooks`, `context`, `constants`, `data`, `types`.
- `src/context/*` → importa de `estructuras`, `data`, `types`.
- `src/hooks/*` → importa de `lib`, `types`.
- `src/components/*` → importa de `constants`, `types`.
- `src/lib/*` → importa de `data`, `types`.
- `src/data/*` → importa de `types`.
- `src/estructuras/*` y `src/constants/*` y `src/types/*` → sin dependencias hacia arriba.

No existe ninguna importación "hacia arriba" (por ejemplo, un hook importando desde `src/app`). Eso sería un problema porque acoplaría la lógica reutilizable a pantallas concretas, generaría dependencias circulares y rompería la portabilidad y testabilidad de los hooks.

**b) Cambio a una API real:**
Si el catálogo viniera de una API real (`fetch` / `axios`), solo cambiaría [src/lib/api.ts](src/lib/api.ts) (y eventualmente [src/data/libros.ts](src/data/libros.ts) si se eliminan los datos locales). Que cambien 1 o 2 archivos demuestra un buen desacoplamiento entre la capa de datos/red y la interfaz/hooks.

**c) `<ConPermiso recurso="camara">` vs `usePermiso` + pantalla previa:**
Un componente envoltorio `<ConPermiso>` simplificaría el JSX de pantallas que muestran UI bloqueada detrás de un permiso (como la cámara), pero **perderíamos** flexibilidad de flujo (por ejemplo, mantener el ingreso manual de ISBN siempre visible debajo aunque la cámara esté bloqueada) y **no serviría para las notificaciones**, porque el permiso de notificaciones se dispara desde una acción imperativa (el `onValueChange` del `Switch` "Recordarme"), no al renderizar una pantalla o envolver un componente.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
| :--- | :--- | :--- |
| `obtenerLibros()` falla | Mensaje amigable "No pudimos cargar el catálogo..." + botón "Reintentar". | `src/hooks/useLibros.ts` (líneas 34–39) y `src/app/(tabs)/(catalogo)/index.tsx` (líneas 24–26) |
| Se abre `/libro/abc` | Mensaje "ISBN inválido" + botón "Volver al catálogo". | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 8–9 y 33–50) |
| Se escanea un ISBN que no está en el catálogo | Banner flotante amarillo avisando que el código no pertenece al catálogo y sigue escaneando. | `src/app/escanear.tsx` (líneas 49–55 y 83–87) |
| La cámara está bloqueada | Tarjeta "Cámara bloqueada en Ajustes", botón "Ir a Ajustes" y campo para escribir ISBN manual. | `src/app/escanear.tsx` (líneas 89–111) |
| Las notificaciones están denegadas | Estado "Notificaciones sin activar / bloqueadas", aviso en pantalla y avisos visibles dentro de `/reservas`. | `src/app/(tabs)/reservas.tsx` (líneas 56–74, 93–97, 108–124) y `src/context/BibliotecaContext.tsx` (líneas 277–286) |
| Se intenta reservar un libro ya reservado | Aviso "Ya tenés este libro en préstamo o en lista de espera" y botón "Ver en Mis reservas". | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 97–107) y `src/app/reservar/[isbn].tsx` (líneas 55–66 y 77–83) |
| "Entregar al siguiente" con lista vacía | El libro no figura en listas activas y si se invocara devuelve `{ entregadoA: null }` con aviso seguro. | `src/context/BibliotecaContext.tsx` (líneas 235–238) y `src/app/mostrador.tsx` (líneas 19–32 y 34–44) |
| Login con clave incorrecta | Mensaje de error claro "Usuario o clave incorrectos..." sin cerrar el modal. | `src/app/login.tsx` (líneas 26–32 y 71) |

---

### E4. Decisiones con argumentos

**a) Identificador (ISBN vs id numérico propio):**
Se usó `isbn` (`string` de 13 dígitos) como parámetro de ruta y `key`, respetando el tipo `Libro` provisto en el enunciado. Su ventaja es que coincide directamente con el código de barras EAN-13 escaneado en la contratapa y evita una tabla de traducción extra. Como `useLocalSearchParams` puede devolver `string | string[] | undefined`, se normalizó explícitamente (`Array.isArray(isbn) ? isbn[0] : isbn`). Si en el futuro hubiera libros antiguos sin ISBN o dos ediciones distintas del mismo título que compartieran ficha, convendría migrar a un `id` interno único (UUID o numérico) y usar el ISBN como campo indexado secundario.

**b) Estructuras (`Pila` / `Cola` con `#items` vs arrays en estado):**
Usar `Pila` y `Cola` con `#items` privados garantizó invariantes claros (`desencolar` sin `shift()`, `verTope`, `aArray()`) y ocultó la representación interna a las pantallas. Lo que complicó al combinarlo con React es que la detección de cambios de React es por referencia (`Object.is`), obligando a exponer `.clonar()` para producir una nueva instancia en cada `setState` en lugar de mutar la existente.

**c) Memorización (`useMemo` / `useCallback`):**
- **Dónde aporta:** en el `value` de `BibliotecaProvider` ([src/context/BibliotecaContext.tsx](src/context/BibliotecaContext.tsx#L326-L366)) con `useMemo` y sus funciones con `useCallback`, para que un re-render del Provider que no cambie el valor no dispare renders en todos los consumidores.
- **Dónde sería ruido:** envolver expresiones baratas como `disponibles > 0` o handlers simples de botones que no se pasan a componentes memorizados con `React.memo`.
- **Cómo comprobarlo:** midiendo con **React DevTools Profiler** (grabando una interacción antes y después de memorizar y comparando el tiempo de commit y la cantidad de componentes re-renderizados), en lugar de suponerlo.

**d) Datos duplicados (`ejemplaresDisponibles`):**
No se guardó una copia mutable de los ejemplares disponibles en el estado; se calculan dinámicamente en `obtenerEjemplaresDisponibles(libro)` ([src/context/BibliotecaContext.tsx](src/context/BibliotecaContext.tsx#L104-L111)) a partir de `libro.ejemplares` y `prestamos`. Si el mismo dato viviera en dos lugares (por ejemplo, un estado `ejemplaresPorIsbn` y el array `prestamos`), al devolver un libro y olvidar actualizar uno de los dos estados aparecería una inconsistencia (préstamo devuelto pero 0 ejemplares disponibles). Al calcularlo de una única fuente de verdad, ese error es imposible.
