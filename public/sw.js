// Solo Leveling PWA - Service Worker v2
// ARQUIVO: public/sw.js  (JavaScript puro, NÃO TypeScript)

const CACHE_NAME = 'solo-leveling-v2'
const DATA_CACHE = 'solo-leveling-data-v2'
const OFFLINE_PAGE = '/offline'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/intro',
  '/manifest.json',
]

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('[SW] Cache install warning:', err))
  )
  self.skipWaiting()
})

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Solo Leveling', body: event.data.text() }
  }

  const options = {
    body: data.body || 'Suas missões aguardam, Caçador.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '⚔️ Acessar' },
      { action: 'close', title: 'Dispensar' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '⚔️ Solo Leveling', options)
  )
})

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'close') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora tudo que não é GET
  if (request.method !== 'GET') return
  // Supabase sempre vai para a rede
  if (url.hostname.includes('supabase.co')) return
  // Google fonts
  if (url.hostname.includes('googleapis.com')) return
  if (url.hostname.includes('gstatic.com')) return

  // API routes → Network-First (dados sempre frescos)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos do Next.js → Cache-First (nunca mudam)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Páginas HTML → Stale-While-Revalidate (mostra rápido, atualiza em background)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Todo o resto → Cache-First com fallback
  event.respondWith(cacheFirst(request))
})

// ── ESTRATÉGIAS DE CACHE ──────────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const offline = await caches.match(OFFLINE_PAGE)
    return offline || new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || await networkPromise || new Response('Offline', { status: 503 })
}