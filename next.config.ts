import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite o app rodar sem erros de CORS no localhost
  experimental: {
    // Desativa otimizações que causam problemas no dev sem domínio
  },
  // Remove o strict mode que causa double-render em dev
  reactStrictMode: false,
  // Desativa o telemetry de build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;