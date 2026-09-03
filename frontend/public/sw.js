// A minimal service worker - the piece of technology that lets a
// website be "installed" like an app and gives the browser a hook for
// offline behavior. This one is deliberately simple: it lets the
// browser install ShilpSetu as an app, and provides basic protection
// if the network drops mid-request. Full offline caching of every
// screen is a later refinement (once the app is built for production
// in Phase 16), not needed for local development.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Network-first: always try to load the latest version. Only falls
  // back to a cached copy if the network request fails entirely.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
