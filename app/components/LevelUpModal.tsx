'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useSystem, xpMaxForLevel } from '../context/SystemContext'
import { TrendingUp } from 'lucide-react'

export default function LevelUpModal() {
  const { levelUpData, setLevelUpData, rank } = useSystem()

  if (!levelUpData.show || levelUpData.level === 0) return null

  const prevLevel = levelUpData.level - 1
  const newXpMax  = xpMaxForLevel(levelUpData.level)

  function handleConfirm() {
    setLevelUpData({ show: false, level: 0 })
  }

  return (
    // FIX: z-[10000] garante que fica acima de tudo (Header z-50, Sidebar z-40, BoostBar z-[999])
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm overflow-hidden"
      onClick={handleConfirm}
    >
      {/* Grid animado */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card central */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 border border-cyan-500/40 bg-black p-8 text-center"
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
        <p className="text-[9px] text-cyan-500/60 font-mono tracking-[0.4em] uppercase mb-3">
          // Integração completa
        </p>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-5">
          LEVEL <span className="text-cyan-400">UP!</span>
        </h1>

        {/* Transição de nível */}
        <div className="flex items-center justify-center gap-6 py-4 px-6 border border-cyan-900/30 bg-slate-950/60 mb-4">
          <span className="text-slate-600 text-2xl font-black font-mono">Nv.{prevLevel}</span>
          <span className="text-cyan-500 text-xl animate-pulse">→</span>
          <span
            className="text-white text-3xl font-black font-mono"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
          >
            Nv.{levelUpData.level}
          </span>
        </div>

        {/* Info adicional */}
        <div className="text-[9px] font-mono text-slate-500 mb-6 space-y-1">
          <p>Rank atual: <span className="text-cyan-400">{rank}</span></p>
          <p>Próximo nível requer: <span className="text-cyan-400">{newXpMax.toLocaleString()} XP</span></p>
        </div>

        {/* Botão */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-all"
          style={{ boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}
        >
          Confirmar Evolução
        </button>

        <p className="text-[8px] text-slate-700 mt-3 font-mono">
          // toque em qualquer lugar para fechar
        </p>
      </div>
    </div>
  )
}