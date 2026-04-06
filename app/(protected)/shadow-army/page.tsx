'use client'
import { useSystem } from '@/app/context/SystemContext'
import { useState, useEffect } from 'react'
import { Skull, Zap, Plus, X, Loader2 } from 'lucide-react'
import { RANK_COLORS } from '@/app/lib/RankConfig'

// Sombra extraída após reset SS+
interface Shadow {
  id: string
  name: string
  rankAtExtraction: string
  levelAtExtraction: number
  extractedAt: number
  xpMultiplier: number
}

const STORAGE_KEY = 'sl_shadow_army'

function loadShadows(): Shadow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveShadows(shadows: Shadow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shadows))
}

function ShadowCard({ shadow, onRemove }: { shadow: Shadow; onRemove: (id: string) => void }) {
  const color = RANK_COLORS[shadow.rankAtExtraction] ?? '#888'
  const date  = new Date(shadow.extractedAt).toLocaleDateString('pt-BR')

  return (
    <div
      className="relative border p-4 flex items-center gap-4 group transition-all"
      style={{ borderColor: `${color}30`, background: `${color}06` }}
    >
      {/* Avatar da sombra */}
      <div
        className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{ borderColor: color, boxShadow: `0 0 12px ${color}40` }}
      >
        <Skull size={20} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black uppercase text-sm tracking-wider text-white truncate">{shadow.name}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-[8px] font-black px-1.5 py-0.5 border" style={{ color, borderColor: `${color}50` }}>
            {shadow.rankAtExtraction}
          </span>
          <span className="text-[8px] text-slate-600">Nv.{shadow.levelAtExtraction}</span>
          <span className="text-[8px] text-slate-700">Extraído em {date}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-[8px] text-slate-600 uppercase tracking-widest">Multiplicador XP</p>
        <p className="font-black text-yellow-400 text-sm">+{((shadow.xpMultiplier - 1) * 100).toFixed(0)}%</p>
      </div>

      <button
        onClick={() => onRemove(shadow.id)}
        className="absolute top-2 right-2 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        title="Remover sombra"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default function ShadowArmyPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()
  const [shadows, setShadows] = useState<Shadow[]>([])
  const [showAriseModal, setShowAriseModal] = useState(false)
  const [shadowName, setShadowName] = useState('')
  const [ariseLoading, setAriseLoading] = useState(false)
  const [arisePhase, setArisePhase] = useState<'form' | 'animation'>('form')

  useEffect(() => {
    setMounted(true)
    setShadows(loadShadows())
  }, [])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-900 animate-pulse uppercase tracking-widest">
        Invocando Sombras...
      </div>
    )
  }

  const { rank, level } = system

  // Multiplicador total de XP do exército
  const totalMultiplier = shadows.length === 0
    ? 1
    : shadows.reduce((acc, s) => acc * s.xpMultiplier, 1)
  const bonusPct = ((totalMultiplier - 1) * 100).toFixed(1)

  function handleRemoveShadow(id: string) {
    const updated = shadows.filter(s => s.id !== id)
    setShadows(updated)
    saveShadows(updated)
  }

  function handleArise() {
    const name = shadowName.trim()
    if (!name || name.length < 2) return

    setAriseLoading(true)
    setArisePhase('animation')

    setTimeout(() => {
      const newShadow: Shadow = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        rankAtExtraction: rank,
        levelAtExtraction: level,
        extractedAt: Date.now(),
        xpMultiplier: 1 + (shadows.length + 1) * 0.05, // +5% por sombra
      }
      const updated = [...shadows, newShadow]
      setShadows(updated)
      saveShadows(updated)
      setShadowName('')
      setAriseLoading(false)
      setArisePhase('form')
      setShowAriseModal(false)
    }, 2200)
  }

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">

      {/* Header */}
      <header className="mb-10 border-b border-cyan-900/30 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Tela 09 — Exército de Sombras</p>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
            Shadow <span className="text-purple-400">Army</span>
          </h1>
        </div>

        {/* Stats do exército */}
        <div className="flex gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-[8px] text-slate-600 uppercase tracking-widest">Sombras</p>
            <p className="text-2xl font-black text-purple-400">{shadows.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-slate-600 uppercase tracking-widest">Bônus XP</p>
            <p className="text-2xl font-black text-yellow-400">+{bonusPct}%</p>
          </div>
        </div>
      </header>

      {/* Botão ARISE */}
      <div className="mb-8">
        <button
          onClick={() => setShowAriseModal(true)}
          className="flex items-center gap-2 px-6 py-3 border border-purple-500/50 bg-purple-500/10 text-purple-400 font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all text-sm"
        >
          <Plus size={16} /> Extrair Nova Sombra (ARISE)
        </button>
        <p className="text-[8px] text-slate-700 mt-2 uppercase tracking-widest">
          // Cada sombra concede +5% de multiplicador de XP global
        </p>
      </div>

      {/* Lista de sombras */}
      {shadows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Skull size={48} className="text-slate-800" />
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-black">
            // NENHUMA SOMBRA EXTRAÍDA
          </p>
          <p className="text-[9px] text-slate-800 max-w-xs">
            Extraia sua primeira sombra para começar a construir seu exército e acumular multiplicadores de XP.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shadows.map(s => (
            <ShadowCard key={s.id} shadow={s} onRemove={handleRemoveShadow} />
          ))}
        </div>
      )}

      {/* Arise Modal */}
      {showAriseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">

          {/* Animação de extração */}
          {arisePhase === 'animation' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Partículas */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-purple-500"
                  style={{
                    animationName: 'arise-particle',
                    animationDuration: `${1 + Math.random()}s`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-out',
                    left: `${50 + (Math.random() - 0.5) * 40}%`,
                    top: `${50 + (Math.random() - 0.5) * 40}%`,
                    opacity: 0.7,
                  }}
                />
              ))}
              <p
                className="text-6xl font-black tracking-[0.4em] uppercase z-10"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(168,85,247,0.9)',
                  textShadow: '0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(0,255,255,0.3)',
                  animationName: 'arise-pulse',
                  animationDuration: '0.6s',
                  animationIterationCount: 'infinite',
                }}
              >
                ARISE
              </p>
            </div>
          )}

          {/* Formulário */}
          {arisePhase === 'form' && (
            <div
              className="relative z-10 w-full max-w-sm mx-4 bg-black border border-purple-500/40 p-8"
              style={{ boxShadow: '0 0 60px rgba(168,85,247,0.2)' }}
            >
              <button
                onClick={() => setShowAriseModal(false)}
                className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Skull size={24} className="text-purple-400" />
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Protocolo de Extração</p>
                  <h2 className="font-black text-lg uppercase tracking-wider text-white">ARISE</h2>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">
                Dê um nome à sombra que será extraída. Ela carregará o seu rank atual ({rank}) e concederá +5% de XP permanentemente.
              </p>

              <div className="mb-5">
                <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">
                  // Nome da Sombra
                </label>
                <input
                  type="text"
                  value={shadowName}
                  onChange={e => setShadowName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleArise()}
                  placeholder="Ex: Igris, Beru, Kaisel..."
                  maxLength={30}
                  autoFocus
                  className="w-full bg-black border border-purple-900/50 px-4 py-3 text-white font-mono text-sm outline-none focus:border-purple-400 placeholder:text-slate-800"
                />
              </div>

              <button
                onClick={handleArise}
                disabled={!shadowName.trim() || ariseLoading}
                className="w-full py-3 border border-purple-500/50 bg-purple-500/10 text-purple-400 font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {ariseLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Extraindo...</>
                  : <><Skull size={14} /> Extrair Sombra</>
                }
              </button>
            </div>
          )}

          <style>{`
            @keyframes arise-particle {
              0%   { transform: translate(0,0) scale(1); opacity: 0.7; }
              100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${40 + Math.random()*60}px, -${60+Math.random()*80}px) scale(0); opacity: 0; }
            }
            @keyframes arise-pulse {
              0%,100% { text-shadow: 0 0 40px rgba(168,85,247,0.7); }
              50%      { text-shadow: 0 0 80px rgba(168,85,247,1), 0 0 120px rgba(0,255,255,0.5); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}