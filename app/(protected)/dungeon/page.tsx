'use client'
import { useSystem } from '@/app/context/SystemContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Sword, Timer, Zap, Shield, AlertTriangle, Play, Pause, RotateCcw, Lock } from 'lucide-react'
import { RANK_COLORS } from '@/app/lib/RankConfig'

type DungeonMode = string
type DungeonState = 'idle' | 'active' | 'paused' | 'completed' | 'failed'

interface DungeonDef {
  id: DungeonMode
  label: string
  minutes: number
  xp: number
  gold: number
  attribute: string
  category: string
  minRankIndex: number  // Minimum rank index to access
  isEpic: boolean
  description: string
  emoji: string
}

// Rank index references: F=0, E-=1, E=2, E+=3, D-=4, D=5, D+=6, C-=7, C=8, C+=9, B-=10...
const ALL_DUNGEONS: DungeonDef[] = [
  // FORÇA
  { id: 'd_str_1', label: 'Caverna das Flexões', minutes: 25, xp: 300, gold: 60, attribute: 'Força', category: 'strength', minRankIndex: 0, isEpic: false, description: 'Execute 20 flexões por intervalo a cada 5 minutos.', emoji: '💪' },
  { id: 'd_str_2', label: 'Torre do Guerreiro', minutes: 50, xp: 700, gold: 140, attribute: 'Força', category: 'strength', minRankIndex: 0, isEpic: false, description: 'Sessão intensa de treino de força sem pausas.', emoji: '🏋️' },
  { id: 'd_str_3', label: 'Dungeon do Monarca da Força', minutes: 90, xp: 1800, gold: 360, attribute: 'Força', category: 'strength', minRankIndex: 7, isEpic: true, description: 'Sessão épica de treino. Apenas para caçadores Rank C+.', emoji: '⚔️' },
  
  // AGILIDADE
  { id: 'd_agi_1', label: 'Labirinto da Agilidade', minutes: 25, xp: 300, gold: 60, attribute: 'Agilidade', category: 'agility', minRankIndex: 0, isEpic: false, description: 'Mantenha foco em movimentos rápidos e precisos.', emoji: '⚡' },
  { id: 'd_agi_2', label: 'Corredor do Reflexo', minutes: 50, xp: 700, gold: 140, attribute: 'Agilidade', category: 'agility', minRankIndex: 0, isEpic: false, description: 'Treino de velocidade e coordenação motora.', emoji: '🏃' },
  { id: 'd_agi_3', label: 'Salão Épico da Velocidade', minutes: 90, xp: 1800, gold: 360, attribute: 'Agilidade', category: 'agility', minRankIndex: 7, isEpic: true, description: 'Treinamento avançado de velocidade. Rank C+ necessário.', emoji: '🌪️' },

  // INTELIGÊNCIA  
  { id: 'd_int_1', label: 'Biblioteca Sombria', minutes: 25, xp: 300, gold: 60, attribute: 'Inteligência', category: 'intelligence', minRankIndex: 0, isEpic: false, description: 'Foque em leitura ou estudo sem distrações.', emoji: '📚' },
  { id: 'd_int_2', label: 'Torre do Conhecimento', minutes: 50, xp: 700, gold: 140, attribute: 'Inteligência', category: 'intelligence', minRankIndex: 0, isEpic: false, description: 'Deep work: estudo intenso por 50 minutos.', emoji: '🧠' },
  { id: 'd_int_3', label: 'Catedral do Saber Supremo', minutes: 90, xp: 1800, gold: 360, attribute: 'Inteligência', category: 'intelligence', minRankIndex: 7, isEpic: true, description: 'Sessão épica de aprendizado. Rank C+ necessário.', emoji: '🔮' },

  // VITALIDADE
  { id: 'd_vit_1', label: 'Nascente da Vida', minutes: 25, xp: 300, gold: 60, attribute: 'Vitalidade', category: 'vitality', minRankIndex: 0, isEpic: false, description: 'Hidratação e hábitos saudáveis focados.', emoji: '💧' },
  { id: 'd_vit_2', label: 'Santuário da Saúde', minutes: 50, xp: 700, gold: 140, attribute: 'Vitalidade', category: 'vitality', minRankIndex: 0, isEpic: false, description: 'Protocolo de saúde completo sem interrupções.', emoji: '🌿' },
  { id: 'd_vit_3', label: 'Câmara da Imortalidade', minutes: 90, xp: 1800, gold: 360, attribute: 'Vitalidade', category: 'vitality', minRankIndex: 7, isEpic: true, description: 'Protocolo épico de vitalidade. Rank C+ necessário.', emoji: '✨' },

  // MENTALIDADE
  { id: 'd_men_1', label: 'Câmara da Meditação', minutes: 25, xp: 300, gold: 60, attribute: 'Mentalidade', category: 'mentality', minRankIndex: 0, isEpic: false, description: 'Sessão de foco e meditação guiada.', emoji: '🧘' },
  { id: 'd_men_2', label: 'Santuário Mental', minutes: 50, xp: 700, gold: 140, attribute: 'Mentalidade', category: 'mentality', minRankIndex: 0, isEpic: false, description: 'Treinamento mental intenso sem celular.', emoji: '🌙' },
  { id: 'd_men_3', label: 'Abismo da Consciência', minutes: 90, xp: 1800, gold: 360, attribute: 'Mentalidade', category: 'mentality', minRankIndex: 7, isEpic: true, description: 'Sessão épica mental. Rank C+ necessário.', emoji: '🌌' },

  // CONTROLE CORPORAL
  { id: 'd_bc_1', label: 'Sala de Prancha', minutes: 25, xp: 300, gold: 60, attribute: 'Controle Corporal', category: 'bodyControl', minRankIndex: 0, isEpic: false, description: 'Exercícios de estabilidade e controle postural.', emoji: '🤸' },
  { id: 'd_bc_2', label: 'Arena do Equilíbrio', minutes: 50, xp: 700, gold: 140, attribute: 'Controle Corporal', category: 'bodyControl', minRankIndex: 0, isEpic: false, description: 'Treinamento completo de corpo e postura.', emoji: '⚖️' },
  { id: 'd_bc_3', label: 'Templo do Corpo Perfeito', minutes: 90, xp: 1800, gold: 360, attribute: 'Controle Corporal', category: 'bodyControl', minRankIndex: 7, isEpic: true, description: 'Sessão épica corporal. Rank C+ necessário.', emoji: '🏯' },
]

const DAILY_LIMIT = 2
const DAILY_KEY = 'sl_dungeon_daily'
const PENALTY_XP = 100

function getMonsterThreat(pct: number): string {
  if (pct > 75) return 'O chefe ainda está distante...'
  if (pct > 50) return 'Passos pesados ecoam no corredor.'
  if (pct > 25) return 'Você sente o calor da batalha se aproximar.'
  if (pct > 10) return '⚠ O CHEFE ESTÁ PRÓXIMO!'
  return '🔴 CONFRONTO IMINENTE — SEGURE!'
}

function getDailyUsage(): { count: number; date: string } {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return { count: 0, date: new Date().toDateString() }
    const data = JSON.parse(raw)
    if (data.date !== new Date().toDateString()) return { count: 0, date: new Date().toDateString() }
    return data
  } catch { return { count: 0, date: new Date().toDateString() } }
}

function incrementDailyUsage() {
  const current = getDailyUsage()
  localStorage.setItem(DAILY_KEY, JSON.stringify({ count: current.count + 1, date: new Date().toDateString() }))
}

const ATTRIBUTES = ['Força', 'Agilidade', 'Inteligência', 'Vitalidade', 'Mentalidade', 'Controle Corporal']

export default function DungeonPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()

  const [selectedDungeon, setSelectedDungeon] = useState<DungeonDef | null>(null)
  const [filterAttr, setFilterAttr] = useState<string>('Todos')
  const [dungeonState, setDungeonState] = useState<DungeonState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [dailyUsage, setDailyUsage] = useState({ count: 0, date: '' })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { 
    setMounted(true)
    setDailyUsage(getDailyUsage())
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const handleComplete = useCallback(() => {
    clearTimer()
    setDungeonState('completed')
    if (!selectedDungeon) return
    system?.addXP(selectedDungeon.xp, selectedDungeon.category as any)
    system?.addGold(selectedDungeon.gold)
    system?.showAlert(`🏆 Dungeon concluída! +${selectedDungeon.xp}XP +${selectedDungeon.gold}G`, 'success')
  }, [clearTimer, selectedDungeon, system])

  function startDungeon() {
    if (!selectedDungeon) return
    const usage = getDailyUsage()
    if (usage.count >= DAILY_LIMIT) {
      system?.showAlert(`⚠ Limite diário atingido! (${DAILY_LIMIT}/dia)`, 'critical')
      return
    }
    const total = selectedDungeon.minutes * 60
    setTotalSeconds(total)
    setSecondsLeft(total)
    setDungeonState('active')
    incrementDailyUsage()
    setDailyUsage(getDailyUsage())

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearTimer(); handleComplete(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function pauseDungeon() { clearTimer(); setDungeonState('paused') }

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
    setDungeonState('failed')
    setShowAbandonConfirm(false)
  }

  function resetDungeon() {
    clearTimer()
    setDungeonState('idle')
    setSecondsLeft(0)
    setShowAbandonConfirm(false)
    setSelectedDungeon(null)
  }

  useEffect(() => () => clearTimer(), [clearTimer])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-900 animate-pulse uppercase tracking-widest">
        Abrindo Portal da Dungeon...
      </div>
    )
  }

  const { rankIndex } = system
  const elapsed   = totalSeconds - secondsLeft
  const pct       = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0
  const remaining = pct > 0 ? 100 - pct : 100
  const threat    = getMonsterThreat(remaining)
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const timerColor = remaining > 25 ? '#00ffff' : remaining > 10 ? '#ffaa44' : '#ff4466'

  // 6 dungeons: 1 per attribute, based on player rank
  // Pick one per attribute that is available for the player's rank
  const availableDungeons = ATTRIBUTES.map(attr => {
    const attrDungeons = ALL_DUNGEONS.filter(d => d.attribute === attr && d.minRankIndex <= rankIndex && !d.isEpic)
    // For epic ones check rank >= C (index 8)
    const epicOnes = ALL_DUNGEONS.filter(d => d.attribute === attr && d.isEpic && rankIndex >= 7)
    return [...attrDungeons, ...epicOnes]
  }).flat()

  // Filter by attribute
  const filteredDungeons = filterAttr === 'Todos'
    ? availableDungeons
    : availableDungeons.filter(d => d.attribute === filterAttr)

  // Show one per attribute for the 6-dungeon display
  const featured = ATTRIBUTES.map(attr => {
    const duns = availableDungeons.filter(d => d.attribute === attr)
    return duns[duns.length - 1] // pick highest available
  }).filter(Boolean)

  const displayDungeons = filterAttr === 'Todos' ? featured : filteredDungeons
  const canDungeon = dailyUsage.count < DAILY_LIMIT

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-32">
      <header className="mb-10 border-b border-cyan-900/30 pb-6">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Modo Foco — Dungeon</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
          Modo <span className="text-cyan-500">Dungeon</span>
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-[10px] text-slate-500">
            Dungeons hoje: <span className={dailyUsage.count >= DAILY_LIMIT ? 'text-red-400' : 'text-cyan-400'}>{dailyUsage.count}/{DAILY_LIMIT}</span>
          </p>
          {!canDungeon && (
            <span className="text-[9px] text-red-500 border border-red-900/40 px-2 py-0.5">LIMITE DIÁRIO ATINGIDO</span>
          )}
        </div>
      </header>

      {/* IDLE */}
      {dungeonState === 'idle' && (
        <div className="max-w-2xl">
          {/* Filtro por atributo */}
          <div className="flex gap-2 flex-wrap mb-6">
            {['Todos', ...ATTRIBUTES].map(attr => (
              <button key={attr} onClick={() => setFilterAttr(attr)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                  filterAttr === attr
                    ? 'bg-cyan-500 text-black border-cyan-500'
                    : 'border-slate-800 text-slate-500 hover:border-slate-600'
                }`}>
                {attr}
              </button>
            ))}
          </div>

          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
            Dungeons Disponíveis — Rank {system.rank}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {displayDungeons.map(d => {
              const isSelected = selectedDungeon?.id === d.id
              const rankColor = '#00ffff'
              return (
                <button key={d.id} onClick={() => setSelectedDungeon(d)}
                  className={`text-left p-4 border transition-all ${
                    isSelected
                      ? 'border-cyan-500/60 bg-cyan-500/08'
                      : 'border-slate-800 hover:border-slate-600'
                  } ${!canDungeon ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canDungeon}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{d.emoji}</span>
                    {d.isEpic && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 border border-yellow-600/50 text-yellow-500 bg-yellow-950/20">ÉPICA</span>
                    )}
                  </div>
                  <p className={`font-black text-sm tracking-wider mb-1 ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {d.label}
                  </p>
                  <p className="text-[8px] text-slate-600 mb-2">{d.attribute} • {d.minutes}min</p>
                  <p className="text-[9px] text-slate-500 mb-2 leading-relaxed">{d.description}</p>
                  <div className="flex gap-3">
                    <span className="text-[9px] text-yellow-500 font-bold">+{d.gold}G</span>
                    <span className="text-[9px] text-cyan-500 font-bold">+{d.xp}XP</span>
                  </div>
                </button>
              )
            })}
          </div>

          {displayDungeons.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-800">
              <Lock size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Nenhuma dungeon disponível para este filtro</p>
            </div>
          )}

          <button
            onClick={startDungeon}
            disabled={!selectedDungeon || !canDungeon}
            className="flex items-center gap-3 px-8 py-4 border border-cyan-500/60 bg-cyan-500/10 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Sword size={18} /> Entrar na Dungeon
          </button>
        </div>
      )}

      {/* ACTIVE / PAUSED */}
      {(dungeonState === 'active' || dungeonState === 'paused') && selectedDungeon && (
        <div className="max-w-md mx-auto text-center">
          <div className="relative mb-8 p-8 border border-slate-900 bg-slate-950 overflow-hidden">
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
            <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: remaining > 25 ? '#444' : '#ff4466' }}>
              {threat}
            </p>
            <p className="text-[9px] text-slate-500 mb-4 uppercase tracking-widest">{selectedDungeon.emoji} {selectedDungeon.label}</p>
            <div
              className="text-7xl font-black tabular-nums relative z-10 mb-2"
              style={{ color: timerColor, textShadow: `0 0 30px ${timerColor}60` }}
            >
              {timerDisplay}
            </div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">
              {selectedDungeon.attribute} — {selectedDungeon.minutes}min
            </p>
            <div className="mt-6 h-1 bg-slate-900 overflow-hidden">
              <div className="h-full transition-all duration-1000"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, #00ffff, ${timerColor})`, boxShadow: `0 0 8px ${timerColor}` }} />
            </div>
            <p className="text-[8px] text-slate-700 mt-1">{Math.round(pct)}% concluído</p>
          </div>

          <div className="flex gap-3 justify-center">
            {dungeonState === 'active' ? (
              <button onClick={pauseDungeon} className="flex items-center gap-2 px-6 py-3 border border-yellow-500/40 text-yellow-400 font-black uppercase tracking-widest hover:bg-yellow-500/10 transition-all">
                <Pause size={16} /> Pausar
              </button>
            ) : (
              <button onClick={resumeDungeon} className="flex items-center gap-2 px-6 py-3 border border-cyan-500/40 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all">
                <Play size={16} /> Retomar
              </button>
            )}
            <button onClick={() => setShowAbandonConfirm(true)} className="flex items-center gap-2 px-6 py-3 border border-red-900/40 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">
              <AlertTriangle size={16} /> Abandonar
            </button>
          </div>

          {showAbandonConfirm && (
            <div className="mt-6 p-4 border border-red-900/60 bg-red-950/20">
              <p className="text-[10px] text-red-400 font-bold mb-3">⚠ Abandonar aplicará -{PENALTY_XP}XP de penalidade. Confirmar?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={abandonDungeon} className="px-4 py-2 bg-red-600 text-black font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all">Confirmar Abandono</button>
                <button onClick={() => setShowAbandonConfirm(false)} className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all">Voltar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLETED */}
      {dungeonState === 'completed' && selectedDungeon && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-10 border border-cyan-500/40 bg-cyan-500/06 mb-6">
            <p className="text-5xl mb-4">🏆</p>
            <h2 className="text-2xl font-black uppercase tracking-widest text-cyan-400 mb-2">DUNGEON LIMPA!</h2>
            <p className="text-[9px] text-slate-500 mb-6">{selectedDungeon.emoji} {selectedDungeon.label} concluída!</p>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">XP Ganho</p>
                <p className="text-2xl font-black text-cyan-400">+{selectedDungeon.xp}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Gold Ganho</p>
                <p className="text-2xl font-black text-yellow-400">+{selectedDungeon.gold}G</p>
              </div>
            </div>
          </div>
          <button onClick={resetDungeon} className="flex items-center gap-2 mx-auto px-6 py-3 border border-cyan-500/40 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all">
            <RotateCcw size={16} /> Nova Dungeon {!canDungeon && '(Amanhã)'}
          </button>
        </div>
      )}

      {/* FAILED */}
      {dungeonState === 'failed' && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-10 border border-red-900/40 bg-red-950/10 mb-6">
            <p className="text-5xl mb-4">💀</p>
            <h2 className="text-2xl font-black uppercase tracking-widest text-red-400 mb-2">DUNGEON ABANDONADA</h2>
            <p className="text-[9px] text-slate-500 mb-4">Penalidade: -{PENALTY_XP}XP</p>
          </div>
          <button onClick={resetDungeon} className="flex items-center gap-2 mx-auto px-6 py-3 border border-slate-700 text-slate-400 font-black uppercase tracking-widest hover:border-slate-500 transition-all">
            <RotateCcw size={16} /> Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}