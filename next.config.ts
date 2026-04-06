import type { NextConfig } from "next";

// ─── BUG CORRIGIDO ────────────────────────────────────────────────────────────
// reactStrictMode estava desabilitado para "evitar double-render em dev".
// Isso é um antipadrão: o StrictMode detecta side-effects acidentais e bugs
// de cleanup nos useEffects. O double-render é INTENCIONAL e só ocorre em dev.
//
// Ocultar isso com reactStrictMode: false esconde bugs reais.
// O correto é corrigir os effects (garantir cleanup correto em useEffect).
//
// ADICIONADO: headers de cache para assets estáticos (melhora performance PWA)
// ─────────────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  // BUG FIX: StrictMode reativado — detecta problemas reais de useEffect
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  // Nota: a chave "eslint" foi removida do NextConfig no Next.js 16.
  // A configuração do ESLint é feita exclusivamente via eslint.config.mjs.

  // Melhoria de performance: headers de cache para assets estáticos
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
    ]
  },
};

export default nextConfig;