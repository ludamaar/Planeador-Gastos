/* Service worker de Captura de Gastos.
 *
 * Objetivo: que la app abra aunque no haya señal, pero que NUNCA se te quede
 * pegada en una versión vieja.
 *
 * Estrategia:
 *   · La página (captura.html) va PRIMERO A LA RED, con 2.5 s de paciencia.
 *     Si hay señal, siempre ves la versión más nueva en el primer intento.
 *     Si no hay, sale al instante la copia guardada.
 *   · Los demás archivos del mismo origen (manifest, iconos) salen de caché
 *     primero y se refrescan en segundo plano.
 *   · Las llamadas a Google Apps Script NUNCA se cachean: la sincronización
 *     necesita datos frescos, y si no hay red la app ya guarda en cola sola.
 */

const CACHE = 'captura-v6';
const ESPERA_RED = 2500;   // ms que aguantamos a la red antes de usar la copia

const ARCHIVOS = [
  './',
  './captura.html',
  './manifest.webmanifest'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // si algo no se pudo guardar, seguimos
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, resp) {
  if (resp && resp.status === 200 && resp.type === 'basic') {
    const copia = resp.clone();
    caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
  }
  return resp;
}

// La página: red primero, con límite de paciencia; si falla, la copia guardada.
function redPrimero(req) {
  return caches.match(req).then(cacheada => {
    const red = fetch(req).then(r => guardar(req, r));
    const conLimite = new Promise(resolver => {
      let listo = false;
      red.then(r => { listo = true; resolver(r); }).catch(() => {
        listo = true;
        resolver(cacheada || Response.error());
      });
      setTimeout(() => {
        if (!listo && cacheada) resolver(cacheada);   // tardó demasiado: copia guardada
      }, ESPERA_RED);
    });
    return conLimite;
  });
}

// Lo demás: caché primero y a refrescar en segundo plano.
function cachePrimero(req) {
  return caches.match(req).then(cacheada => {
    const red = fetch(req).then(r => guardar(req, r)).catch(() => cacheada);
    return cacheada || red;
  });
}

self.addEventListener('fetch', ev => {
  const req = ev.request;

  // Solo GET del mismo origen; lo demás (POST a Apps Script) va directo a la red
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Google Apps Script, etc.

  const esPagina = req.mode === 'navigate' ||
                   (req.headers.get('accept') || '').indexOf('text/html') >= 0 ||
                   /\.html?$/.test(url.pathname) ||
                   url.pathname.endsWith('/');

  ev.respondWith(esPagina ? redPrimero(req) : cachePrimero(req));
});

// Permite que la página pida activar una versión nueva sin esperar
self.addEventListener('message', ev => {
  if (ev.data === 'actualizar') self.skipWaiting();
});
