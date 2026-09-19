// Minimal service worker: cache same-origin GET assets so the app shell keeps
// working when the connection drops. API calls (a different origin) are never
// cached, so data is always fresh when online.
const CACHE = 'warsha-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(req, copy))
        return res
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('/index.html')),
      ),
  )
})
