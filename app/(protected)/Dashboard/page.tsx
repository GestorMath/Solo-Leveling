'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ... resto dos seus imports e código
import { useState, useEffect } from 'react'
import { useSystem } from '@/app/context/SystemContext'
import {
  TrendingUp, Droplets, Dumbbell, BookOpen,
  Activity, CheckCircle2, Zap, Timer, Plus, Target,
} from 'lucide-react'
import Link from 'next/link'

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

function StatMiniCard({
  label, value, sub, color,
}: {
  label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="bg-slate-950 border border-slate-900 p-4">
      <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${color}`}>
        {value} <span className="text-xs text-slate-700 font-bold">{sub}</span>
      </p>
    </div>
  )
}

function ResourceProgress({
  label, value, percent, icon,
}: {
  label: string; value: string; percent: number; icon: React.ReactNode
}) {
  const pct = Math.min(Math.round(percent), 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-slate-500">
          {icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-400">{value}</span>
      </div>
      <div className="h-[3px] bg-slate-900 w-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[7px] text-slate-700 mt-1 font-bold">{pct}% da meta mensal</p>
    </div>
  )
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()

  const currentMonth = new Date().getMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => { setMounted(true) }, [])

  // Timer para as system quests
  useEffect(() => {
    if (!system?.systemQuests?.length) return
    const updateTimer = () => {
      const now      = Date.now()
      const distance = system.systemQuests[0].expiresAt - now
      if (distance < 0) { setTimeLeft('00:00:00'); return }
      const h = Math.floor(distance / 3_600_000)
      const m = Math.floor((distance % 3_600_000) / 60_000)
      const s = Math.floor((distance % 60_000) / 1_000)
      setTimeLeft(
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      )
    }
    const interval = setInterval(updateTimer, 1000)
    updateTimer()
    return () => clearInterval(interval)
  }, [system?.systemQuests])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono italic text-cyan-900 animate-pulse">
        SINCRONIZANDO_SISTEMA...
      </div>
    )
  }

  const { xp, level, rank, monthlyLogs, systemQuests, completeSystemQuest, routines, completeRoutine } = system

  const log = monthlyLogs[selectedMonth] ?? {
    tasks: 0, xpGain: 0, goldGain: 0, water: 0, pushups: 0, squats: 0,
    reading: 0, meditation: 0, focus: 0, bed: 0, dishes: 0, stretch: 0, organize: 0,
  }

  const isCurrentMonth = selectedMonth === currentMonth

  // FIX: identificar meses futuros para desabilitar seleção e indicar visualmente
  const isFutureMonth = (idx: number) => idx > currentMonth

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-40">

      <header className="mb-10 border-b border-cyan-900/40 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
            Informações do <span className="text-cyan-500">Caçador</span>
          </h1>
          <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase mt-1">
            Status do Jogador e Registros de Ciclo
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[9px] text-cyan-500/50 font-bold uppercase tracking-widest">
            RANK: <span className="text-cyan-400">{rank}</span>
          </p>
          <p className="text-[9px] text-slate-700 font-bold">LV.{level}</p>
        </div>
      </header>

      {/* Seletor de mês */}
      <div className="flex flex-wrap gap-2 mb-8 border-y border-slate-900 py-4 overflow-x-auto">
        {MESES.map((mes, index) => {
          const isFuture  = isFutureMonth(index)
          const isSelected = selectedMonth === index
          return (
            <button
              key={mes}
              onClick={() => !isFuture && setSelectedMonth(index)}
              disabled={isFuture}
              title={isFuture ? 'Mês futuro — sem dados' : mes}
              className={`px-3 py-2 text-[9px] font-black border transition-all ${
                isFuture
                  ? 'text-slate-800 border-slate-900 cursor-not-allowed opacity-40'
                  : isSelected
                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-600 border-slate-900 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              {mes}
              {isFuture && <span className="ml-1 text-[7px]">—</span>}
            </button>
          )
        })}
      </div>

      {/* Aviso mês sem dados */}
      {!isCurrentMonth && !isFutureMonth(selectedMonth) && (
        <div className="mb-6 px-4 py-3 border border-slate-800 bg-slate-950/60 text-[9px] text-slate-500 uppercase tracking-widest">
          // Exibindo histórico de{' '}
          <span className="text-slate-300 font-bold">{MESES[selectedMonth]}</span>
          {log.tasks === 0 && (
            <span className="ml-2 text-slate-700">— nenhuma atividade registrada</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna esquerda */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-slate-400 tracking-widest">
              <TrendingUp size={14} className="text-green-500" /> Ganhos_{MESES[selectedMonth]}
            </h2>
            <StatMiniCard
              label="Missões Concluídas"
              value={log.tasks}
              sub="UN"
              color="text-white"
            />
            <StatMiniCard
              label="XP Adquirido"
              value={`+${log.xpGain.toLocaleString()}`}
              sub="PTS"
              color="text-green-500"
            />
            <StatMiniCard
              label="Gold Obtido"
              value={`${Math.max(0, log.goldGain).toLocaleString()}`}
              sub="G"
              color="text-yellow-500"
            />
          </div>

          {/* Rotinas do dia */}
          {isCurrentMonth && (
            <div className="bg-slate-950 border border-orange-900/30 p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[10px] font-black uppercase flex items-center gap-2 text-orange-500 tracking-widest">
                  <Target size={14} /> Contratos_Ativos
                </h2>
                <Link href="/Dashboard/routines" className="text-orange-500 hover:text-white transition-all">
                  <Plus size={16} />
                </Link>
              </div>

              {(!routines || routines.length === 0) ? (
                <p className="text-[9px] text-slate-700 italic py-4 text-center border border-dashed border-slate-900 uppercase">
                  Nenhuma rotina personalizada
                </p>
              ) : (
                <div className="space-y-2">
                  {routines.map(r => (
                    <div
                      key={r.id}
                      onClick={() => !r.completedToday && completeRoutine(r.id)}
                      className={`flex items-center justify-between p-3 border transition-all cursor-pointer ${
                        r.completedToday
                          ? 'bg-emerald-950/10 border-emerald-900/30 opacity-40'
                          : 'bg-black border-slate-900 hover:border-orange-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${r.completedToday ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                        {r.title}
                      </span>
                      <CheckCircle2
                        size={14}
                        className={r.completedToday ? 'text-emerald-500' : 'text-slate-800'}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Progresso das rotinas do dia */}
              {routines.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-900">
                  <div className="flex justify-between text-[8px] text-slate-600 mb-1.5">
                    <span>Progresso diário</span>
                    <span>
                      {routines.filter(r => r.completedToday).length}/{routines.length}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{
                        width: `${(routines.filter(r => r.completedToday).length / routines.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-2 space-y-8">

          {/* Monitor de Evolução */}
          <div className="bg-slate-950 border border-slate-900 p-6 md:p-8">
            <h2 className="text-[10px] font-black uppercase mb-8 flex items-center gap-2 text-slate-400 tracking-widest">
              <Activity size={14} className="text-cyan-500" />
              Monitor_de_Evolução: {MESES[selectedMonth]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <ResourceProgress
                label="Hidratação"
                value={`${(log.water ?? 0).toFixed(1)}L`}
                percent={((log.water ?? 0) / 60) * 100}
                icon={<Droplets size={12}/>}
              />
              <ResourceProgress
                label="Flexões"
                value={`${log.pushups ?? 0} reps`}
                percent={((log.pushups ?? 0) / 1000) * 100}
                icon={<Dumbbell size={12}/>}
              />
              <ResourceProgress
                label="Agachamentos"
                value={`${log.squats ?? 0} reps`}
                percent={((log.squats ?? 0) / 1000) * 100}
                icon={<Zap size={12}/>}
              />
              <ResourceProgress
                label="Leitura"
                value={`${log.reading ?? 0} min`}
                percent={((log.reading ?? 0) / 600) * 100}
                icon={<BookOpen size={12}/>}
              />
              <ResourceProgress
                label="Arrumar Cama"
                value={`${log.bed ?? 0}d`}
                percent={((log.bed ?? 0) / 30) * 100}
                icon={<Activity size={12}/>}
              />
              <ResourceProgress
                label="Lavar Louça"
                value={`${log.dishes ?? 0}v`}
                percent={((log.dishes ?? 0) / 30) * 100}
                icon={<Droplets size={12}/>}
              />
              <ResourceProgress
                label="Alongamento"
                value={`${log.stretch ?? 0}m`}
                percent={((log.stretch ?? 0) / 300) * 100}
                icon={<Activity size={12}/>}
              />
              <ResourceProgress
                label="Organização"
                value={`${log.organize ?? 0}v`}
                percent={((log.organize ?? 0) / 30) * 100}
                icon={<CheckCircle2 size={12}/>}
              />
            </div>
          </div>

          {/* Mural do Sistema */}
          {isCurrentMonth && systemQuests.length > 0 && (
            <div className="bg-slate-950 border border-blue-900/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-400 tracking-widest">
                  <Zap size={14} className="fill-blue-400 animate-pulse" /> Mural_do_Sistema
                </h2>
                <div className="bg-blue-950/30 border border-blue-500/30 px-3 py-1 font-mono text-[11px] text-blue-400 flex items-center gap-2">
                  <Timer size={14} /> <span>{timeLeft}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {systemQuests.map(q => (
                  <div
                    key={q.id}
                    onClick={() => !q.completed && completeSystemQuest(q.id)}
                    className={`flex items-center justify-between p-4 border transition-all cursor-pointer ${
                      q.completed
                        ? 'opacity-30 border-slate-900 bg-black'
                        : 'bg-black border-slate-800 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <span className="text-[10px] font-bold text-slate-300 block truncate">
                        {q.title}
                      </span>
                      {q.completed && (
                        <span className="text-[8px] text-green-600 uppercase tracking-widest">✓ Concluída</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] font-bold text-yellow-600">+{q.gold}G</p>
                      <p className="text-[9px] font-bold text-blue-600">+{q.xp}XP</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progresso quests do dia */}
              <div className="mt-4 pt-3 border-t border-slate-900">
                <div className="flex justify-between text-[8px] text-slate-600 mb-1.5">
                  <span>Concluídas hoje</span>
                  <span>
                    {systemQuests.filter(q => q.completed).length}/{systemQuests.length}
                  </span>
                </div>
                <div className="h-1 bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${(systemQuests.filter(q => q.completed).length / systemQuests.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}