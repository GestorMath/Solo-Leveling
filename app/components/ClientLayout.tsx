'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { SystemProvider } from '../context/SystemContext'
import Header from './Header'
import AlertPopup from './AlertPopup'
import BottomNav from './BottomNav'
import LevelUpModal from './LevelUpModal'
import BoostStatusBar from './BoostStatusBar'
import Sidebar from './Sidebar'
import DespertarModal from './DespertarModal'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SystemProvider>
      {/* Modais globais por ordem de z-index */}
      <DespertarModal />   {/* z-[20000] — bloqueia tudo até tarefa completada */}
      <LevelUpModal />     {/* z-[10000] */}
      <BoostStatusBar />   {/* z-[999]   */}

      <div className="flex min-h-screen bg-black selection:bg-cyan-500/30 selection:text-cyan-200">
        <Sidebar />

        <div className="flex-1 flex flex-col relative min-w-0">
          <Header />
          <AlertPopup />

          <main className="flex-1 pt-24 pb-20 md:pb-8 px-4 md:px-8 relative z-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>

          <BottomNav />
        </div>

        {/* Scanline único — pointer-events-none obrigatório */}
        <div className="scanline pointer-events-none fixed inset-0 z-40 opacity-30" />
      </div>
    </SystemProvider>
  )
}