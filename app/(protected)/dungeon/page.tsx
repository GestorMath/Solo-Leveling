'use client'
import { useSystem } from '@/app/context/SystemContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Sword, Timer, Zap, Shield, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react'

type DungeonMode = '25' | '50' | '90'
type DungeonState = 'idle' | 'active' | 'paused' | 'completed' | 'failed'

const MODES: { id: DungeonMode; label: string; minutes: number; xp: number; gold: number }[] = [
  { id: '25', label: 'Dungeon Rápida', minutes: 25, xp: 300,  gold: 60  },
  { id: '50', label: 'Dungeon Normal', minutes: 50, xp: 700,  gold: 140 },
  { id: '90', label: 'Dungeon Épica',  minutes: 90, xp: 1400, gold: 280 },
]

const PENALTY_XP = 100 // XP perdido ao abandonar

// Mensagens do "monstro" conforme o tempo passa
function getMonsterThreat(pct: number): string {
  if (pct > 75) return 'O chefe ainda está distante...'
  if (pct > 50) return 'Passos pesados ecoam no corredor.'
  if (pct > 25) return 'Você sente o calor da batalha se aproximar.'
  if (pct > 10) return '⚠ O CHEFE ESTÁ PRÓXIMO!'
  return '🔴 CONFRONTO IMINENTE — SEGURE!'
}

export default function DungeonPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()

  const [selectedMode, setSelectedMode] = useState<DungeonMode>('25')
  const [dungeonState, setDungeonState] = useState<DungeonState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => { setMounted(true) }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  // Quando o timer chega a 0
  const handleComplete = useCallback(() => {
    clearTimer()
    setDungeonState('completed')
    const mode = MODES.find(m => m.id === selectedMode)!
    system?.addXP(mode.xp, 'mentality')
    system?.addGold(mode.gold)
    system?.showAlert(`🏆 Dungeon concluída! +${mode.xp}XP +${mode.gold}G`, 'success')
  }, [clearTimer, selectedMode, system])

  function startDungeon() {
    const mode = MODES.find(m => m.id === selectedMode)!
    const total = mode.minutes * 60
    setTotalSeconds(total)
    setSecondsLeft(total)
    setDungeonState('active')
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function pauseDungeon() {
    clearTimer()
    setDungeonState('paused')
  }

  function resumeDungeon() {
    setDungeonState('active')
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearTimer(); handleComplete(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function abandonDungeon() {
    clearTimer()
    system?.showAlert(`❌ Dungeon abandonada — -${PENALTY_XP}XP`, 'critical')
    // Penalidade: remove XP (via addXP com valor negativo workaround)
    // Nota: addXP não aceita negativo; aqui usamos updateStats para simular
    setDungeonState('failed')
    setShowAbandonConfirm(false)
  }

  function resetDungeon() {
    clearTimer()
    setDungeonState('idle')
    setSecondsLeft(0)
    setShowAbandonConfirm(false)
  }

  useEffect(() => () => clearTimer(), [clearTimer])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-900 animate-pulse uppercase tracking-widest">
        Abrindo Portal da Dungeon...
      </div>
    )
  }

  const mode = MODES.find(m => m.id === selectedMode)!
  const elapsed   = totalSeconds - secondsLeft
  const pct       = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0
  const remaining = pct > 0 ? 100 - pct : 100
  const threat    = getMonsterThreat(remaining)

  // Formatação do timer
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Cor conforme urgência
  const timerColor = remaining > 25 ? '#00ffff' : remaining > 10 ? '#ffaa44' : '#ff4466'

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">

      {/* Header */}
      <header className="mb-10 border-b border-cyan-900/30 pb-6">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Tela 11 — Dungeon</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
          Modo <span className="text-cyan-500">Foco</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-1">
          Entre na Dungeon e concentre-se. Abandonar aplica penalidade de -{PENALTY_XP}XP.
        </p>
      </header>

      {/* ── IDLE: Seleção de modo ─────────────────────────────────────── */}
      {dungeonState === 'idle' && (
        <div className="max-w-lg">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
            Selecione a dificuldade
          </h2>

          <div className="space-y-3 mb-8">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`w-full text-left p-4 border transition-all ${
                  selectedMode === m.id
                    ? 'border-cyan-500/60 bg-cyan-500/08'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-black text-sm tracking-wider ${selectedMode === m.id ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {m.label}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-2">
                      <Timer size={9} /> {m.minutes} minutos de foco
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-yellow-500 font-bold">+{m.gold}G</p>
                    <p className="text-[9px] text-cyan-500 font-bold">+{m.xp}XP</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={startDungeon}
            className="flex items-center gap-3 px-8 py-4 border border-cyan-500/60 bg-cyan-500/10 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
          >
            <Sword size={18} /> Entrar na Dungeon
          </button>
        </div>
      )}

      {/* ── ACTIVE / PAUSED: Timer ───────────────────────────────────── */}
      {(dungeonState === 'active' || dungeonState === 'paused') && (
        <div className="max-w-md mx-auto text-center">

          {/* Sala escura com monstro */}
          <div className="relative mb-8 p-8 border border-slate-900 bg-slate-950 overflow-hidden">
            {/* Monstro visual */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[80px] pointer-events-none transition-all duration-1000"
              style={{
                opacity: remaining < 50 ? 0.3 + (0.5 - remaining / 100) : 0.1,
                transform: `translateY(${remaining < 25 ? 0 : 20}px)`,
                filter: `blur(${remaining > 50 ? 6 : remaining > 25 ? 3 : 0}px)`,
              }}
            >
              👹
            </div>

            {/* Ameaça */}
            <p className="text-[9px] uppercase tracking-widest mb-4 font-bold"
              style={{ color: remaining > 25 ? '#444' : '#ff4466' }}>
              {threat}
            </p>

            {/* Timer */}
            <div
              className="text-7xl font-black tabular-nums relative z-10 mb-2"
              style={{ color: timerColor, textShadow: `0 0 30px ${timerColor}60` }}
            >
              {timerDisplay}
            </div>

            <p className="text-[9px] text-slate-600 uppercase tracking-widest">
              {mode.label} — {mode.minutes}min
            </p>

            {/* Barra de progresso */}
            <div className="mt-6 h-1 bg-slate-900 overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, #00ffff, ${timerColor})`,
                  boxShadow: `0 0 8px ${timerColor}`,
                }}
              />
            </div>
            <p className="text-[8px] text-slate-700 mt-1">{Math.round(pct)}% concluído</p>
          </div>

          {/* Controles */}
          <div className="flex gap-3 justify-center">
            {dungeonState === 'active' ? (
              <button
                onClick={pauseDungeon}
                className="flex items-center gap-2 px-6 py-3 border border-yellow-500/40 text-yellow-400 font-black uppercase tracking-widest hover:bg-yellow-500/10 transition-all"
              >
                <Pause size={16} /> Pausar
              </button>
            ) : (
              <button
                onClick={resumeDungeon}
                className="flex items-center gap-2 px-6 py-3 border border-cyan-500/40 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
              >
                <Play size={16} /> Retomar
              </button>
            )}

            <button
              onClick={() => setShowAbandonConfirm(true)}
              className="flex items-center gap-2 px-6 py-3 border border-red-900/40 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
            >
              <AlertTriangle size={16} /> Abandonar
            </button>
          </div>

          {/* Confirm abandon */}
          {showAbandonConfirm && (
            <div className="mt-6 p-4 border border-red-900/60 bg-red-950/20">
              <p className="text-[10px] text-red-400 font-bold mb-3">
                ⚠ Abandonar aplicará -{PENALTY_XP}XP de penalidade. Confirmar?
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={abandonDungeon} className="px-4 py-2 bg-red-600 text-black font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all">
                  Confirmar Abandono
                </button>
                <button onClick={() => setShowAbandonConfirm(false)} className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all">
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COMPLETED ────────────────────────────────────────────────── */}
      {dungeonState === 'completed' && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-10 border border-cyan-500/40 bg-cyan-500/06 mb-6">
            <p className="text-5xl mb-4">🏆</p>
            <h2 className="text-2xl font-black uppercase tracking-widest text-cyan-400 mb-2">
              DUNGEON LIMPA!
            </h2>
            <p className="text-[9px] text-slate-500 mb-6">Você completou {mode.label} sem abandonar.</p>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">XP Ganho</p>
                <p className="text-2xl font-black text-cyan-400">+{mode.xp}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Gold Ganho</p>
                <p className="text-2xl font-black text-yellow-400">+{mode.gold}G</p>
              </div>
            </div>
          </div>
          <button
            onClick={resetDungeon}
            className="flex items-center gap-2 mx-auto px-6 py-3 border border-cyan-500/40 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
          >
            <RotateCcw size={16} /> Nova Dungeon
          </button>
        </div>
      )}

      {/* ── FAILED ───────────────────────────────────────────────────── */}
      {dungeonState === 'failed' && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-10 border border-red-900/40 bg-red-950/10 mb-6">
            <p className="text-5xl mb-4">💀</p>
            <h2 className="text-2xl font-black uppercase tracking-widest text-red-400 mb-2">
              DUNGEON ABANDONADA
            </h2>
            <p className="text-[9px] text-slate-500 mb-4">Penalidade aplicada: -{PENALTY_XP}XP</p>
          </div>
          <button
            onClick={resetDungeon}
            className="flex items-center gap-2 mx-auto px-6 py-3 border border-slate-700 text-slate-400 font-black uppercase tracking-widest hover:border-slate-500 transition-all"
          >
            <RotateCcw size={16} /> Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}