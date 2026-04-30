'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useSystem } from '../../context/SystemContext'
import { 
  Shield, BookOpen, Smartphone, Cross, Activity, Dumbbell, Utensils, Droplets, Layout, Bed, Check
} from 'lucide-react'

export default function QuestsPage() {
  const system = useSystem()
  const [timeLeft, setTimeLeft] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  const [completedQuests, setCompletedQuests] = useState<{
    daily: string[],
    systemCompleted: string[],
    lastDailyReset: string | null,
    systemCycle: number | null
  }>({ daily: [], systemCompleted: [], lastDailyReset: null, systemCycle: null })

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('system_quest_status')
    const now = new Date()
    
    // Reset at 2am next day
    const getTomorrow2am = () => {
      const t = new Date()
      t.setDate(t.getDate() + 1)
      t.setHours(2, 0, 0, 0)
      return t
    }
    
    if (saved) {
      try {
        let parsed = JSON.parse(saved)
        const lastReset = parsed.lastDailyReset ? new Date(parsed.lastDailyReset) : new Date(0)
        
        // Check if it's past 2am and we haven't reset today
        const today2am = new Date()
        today2am.setHours(2, 0, 0, 0)
        
        if (now > today2am && lastReset < today2am) {
          parsed.daily = []
          parsed.systemCompleted = []
          parsed.lastDailyReset = now.toISOString()
        }
        setCompletedQuests(parsed)
      } catch (e) { console.error(e) }
    } else {
      setCompletedQuests(prev => ({ ...prev, lastDailyReset: now.toISOString() }))
    }
  }, [])

  useEffect(() => {
    if (isMounted) localStorage.setItem('system_quest_status', JSON.stringify(completedQuests))
  }, [completedQuests, isMounted])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      // Next 2am
      const target = new Date()
      target.setDate(target.getDate() + 1)
      target.setHours(2, 0, 0, 0)
      
      const diff = target.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!isMounted || !system) return <div className="font-mono bg-black text-white min-h-screen italic uppercase tracking-widest flex items-center justify-center">Carregando_Protocolos...</div>

  const { addGold, addXP, updateStats, showAlert, consumeStamina, logTaskToMonthly } = system

  const evolutionQuests = [
    { id: 'ev1', title: "20 Flexões",        reward: 300, xp: 500, stats: { strength: 4 },     icon: <Dumbbell />, type: 'pushups',   amount: 20 },
    { id: 'ev4', title: "30 min Leitura",    reward: 200, xp: 400, stats: { intelligence: 4 }, icon: <BookOpen />, type: 'reading',   amount: 30 },
    { id: 'ev2', title: "40 Agachamentos",   reward: 300, xp: 500, stats: { agility: 4 },      icon: <Activity />, type: 'squats',    amount: 40 },
    { id: 'ev3', title: "2 min Prancha",     reward: 300, xp: 500, stats: { bodyControl: 4 },  icon: <Shield  />, type: 'plank',     amount: 2  },
    { id: 'ev5', title: "20 min S/ Celular", reward: 200, xp: 400, stats: { mentality: 4 },    icon: <Smartphone />, type: 'focus',  amount: 20 },
    { id: 'ev6', title: "Oração/Meditação",  reward: 200, xp: 400, stats: { faith: 4 },        icon: <Cross   />, type: 'meditation', amount: 1 },
  ]

  const asCincoMissoes = [
    { id: 'sys5', title: "Beber 500ml de Água", reward: 50, xp: 100, stats: { vitality: 1 },     icon: <Droplets size={18}/>, type: 'water',    amount: 0.5 },
    { id: 'sys1', title: "Arrumar a Cama",      reward: 50, xp: 100, stats: { mentality: 1 },    icon: <Bed      size={18}/>, type: 'bed',      amount: 1   },
    { id: 'sys2', title: "Lavar a Louça",        reward: 50, xp: 100, stats: { bodyControl: 1 },  icon: <Utensils size={18}/>, type: 'dishes',   amount: 1   },
    { id: 'sys3', title: "Organizar Mesa",       reward: 50, xp: 100, stats: { intelligence: 1 }, icon: <Layout   size={18}/>, type: 'organize', amount: 1   },
    { id: 'sys4', title: "Alongamento Rápido",   reward: 50, xp: 100, stats: { agility: 1 },      icon: <Activity size={18}/>, type: 'stretch',  amount: 1   },
  ]

  const handleQuest = (q: any, type: 'daily' | 'system') => {
    const key = type === 'daily' ? 'daily' : 'systemCompleted'
    if (completedQuests[key].includes(q.id)) return
    if (!consumeStamina()) return

    const primaryStat = Object.keys(q.stats)[0] as any
    
    addGold(q.reward)
    addXP(q.xp, primaryStat, q.type, q.amount)
    updateStats(q.stats)
    
    // Log to monthly dashboard
    if (q.amount && q.type) {
      logTaskToMonthly(q.type, q.amount)
    }
    
    setCompletedQuests(prev => ({
      ...prev,
      [key]: [...prev[key], q.id]
    }))

    showAlert(`MISSÃO CONCLUÍDA: ${q.title}`, 'success')
  }

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-32">
      {/* TITULO ALTERADO */}
      <header className="mb-12 border-b border-cyan-900/30 pb-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-cyan-500">Missões do Caçador</h1>
        <p className="text-[9px] text-cyan-600 font-bold uppercase">Reset Diário: {timeLeft}</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-black uppercase text-yellow-500 mb-6 border-l-4 border-yellow-500 pl-4 italic">Evolução Rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evolutionQuests.map((q) => {
            const isDone = completedQuests.daily.includes(q.id)
            return (
              <div key={q.id} className={`relative bg-slate-950 border p-5 transition-all duration-300 ${isDone ? 'border-green-500/50 bg-green-950/10' : 'border-yellow-900/30'}`}>
                {isDone && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <span className="border-4 border-green-500 text-green-500 px-4 py-1 font-black text-2xl uppercase italic -rotate-12 scale-110">FEITA</span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className={isDone ? "text-green-500" : "text-yellow-500"}>{q.icon}</div>
                  <div className="text-right text-[8px] font-black text-cyan-600 uppercase">
                    {Object.entries(q.stats).map(([s, v]) => <span key={s} className="block">+{v} {s}</span>)}
                  </div>
                </div>
                <h3 className="font-black text-xs uppercase mb-3">{q.title}</h3>
                {/* XP e GOLD exibidos */}
                <div className="flex gap-3 mb-4">
                  <span className="text-[9px] font-black text-cyan-400">+{q.xp} XP</span>
                  <span className="text-[9px] font-black text-yellow-500">+{q.reward} G</span>
                </div>
                {!isDone && (
                  <button onClick={() => handleQuest(q, 'daily')} className="w-full border border-yellow-500 text-yellow-500 py-2 text-[10px] font-black hover:bg-yellow-500 hover:text-black transition-colors uppercase">Executar Protocolo</button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-black uppercase text-cyan-400 mb-6 border-l-4 border-cyan-500 pl-4 italic">Rotina de Base</h2>
        <div className="grid grid-cols-1 gap-3">
          {asCincoMissoes.map((q) => {
            const isDone = completedQuests.systemCompleted.includes(q.id)
            return (
              <div key={q.id} className={`relative bg-slate-950/40 border p-4 flex justify-between items-center transition-all ${isDone ? 'border-green-900/40 bg-green-900/5' : 'border-cyan-900/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={isDone ? "text-green-500" : "text-cyan-500"}>{q.icon}</div>
                  <div>
                    <h4 className={`text-xs font-black uppercase ${isDone ? 'text-green-700' : 'text-slate-200'}`}>{q.title}</h4>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[8px] text-cyan-700 font-bold uppercase tracking-widest">+{q.xp} XP</span>
                      <span className="text-[8px] text-yellow-700 font-bold uppercase tracking-widest">+{q.reward} G</span>
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">+{Object.values(q.stats)[0]} ATR</span>
                    </div>
                  </div>
                </div>
                {isDone ? (
                  <span className="text-green-500 font-black text-[10px] italic uppercase tracking-tighter flex items-center gap-1"><Check size={12} /> FEITA</span>
                ) : (
                  <button onClick={() => handleQuest(q, 'system')} className="px-6 py-2 border border-cyan-500 text-cyan-500 text-[9px] font-black hover:bg-cyan-500 hover:text-black uppercase transition-colors">Confirmar</button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}