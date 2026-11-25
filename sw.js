const CACHE = "club-cafe-v2";
const ASSETS = ["./", "./index.html", "./css/style.css", "./js/app.js", "./js/data.js", "./manifest.webmanifest", "./favicon.ico", "./images/visual-432.jpg", "./images/featured-311.webp", "./images/visual-404.jpg", "./images/visual-402.jpg", "./images/visual-322.jpg", "./images/visual-400.jpg", "./images/visual-430.jpg", "./images/visual-433.jpg", "./images/img-4642770032.jpg", "./images/visual-431.jpg", "./images/img-b1947fe02a.jpg", "./images/visual-434.jpg", "./images/logo.png", "./images/img-4131d354ac.jpg", "./images/visual-401.jpg", "./images/img-4e814162b8.jpg", "./images/icon-512.png", "./images/img-9f036613a9.jpg", "./images/featured-322.webp", "./images/visual-403.jpg", "./images/visual-427.jpg", "./images/featured-312.webp", "./images/visual-411.jpg", "./images/apple-touch-icon.png", "./images/img-66055f4bea.jpg", "./images/icon-192.png", "./images/visual-412.jpg"];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('club-cafe-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
 const req = event.request;
 if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
 event.respondWith(fetch(req).then(response => {
  if(response.ok && (req.mode === 'navigate' || ASSETS.some(path => new URL(path,self.registration.scope).href === req.url))) {
   const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));
  }
  return response;
 }).catch(async()=> (await caches.match(req)) || (req.mode === 'navigate' ? await caches.match('./index.html') : Response.error())));
});
