import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // false em dev evita double-save do useEffect no SystemContext
  // Em produção o Next.js ignora isso de qualquer forma
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  // Headers de cache para assets estáticos (melhora performance PWA)
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        // Garante que o Service Worker pode ser servido com o header correto
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
    ]
  },
};

export default nextConfig;