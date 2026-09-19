/* Service worker de Captura de Gastos.
 *
 * Objetivo: que la app abra aunque no haya señal.
 *
 * Estrategia:
 *   · La app (captura.html, manifest) se sirve DESDE CACHÉ primero, y en
 *     segundo plano se busca una versión nueva para la próxima vez. Así
 *     arranca al instante y funciona sin internet.
 *   · Las llamadas a Google Apps Script NUNCA se cachean: la sincronización
 *     necesita datos frescos, y si no hay red la app ya guarda en cola sola.
 */

const CACHE = 'captura-v3';

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

self.addEventListener('fetch', ev => {
  const req = ev.request;

  // Solo GET del mismo origen; lo demás (POST a Apps Script) va directo a la red
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Google Apps Script, etc.

  ev.respondWith(
    caches.match(req).then(cacheada => {
      const red = fetch(req)
        .then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copia = resp.clone();
            caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
          }
          return resp;
        })
        .catch(() => cacheada);                          // sin red: lo que haya en caché

      // Caché primero para arrancar instantáneo; si no está, lo que traiga la red
      return cacheada || red;
    })
  );
});

// Permite que la página pida activar una versión nueva sin esperar
self.addEventListener('message', ev => {
  if (ev.data === 'actualizar') self.skipWaiting();
});
