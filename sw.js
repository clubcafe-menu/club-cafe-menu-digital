// Club Café — service worker
// Règle simple : le réseau d'abord (le client voit toujours la dernière version),
// le cache seulement si la connexion est coupée. Aucun fichier à lister à la main.
const CACHE = "club-cafe-v11";

// Fichiers préchargés à l'installation (facultatif : tout fichier visité est mis en cache automatiquement).
const ASSETS = ["./", "./index.html", "./css/style.css", "./js/app.js", "./js/data.js", "./js/install.js", "./js/sheet.js", "./manifest.webmanifest", "./favicon.ico", "./images/visual-432.jpg", "./images/visual-404.jpg", "./images/visual-402.jpg", "./images/visual-322.jpg", "./images/visual-400.jpg", "./images/visual-430.jpg", "./images/visual-433.jpg", "./images/visual-431.jpg", "./images/visual-434.jpg", "./images/logo.png", "./images/visual-401.jpg", "./images/img-4e814162b8.jpg", "./images/icon-512.png", "./images/visual-403.jpg", "./images/visual-427.jpg", "./images/visual-411.jpg", "./images/apple-touch-icon.png", "./images/icon-192.png", "./images/visual-412.jpg"];

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
      // Images : cache d'abord (affichage immédiat), mise à jour en arrière-plan.
      if (req.destination === 'image') {
        const cached = await caches.match(req, { ignoreSearch: true });
        const refresh = fetch(url.href, { credentials: 'same-origin' }).then(res => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copy)));
          }
          return res;
        }).catch(() => cached || Response.error());
        return cached || refresh;
      }
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
