---
name: memoria
description: >-
  Memoria persistente del proyecto para el asistente de IA. Da a Claude un
  archivo de memoria a largo plazo (.claude/memoria/memoria.md) donde registra y
  consulta hechos duraderos: decisiones de diseño, convenciones del código,
  preferencias del usuario, estructura de datos y contexto que no debería
  reaprenderse en cada sesión. Usa esta skill SIEMPRE al empezar a trabajar en
  este repositorio para cargar el contexto acumulado, y cada vez que descubras
  algo duradero que valga la pena recordar (una convención, una decisión, una
  preferencia, un "no toques esto porque..."), aunque el usuario no pida
  explícitamente "guardar en memoria". También úsala cuando el usuario diga
  cosas como "recuerda que...", "para la próxima ten en cuenta...", "¿qué sabes
  de este proyecto?" o "¿qué habíamos decidido sobre...?".
---

# Memoria

Esta skill le da al asistente una **memoria persistente** del proyecto. Sin
ella, cada sesión empieza de cero: se repiten las mismas preguntas, se rompen
convenciones ya acordadas y se vuelven a proponer ideas que ya se descartaron.
La memoria evita ese desgaste guardando lo que importa en un archivo del propio
repositorio, versionado con git.

## Dónde vive la memoria

Todo se guarda en un único archivo:

```
.claude/memoria/memoria.md
```

Si no existe todavía, créalo a partir de la plantilla que hay en
`assets/plantilla.md` (cópiala tal cual y empieza a rellenarla). Al estar dentro
del repositorio y versionado, la memoria viaja con el proyecto y es la misma
para cualquier sesión que se abra sobre él.

## Cuándo leer la memoria

Léela **al principio** de cualquier trabajo no trivial sobre este repositorio,
antes de empezar a cambiar código o responder preguntas de fondo sobre el
proyecto. Es una lectura barata que te ahorra proponer algo que ya se decidió o
preguntar algo que ya está anotado. Si el archivo no existe aún, no pasa nada:
simplemente todavía no hay memoria acumulada.

## Cuándo escribir en la memoria

La memoria solo es útil si se mantiene al día, pero se vuelve ruido si se llena
de todo. La regla es sencilla: **guarda lo duradero, ignora lo efímero.**

Guarda cuando aparezca algo que seguiría siendo cierto y útil dentro de un mes:

- **Decisiones**: "Los importes se guardan en céntimos como enteros para evitar
  errores de coma flotante." Anota también el *porqué*, no solo el qué.
- **Convenciones**: cómo se nombran las cosas, qué patrón sigue el código,
  dónde va cada tipo de archivo.
- **Preferencias del usuario**: idioma, estilo, herramientas que prefiere o
  evita, nivel de detalle que espera.
- **Trampas y avisos**: "No renombrar la clave de localStorage `pg_v7` o se
  pierden los datos guardados de los usuarios."
- **Estructura y datos**: cómo se organiza el estado, qué formato tienen los
  datos, qué depende de qué.

No guardes lo que caduca enseguida: el paso concreto en el que vas de una tarea,
resultados temporales, detalles de un bug ya resuelto, o cualquier cosa que se
lee mejor del propio código. Ante la duda, pregúntate: *"¿Me alegraría de leer
esto al empezar la próxima sesión?"* Si la respuesta es no, no lo guardes.

Actualiza la memoria de forma natural, sin interrumpir el trabajo, cuando:

- Descubras una de las cosas de la lista de arriba.
- El usuario diga explícitamente "recuerda que…", "apunta que…" o "para la
  próxima ten en cuenta…".
- Notes que algo anotado ya no es cierto: **corrígelo o bórralo**. Una memoria
  desactualizada es peor que no tener memoria, porque induce a error.

## Cómo escribir bien

Cada entrada debe entenderse por sí sola, sin el contexto de la conversación en
la que nació. "Cambiarlo a verde" no sirve dentro de un mes; "El color de acento
de la interfaz es `#1D9E75` (verde), definido en el `<style>` de `planeador.html`"
sí.

Sé conciso pero completo: una o dos frases por entrada suele bastar. Agrupa cada
entrada bajo el apartado correcto de la plantilla en vez de amontonarlas. Cuando
edites, prefiere **reescribir la entrada afectada** antes que añadir una nueva
que contradiga a la vieja: el archivo debe leerse como un estado actual
coherente, no como un registro histórico de cambios de opinión.

## Confirmación

No hace falta pedir permiso para cada anotación menor; guarda lo duradero como
parte natural del trabajo. Sí conviene avisar brevemente ("Lo apunto en la
memoria del proyecto") cuando registres una decisión importante, para que el
usuario sepa que quedó constancia y pueda corregirte si lo entendiste mal.
