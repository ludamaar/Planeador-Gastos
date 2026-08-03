# Memoria del proyecto

> Contexto duradero para el asistente de IA. Se lee al empezar a trabajar en el
> repositorio y se actualiza cuando aparece algo que valdría la pena recordar en
> la próxima sesión. Guarda lo duradero, ignora lo efímero.

## Resumen del proyecto

Planeador de Gastos: una aplicación web de una sola página para planear y
controlar gastos e ingresos por año y por mes. Todo funciona en el navegador,
sin backend. El idioma de la aplicación y del usuario es el español.

## Decisiones

- Es una aplicación **de un solo archivo**: casi todo (HTML, CSS y JavaScript)
  vive en `planeador.html`. `index.html` solo redirige a `planeador.html`.
- La persistencia es **100% local en el navegador** vía `localStorage`; no hay
  servidor ni base de datos.

## Convenciones

- La navegación entre secciones se hace con la función `irA(id)` y botones con
  id `sn-*`; cada sección es un `<div class="sec" id="sec-*">`.
- Secciones actuales: Planeador (`plan`), Cargar estado de cuenta (`import`),
  Detalle movimientos (`det`), Dashboard (`dash`), Por Categoría (`cats`).
- Guardar el estado se hace siempre con `guardar()` tras modificar `S` (el
  objeto de estado), normalmente seguido de `render()`.

## Estructura y datos

- La clave de `localStorage` es `planeador_v3` (constante `KEY` en
  `planeador.html`).
- `guardar()` no persiste si el estado serializado supera ~4 MB, para no romper
  `localStorage`.

## Preferencias del usuario

- Comunicación e interfaz en **español**.

## Trampas y avisos

- No cambiar la clave `KEY` (`planeador_v3`) a la ligera: al arrancar, el código
  borra claves antiguas (`planeador_v1`, `planeador_v2`, `pgv7`, etc.). Cambiar
  o eliminar `planeador_v3` haría que los usuarios pierdan sus datos guardados.
- Al ser un único archivo grande (~1,2 MB), edita con cambios localizados; no lo
  reescribas entero.
