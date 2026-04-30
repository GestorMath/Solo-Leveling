'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // O Service Worker só é registrado em ambiente de produção para evitar bugs em dev
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('[SW] Sistema Online (Cache Ativo):', reg.scope))
        .catch(err => console.error('[SW] Falha no Registro:', err))
    }
  }, [])
  return null
}