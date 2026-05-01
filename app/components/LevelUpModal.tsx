'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useSystem, xpMaxForLevel } from '../context/SystemContext'
import { TrendingUp } from 'lucide-react'
import { pushNotification } from '../(protected)/notifications/page'

export default function LevelUpModal() {
  const { levelUpData, setLevelUpData, rank } = useSystem()

  // Disparar notificação quando o modal aparece
  useEffect(() => {
    if (!levelUpData.show || levelUpData.level === 0) return
    pushNotification({
      type:  'sistema',
      title: `⚡ LEVEL UP! Nível ${levelUpData.level}`,
      body:  `Você alcançou o nível ${levelUpData.level}. Continue evoluindo, Caçador.`,
    })
  }, [levelUpData.show, levelUpData.level])

  if (!levelUpData.show || levelUpData.level === 0) return null

  const prevLevel      = levelUpData.level - 1
  const newXpMax       = xpMaxForLevel(levelUpData.level)

  function handleConfirm() {
    setLevelUpData({ show: false, level: 0 })
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm overflow-hidden"
      onClick={handleConfirm}
    >
      {/* Grid animado */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Partículas */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400 pointer-events-none"
          style={{
            left:      `${20 + Math.random() * 60}%`,
            top:       `${20 + Math.random() * 60}%`,
            animation: `particleFloat ${1.5 + Math.random()}s ${Math.random() * 0.5}s ease-out infinite`,
            opacity:   0.6,
          }}
        />
      ))}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 border border-cyan-500/40 bg-black p-8 text-center font-mono"
        style={{ boxShadow: '0 0 60px rgba(34,211,238,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Ícone */}
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 flex items-center justify-center border-2 border-cyan-500"
            style={{ boxShadow: '0 0 20px rgba(34,211,238,0.5)' }}
          >
            <TrendingUp size={32} className="text-cyan-400" />
          </div>
        </div>

        {/* Label */}
        <p className="text-[9px] text-cyan-500/60 tracking-[0.4em] uppercase mb-3">
          // Integração completa
        </p>

        {/* Título */}
        <h1
          className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-5"
          style={{ textShadow: '0 0 30px rgba(0,255,255,0.4)' }}
        >
          LEVEL <span className="text-cyan-400">UP!</span>
        </h1>

        {/* Transição de nível */}
        <div className="flex items-center justify-center gap-6 py-4 px-6 border border-cyan-900/30 bg-slate-950/60 mb-4">
          <span className="text-slate-600 text-2xl font-black">Nv.{prevLevel}</span>
          <span className="text-cyan-500 text-xl animate-pulse">→</span>
          <span
            className="text-white text-3xl font-black"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
          >
            Nv.{levelUpData.level}
          </span>
        </div>

        {/* Info */}
        <div className="text-[9px] text-slate-500 mb-6 space-y-1">
          <p>Rank atual: <span className="text-cyan-400">{rank}</span></p>
          <p>
            Próximo nível requer:{' '}
            <span className="text-cyan-400">{newXpMax.toLocaleString()} XP</span>
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-all"
          style={{ boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}
        >
          Confirmar Evolução
        </button>

        <p className="text-[8px] text-slate-700 mt-3">
          // toque em qualquer lugar para fechar
        </p>
      </div>

      <style>{`
        @keyframes particleFloat {
          0%   { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-60px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}