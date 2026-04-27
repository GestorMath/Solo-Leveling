// public/sw.js — Solo Leveling PWA Service Worker
// Cache version: bump este número a cada deploy para invalidar o cache antigo
const CACHE_VERSION = 'sl-v1'
const STATIC_CACHE  = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`

// Assets que sempre devem estar em cache (shell do app)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
]

// Domínios que nunca devem ser interceptados pelo SW (auth, APIs externas)
const BYPASS_DOMAINS = [
  'supabase.co',
  'googleapis.com',
  'accounts.google.com',
]

// ── Install ────────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('[SW] Install cache error:', err))
  )
  // Ativa imediatamente sem esperar tabs fecharem
  self.skipWaiting()
})

// ── Activate ───────────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )
    )
  )
  // Assume controle de todas as tabs imediatamente
  self.clients.claim()
})

// ── Fetch ──────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests que não são GET
  if (request.method !== 'GET') return

  // Ignorar extensões do browser e protocolos especiais
  if (!url.protocol.startsWith('http')) return

  // Ignorar domínios externos críticos (Supabase, Google OAuth, etc.)
  if (BYPASS_DOMAINS.some(d => url.hostname.includes(d))) return

  // Ignorar Next.js HMR e DevTools
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  if (url.pathname.startsWith('/__nextjs')) return

  // ── Estratégia por tipo de recurso ──────────────────────────────────────────

  // Assets estáticos do Next.js (_next/static) — Cache First, imutáveis
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Fontes e ícones — Cache First
  if (
    url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Imagens — Stale While Revalidate
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
    return
  }

  // Páginas HTML — Network First com fallback para offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Tudo mais — Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ── Estratégias de cache ───────────────────────────────────────────────────────

/** Cache First: serve do cache, só busca na rede se não existir */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/** Network First: tenta rede primeiro, fallback para cache */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

/** Network First para HTML com fallback para /offline.html */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback para página offline customizada
    const offline = await caches.match('/offline.html')
    return offline || new Response('<h1>Offline</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

/** Stale While Revalidate: serve cache enquanto atualiza em background */
async function staleWhileRevalidate(request, cacheName) {
  const cache    = await caches.open(cacheName)
  const cached   = await cache.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || await fetchPromise || new Response('Offline', { status: 503 })
}

// ── Push Notifications ─────────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Solo Leveling', {
      body:    data.body    || '',
      icon:    data.icon    || '/icons/icon-192x192.png',
      badge:   data.badge   || '/icons/badge-72x72.png',
      data:    data.url     || '/',
      vibrate: [200, 100, 200],
      tag:     data.tag     || 'sl-notification',
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = event.notification.data || '/'
      const existing = list.find(c => c.url === url && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})