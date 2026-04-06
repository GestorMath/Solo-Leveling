// ─────────────────────────────────────────────────────────────────────────────
// service-worker.ts — Solo Leveling PWA
// Estratégia: Cache-First para assets estáticos, Network-First para API/dados
//
// COMO REGISTRAR:
//   Em app/layout.tsx, adicione no useEffect client-side:
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js').catch(console.error)
//   }
//
// COMPILAÇÃO:
//   Renomeie para sw.ts e coloque em /public/sw.ts
//   OU use a lib 'next-pwa' para compilação automática
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME     = 'arise-v2-static'
const DATA_CACHE     = 'arise-v2-dynamic'
const OFFLINE_PAGE   = '/offline'

const STATIC_ASSETS = [
  '/',
  '/Dashboard',
  '/quests',
  '/shop',
  '/inventory',
  '/profile',
  '/settings',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── INSTALL: pré-cacheia assets críticos ─────────────────────────────────────
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  // Força ativação imediata sem esperar abas existentes fecharem
  ;(self as any).skipWaiting()
})

// ── ACTIVATE: limpa caches antigos ────────────────────────────────────────────
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  ;(self as any).clients.claim()
})

// ── FETCH: estratégia híbrida ─────────────────────────────────────────────────
self.addEventListener('fetch', (event: any) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requests não-GET e requests para o Supabase (sempre online)
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('googleapis.com')) return

  // API routes → Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos (_next/static) → Cache-First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Páginas → Stale-While-Revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Demais → Cache-First com fallback
  event.respondWith(cacheFirst(request))
})

// ── ESTRATÉGIAS ───────────────────────────────────────────────────────────────

async function cacheFirst(request: Request): Promise<Response> {
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
    return caches.match(OFFLINE_PAGE) || new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request: Request): Promise<Response> {
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

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache  = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || await networkPromise || caches.match(OFFLINE_PAGE) || new Response('Offline', { status: 503 })
}

export {}