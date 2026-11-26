// Club Café — service worker
// Règle simple : le réseau d'abord (le client voit toujours la dernière version),
// le cache seulement si la connexion est coupée. Aucun fichier à lister à la main.
const CACHE = "club-cafe-v7";

// Fichiers préchargés à l'installation (facultatif : tout fichier visité est mis en cache automatiquement).
const ASSETS = ["./", "./index.html", "./css/style.css", "./js/app.js", "./js/data.js", "./js/install.js", "./js/sheet.js", "./manifest.webmanifest", "./favicon.ico", "./images/visual-432.jpg", "./images/visual-404.jpg", "./images/visual-402.jpg", "./images/visual-322.jpg", "./images/visual-400.jpg", "./images/visual-430.jpg", "./images/visual-433.jpg", "./images/img-4642770032.jpg", "./images/visual-431.jpg", "./images/img-b1947fe02a.jpg", "./images/visual-434.jpg", "./images/logo.png", "./images/img-4131d354ac.jpg", "./images/visual-401.jpg", "./images/img-4e814162b8.jpg", "./images/icon-512.png", "./images/img-9f036613a9.jpg", "./images/visual-403.jpg", "./images/visual-427.jpg", "./images/visual-411.jpg", "./images/apple-touch-icon.png", "./images/img-66055f4bea.jpg", "./images/icon-192.png", "./images/visual-412.jpg"];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache =>
    // Un fichier manquant ne doit jamais bloquer l'installation.
    Promise.allSettled(ASSETS.map(path => cache.add(new Request(path, { cache: 'reload' }))))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('club-cafe-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;

  event.respondWith((async () => {
    try {
      // 'no-cache' : vérifie auprès du serveur à chaque fois (pas d'ancien fichier gardé par le navigateur).
      const response = await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' });
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copy)));
      }
      return response;
    } catch (error) {
      // Hors ligne : version gardée en cache.
      return (await caches.match(req, { ignoreSearch: true }))
        || (req.mode === 'navigate' ? await caches.match('./index.html') : Response.error());
    }
  })());
});
