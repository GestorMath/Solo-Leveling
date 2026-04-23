import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono-game',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Solo Leveling — Sistema de Evolução',
  description: 'Gamifique sua vida. Evolua todos os dias.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Projeto S',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
    icon: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#00ffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${shareTechMono.variable} bg-black`}>
      <head>
        {/* PWA — instalação no iPhone via Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Projeto S" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white antialiased font-mono">
        {children}
      </body>
    </html>
  )
}