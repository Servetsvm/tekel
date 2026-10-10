// TEKEL KASA — offline support. The page itself: from the network when there is one (so an update arrives at once),
// otherwise from the cache. The libraries (charts, barcode camera, icons): from the cache, renewed in the background.
// Exchange rates are never cached here (the program keeps the last rates itself).
// Change SURUM with every update of the files below.
const SURUM = 'tekel-v10';
const ONBELLEK = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => Promise.all(ONBELLEK.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== SURUM).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/exchangerate-api\.com|er-api\.com/.test(url.hostname)) return;   // rates: always from the network
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const k = r.clone(); caches.open(SURUM).then(c => c.put('./index.html', k)); return r; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const k = r.clone(); caches.open(SURUM).then(c => c.put(req, k)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
