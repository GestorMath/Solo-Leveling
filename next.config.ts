import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ATIVAR em produção — detecta side effects e duplas chamadas de useEffect
  reactStrictMode: false, // manter false em dev para não duplicar saves no Supabase

  typescript: {
    ignoreBuildErrors: false,
  },

  // Otimização de imagens — domínios confiáveis
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Formatos modernos para melhor performance
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de segurança e cache
  async headers() {
    return [
      // ── Headers de segurança em todas as rotas ─────────────────────────
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP: ajustar domínios conforme necessário
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requer unsafe-eval em dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} wss://*.supabase.co https://accounts.google.com`,
              "img-src 'self' data: blob: https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },

      // ── Assets estáticos Next.js — imutáveis, cache longo ─────────────
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ── Ícones e manifest ─────────────────────────────────────────────
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },

      // ── Service Worker — nunca cachear o sw.js em si ───────────────────
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },

      // ── Offline page ──────────────────────────────────────────────────
      {
        source: '/offline.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },

  // Redirects de rotas antigas ou alternativas
  async redirects() {
    return [
      // Redirecionar /routine (página duplicada/inacessível) para /Dashboard/routines
      {
        source: '/routine',
        destination: '/Dashboard/routines',
        permanent: true,
      },
    ]
  },
}

export default nextConfig