// Kill-switch service worker.
//
// A previous build shipped a caching service worker that could leave clients
// stuck on a stale app shell. This replacement caches nothing: on activation it
// clears every cache, unregisters itself, and reloads any pages it controls so
// they load fresh directly from the network. Browsers check sw.js for updates
// on navigation (bypassing the HTTP cache), so stuck clients pick this up and
// self-heal on their next visit. The app no longer registers a service worker.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})
