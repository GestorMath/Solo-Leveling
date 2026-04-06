import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import { SystemProvider } from '@/app/context/SystemContext'
import { ServiceWorkerRegistration } from '@/app/components/ServiceWorkerRegistration'

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono-game',
})

export const metadata: Metadata = {
  title: 'Solo Leveling — Sistema de Evolução',
  description: 'Gamifique sua vida. Suba de nível todos os dias.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arise',
  },
  icons: {
    apple: '/icons/icon-180.png',
  },
}

// Viewport separado do metadata (obrigatório no Next.js 15+)
export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${shareTechMono.variable} bg-black`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body className="bg-black text-white antialiased font-mono">
        {/*
          SystemProvider aqui = disponível em TODAS as rotas.
          Não repita em (protected)/layout.tsx.
        */}
        <SystemProvider>
          {children}
        </SystemProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}