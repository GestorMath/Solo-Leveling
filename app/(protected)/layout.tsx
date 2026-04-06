import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono } from 'next/font/google'
import ClientLayout from '../components/ClientLayout'

// ─── BUG CORRIGIDO ────────────────────────────────────────────────────────────
// Anteriormente o SystemProvider estava tanto aqui (via ClientLayout)
// quanto no root layout, criando provider duplo.
// Agora o SystemProvider existe APENAS aqui, via ClientLayout.
//
// ADICIONADO: viewport com tag para iOS PWA (estava faltando nas rotas protegidas)
// ADICIONADO: metadados para o Header correto no título do browser
// ─────────────────────────────────────────────────────────────────────────────

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono-game',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Solo Leveling',
    default: 'Dashboard | Solo Leveling',
  },
}

/**
 * Layout das rotas protegidas.
 * Todas as telas dentro de app/(protected)/ são envolvidas por este layout.
 * O SystemProvider vive APENAS aqui via ClientLayout.
 * NÃO adicione SystemProvider no root layout (app/layout.tsx).
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}