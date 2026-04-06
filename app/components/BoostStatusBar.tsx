'use client'
import { useSystem } from '../context/SystemContext'
import { Zap, Timer } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function BoostStatusBar() {
  // Chamada simplificada (o erro de null já é tratado no hook useSystem)
  const { activeBoosts } = useSystem()
  const [now, setNow] = useState(Date.now())

  // Atualizador de tempo real (Tick de 1 segundo)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Filtra apenas boosts que ainda não expiraram
  const activeEntries = Object.entries(activeBoosts).filter(
    ([_, endTime]) => endTime > now
  )

  // Se não houver protocolo ativo, o componente é invisível
  if (activeEntries.length === 0) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-3 pointer-events-none">
      {activeEntries.map(([id, endTime]) => {
        const diff = endTime - now
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        const timeString = `${m}:${s < 10 ? '0' : ''}${s}`

        return (
          <div 
            key={id} 
            className="pointer-events-auto bg-black/90 border border-yellow-500/50 backdrop-blur-xl px-4 py-2 flex items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] animate-in fade-in zoom-in duration-300"
          >
            <div className="relative">
              <Zap size={16} className="text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 bg-yellow-500 blur-md opacity-20 animate-ping" />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] leading-none">
                PROTOCOL_{id.toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Timer size={10} className="text-yellow-500/70" />
                <span className="text-xs font-mono text-yellow-400 font-bold leading-none">
                  {timeString}
                </span>
              </div>
            </div>

            {/* Indicadores Visuais de Status */}
            <div className="flex flex-col gap-1 ml-2 opacity-30">
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
              <div className="w-4 h-[1px] bg-yellow-500" />
            </div>
          </div>
        )
      })}
    </div>
  )
}