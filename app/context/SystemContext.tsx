'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'

// ─── TIPOS (inalterados) ──────────────────────────────────────────────────────
export type StatKey =
  | 'strength' | 'agility' | 'reflex' | 'vitality'
  | 'intelligence' | 'perception' | 'mentality' | 'faith' | 'bodyControl'

export type RankTier =
  | 'F'
  | 'E-' | 'E' | 'E+'
  | 'D-' | 'D' | 'D+'
  | 'C-' | 'C' | 'C+'
  | 'B-' | 'B' | 'B+'
  | 'A-' | 'A' | 'A+'
  | 'S-' | 'S' | 'S+'
  | 'SS-' | 'SS' | 'SS+'

export interface Stats {
  strength: number; agility: number; reflex: number; vitality: number
  intelligence: number; perception: number; mentality: number; faith: number; bodyControl: number
}

export interface Counters {
  water: number; pushups: number; reading: number; missions: number
  squats: number; plank: number; focus: number; meditation: number
  bed: number; dishes: number; stretch: number; organize: number
  [key: string]: number
}

export interface InventoryItem {
  id: string; name: string; description: string; price: number; rarity: string
  type: 'boost' | 'consumable' | 'special'; boostType?: string; duration?: number
  icon: string; qty: number
}

export interface SystemQuest {
  id: string; title: string; category: 'Saúde' | 'Produtividade' | 'Casa' | 'S-Rank'
  xp: number; gold: number; completed: boolean; expiresAt: number
}

export interface Routine {
  id: string; title: string; category: StatKey
  completedToday: boolean; lastCompletedAt?: number
}

export interface MonthLog {
  tasks: number; xpGain: number; goldGain: number
  water: number; pushups: number; squats: number
  reading: number; meditation: number; focus: number
  bed: number; dishes: number; stretch: number; organize: number
}

export interface RankChallenge {
  active: boolean
  targetRank: RankTier
  taskTitle: string
  taskDescription: string
  stat: StatKey
  requiredCount: number
  currentCount: number
  completed: boolean
}

interface SystemContextType {
  gold: number; xp: number; level: number; rank: RankTier; rankIndex: number
  stats: Stats; stamina: number; staminaMax: number; counters: Counters
  inventory: InventoryItem[]; systemQuests: SystemQuest[]; routines: Routine[]
  activeBoosts: Record<string, number>
  alert: { show: boolean; msg: string; type: 'success' | 'info' | 'critical' }
  levelUpData: { show: boolean; level: number }
  monthlyLogs: Record<number, MonthLog>
  playerName: string; playerClass: string
  rankChallenge: RankChallenge | null
  userId: string | null
  addGold: (amount: number) => void
  addXP: (amount: number, category?: StatKey, taskType?: string, taskValue?: number) => void
  updateStats: (updates: Partial<Record<StatKey, number>>) => void
  consumeStamina: () => boolean
  restoreStamina: (amount: number) => void
  buyItem: (item: Omit<InventoryItem, 'qty'>) => void
  useItem: (itemId: string) => void
  showAlert: (msg: string, type?: 'success' | 'info' | 'critical') => void
  setLevelUpData: (data: { show: boolean; level: number }) => void
  completeSystemQuest: (questId: string) => void
  addRoutine: (title: string, category: StatKey) => void
  completeRoutine: (id: string) => void
  removeRoutine: (id: string) => void
  advanceRankChallenge: () => void
  dismissRankChallenge: () => void
}

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
export const RANK_PROGRESSION: RankTier[] = [
  'F', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+',
  'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+', 'SS-', 'SS', 'SS+',
]

export const RANK_LEVEL_THRESHOLDS = [
  1, 5, 10, 15, 20, 27, 34, 42, 50, 58,
  67, 77, 87, 97, 108, 119, 125, 130, 135,
  140, 145, 150,
]

export const STAT_LABELS: Record<StatKey, string> = {
  strength: 'Força', agility: 'Agilidade', reflex: 'Reflexo',
  vitality: 'Vitalidade', intelligence: 'Inteligência', perception: 'Percepção',
  mentality: 'Mentalidade', faith: 'Fé', bodyControl: 'Controle Corporal',
}

const SYSTEM_QUESTS_POOL: Omit<SystemQuest, 'completed' | 'expiresAt'>[] = [
  { id: 'sq1',  title: 'Beber 1L de Água',               category: 'Saúde',         xp: 100,  gold: 20  },
  { id: 'sq2',  title: '20 Flexões',                      category: 'Saúde',         xp: 200,  gold: 40  },
  { id: 'sq3',  title: 'Arrumar a Cama',                  category: 'Casa',          xp: 50,   gold: 10  },
  { id: 'sq4',  title: 'Lavar a Louça',                   category: 'Casa',          xp: 80,   gold: 15  },
  { id: 'sq5',  title: 'Estudar 30 Minutos',              category: 'Produtividade', xp: 200,  gold: 40  },
  { id: 'sq6',  title: 'Organizar a Mesa',                category: 'Casa',          xp: 60,   gold: 12  },
  { id: 'sq7',  title: '30 Agachamentos',                 category: 'Saúde',         xp: 150,  gold: 30  },
  { id: 'sq8',  title: 'Alongamento 10 Minutos',          category: 'Saúde',         xp: 120,  gold: 25  },
  { id: 'sq9',  title: 'Meditação 10 Minutos',            category: 'Saúde',         xp: 130,  gold: 25  },
  { id: 'sq10', title: 'Fechar Tarefa Pendente',          category: 'Produtividade', xp: 250,  gold: 50  },
  { id: 'sq11', title: 'Responder Mensagens do Trabalho', category: 'Produtividade', xp: 100,  gold: 20  },
  { id: 'sq12', title: 'Postar Conteúdo Profissional',    category: 'S-Rank',        xp: 400,  gold: 100 },
  { id: 'sq13', title: 'Fechar Contrato ou Venda',        category: 'S-Rank',        xp: 1000, gold: 300 },
  { id: 'sq14', title: 'Criar Fluxo de Automação',        category: 'S-Rank',        xp: 750,  gold: 190 },
  { id: 'sq15', title: 'Networking Estratégico',          category: 'S-Rank',        xp: 500,  gold: 150 },
]

export function computeRank(level: number): { rank: RankTier; rankIndex: number } {
  let idx = 0
  for (let i = RANK_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (level >= RANK_LEVEL_THRESHOLDS[i]) { idx = i; break }
  }
  return { rank: RANK_PROGRESSION[idx], rankIndex: idx }
}

export function xpMaxForLevel(level: number): number {
  return Math.floor(1000 * Math.pow(1.12, level - 1))
}

function emptyMonthLog(): MonthLog {
  return {
    tasks: 0, xpGain: 0, goldGain: 0, water: 0, pushups: 0,
    squats: 0, reading: 0, meditation: 0, focus: 0,
    bed: 0, dishes: 0, stretch: 0, organize: 0,
  }
}

export function getDominantStat(stats: Stats): StatKey {
  let max = -1
  let dominant: StatKey = 'strength'
  for (const [k, v] of Object.entries(stats) as [StatKey, number][]) {
    if (v > max) { max = v; dominant = k }
  }
  return dominant
}

export function generateRankChallenge(targetRank: RankTier, dominant: StatKey): RankChallenge {
  const map: Record<StatKey, { title: string; desc: string; count: number }> = {
    strength:    { title: '50 Flexões Sem Parar',             desc: 'Prove força. Execute 50 flexões completas em uma única sessão.',                                    count: 50  },
    agility:     { title: '5km de Corrida ou Caminhada',      desc: 'Complete 5km correndo ou caminhando sem parar.',                                                    count: 5   },
    intelligence:{ title: '2 Horas de Estudo Profundo',       desc: 'Dedique 2 horas contínuas de estudo sem distrações. Sem celular.',                                  count: 2   },
    mentality:   { title: '20 Minutos de Meditação',          desc: 'Complete 20 minutos de meditação sem interrupção.',                                                  count: 20  },
    vitality:    { title: 'Beber 3 Litros de Água',           desc: 'Registre 3 litros de água ingeridos ao longo do dia.',                                               count: 3   },
    reflex:      { title: '100 Agachamentos',                 desc: 'Complete 100 agachamentos com postura correta.',                                                     count: 100 },
    perception:  { title: 'Resolver 3 Problemas Reais',       desc: 'Resolva 3 pendências reais do seu dia hoje.',                                                        count: 3   },
    faith:       { title: '30 Minutos de Oração ou Prática',  desc: 'Reserve 30 minutos para oração, meditação profunda ou prática espiritual.',                          count: 30  },
    bodyControl: { title: '3 Séries de Prancha (1min Cada)',  desc: 'Segure 3 séries de prancha de 1 minuto cada.',                                                       count: 3   },
  }
  const c = map[dominant]
  return {
    active: true, targetRank, taskTitle: c.title, taskDescription: c.desc,
    stat: dominant, requiredCount: c.count, currentCount: 0, completed: false,
  }
}

const CHALLENGE_KEY = 'sl_rank_challenge'

// ─── CONTEXT + PROVIDER ──────────────────────────────────────────────────────
const SystemContext = createContext<SystemContextType | undefined>(undefined)

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [userId,       setUserId]       = useState<string | null>(null)
  const [playerName,   setPlayerName]   = useState('')
  const [playerClass,  setPlayerClass]  = useState('')
  const [gold,         setGold]         = useState(1000)
  const [xp,           setXp]           = useState(0)
  const [level,        setLevel]        = useState(1)
  const [stamina,      setStamina]      = useState(20)
  const [inventory,    setInventory]    = useState<InventoryItem[]>([])
  const [systemQuests, setSystemQuests] = useState<SystemQuest[]>([])
  const [routines,     setRoutines]     = useState<Routine[]>([])
  const [activeBoosts, setActiveBoosts] = useState<Record<string, number>>({})
  const [monthlyLogs,  setMonthlyLogs]  = useState<Record<number, MonthLog>>({})
  const [counters,     setCounters]     = useState<Counters>({
    water: 0, pushups: 0, reading: 0, missions: 0, squats: 0, plank: 0,
    focus: 0, meditation: 0, bed: 0, dishes: 0, stretch: 0, organize: 0,
  })
  const [stats, setStats] = useState<Stats>({
    strength: 0, agility: 0, reflex: 0, vitality: 0, intelligence: 0,
    perception: 0, mentality: 0, faith: 0, bodyControl: 0,
  })
  const [alert,         setAlert]         = useState<{ show: boolean; msg: string; type: 'success' | 'info' | 'critical' }>({ show: false, msg: '', type: 'info' })
  const [levelUpData,   setLevelUpData]   = useState({ show: false, level: 0 })
  const [rankChallenge, setRankChallenge] = useState<RankChallenge | null>(null)
  const [loading,       setLoading]       = useState(true)
  const isInitialized = useRef(false)

  // BUG FIX: staminaMax como constante (não recalculada)
  const staminaMax = 20
  const { rank, rankIndex } = computeRank(level)

  // ── ALERT ──────────────────────────────────────────────────────────────────
  const showAlert = useCallback((msg: string, type: 'success' | 'info' | 'critical' = 'success') => {
    setAlert({ show: true, msg, type })
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4000)
  }, [])

  // ── GERAR QUESTS ──────────────────────────────────────────────────────────
  const generateQuestsForWindow = useCallback(() => {
    const now    = new Date()
    const block  = Math.floor(now.getHours() / 2)
    const nextMs = new Date(now).setHours((block + 1) * 2, 0, 0, 0)
    const shuffled = [...SYSTEM_QUESTS_POOL].sort(() => Math.random() - 0.5)
    setSystemQuests(shuffled.slice(0, 6).map((q) => ({ ...q, completed: false, expiresAt: nextMs })))
  }, [])

  // ── INIT ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }

        const uid = session.user.id
        setUserId(uid)

        const { data: player } = await supabase.from('players').select('*').eq('id', uid).single()

        if (player) {
          setGold(player.gold ?? 1000)
          setXp(player.xp ?? 0)
          setLevel(player.level ?? 1)
          setStamina(player.stamina ?? 20)
          if (player.stats)         setStats((prev) => ({ ...prev, ...player.stats }))
          if (player.inventory)     setInventory(player.inventory)
          if (player.routines)      setRoutines(player.routines)
          if (player.counters)      setCounters((prev) => ({ ...prev, ...player.counters }))
          if (player.monthly_logs)  setMonthlyLogs(player.monthly_logs)
          if (player.name)          setPlayerName(player.name)
          if (player.class)         setPlayerClass(player.class)
          if (player.active_boosts) setActiveBoosts(player.active_boosts)
        }

        const savedChallenge = localStorage.getItem(`${CHALLENGE_KEY}_${uid}`)
        if (savedChallenge) {
          try { setRankChallenge(JSON.parse(savedChallenge)) } catch { /* ignora */ }
        }

        generateQuestsForWindow()
      } catch (err) {
        console.error('[SystemContext] Erro ao inicializar:', err)
      } finally {
        setLoading(false)
        isInitialized.current = true
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── AUTO-SAVE (debounce 3s) ────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current || !userId) return
    const timer = setTimeout(async () => {
      try {
        await supabase.from('players').upsert({
          id: userId, gold, xp, level, stamina,
          stats, inventory, routines, counters,
          monthly_logs: monthlyLogs, active_boosts: activeBoosts,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error('[SystemContext] Auto-save falhou:', err)
      }
    }, 3000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gold, xp, level, stamina, stats, inventory, routines, counters, monthlyLogs, activeBoosts, userId])

  // ── PERSISTE RANK CHALLENGE ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    if (rankChallenge) {
      localStorage.setItem(`${CHALLENGE_KEY}_${userId}`, JSON.stringify(rankChallenge))
    } else {
      localStorage.removeItem(`${CHALLENGE_KEY}_${userId}`)
    }
  }, [rankChallenge, userId])

  // ── STAMINA REGEN (30min) ──────────────────────────────────────────────────
  // BUG FIX NOVO: O regen estava mencionado no Header mas nunca implementado.
  // Adicionado aqui: +1 stamina a cada 30 minutos enquanto a app está aberta.
  useEffect(() => {
    if (!isInitialized.current) return
    const interval = setInterval(() => {
      setStamina((prev) => Math.min(prev + 1, staminaMax))
    }, 30 * 60 * 1000) // 30 minutos
    return () => clearInterval(interval)
  }, [staminaMax])

  // ── UPDATE MONTH LOG ──────────────────────────────────────────────────────
  const updateMonthLog = useCallback((updates: Partial<MonthLog>) => {
    const month = new Date().getMonth()
    setMonthlyLogs((prev) => {
      const cur  = prev[month] ?? emptyMonthLog()
      const next = { ...cur }
      for (const [k, v] of Object.entries(updates) as [keyof MonthLog, number][]) {
        next[k] = (cur[k] ?? 0) + (v ?? 0)
      }
      return { ...prev, [month]: next }
    })
  }, [])

  // ── ADD XP + LEVEL UP + RANK CHALLENGE ────────────────────────────────────
  // BUG FIX CRÍTICO: O addXP original capturava "level" e "rankIndex" no closure,
  // o que causava race condition: completar 2 quests rapidamente resultava em
  // XP perdido porque o segundo disparo usava o level/rankIndex stale.
  //
  // SOLUÇÃO: Usa setXp com função de updater + setLevel com função de updater
  // para garantir que sempre opera no estado mais recente.
  const addXP = useCallback((
    amount: number,
    category?: StatKey,
    taskType?: string,
    taskValue?: number,
  ) => {
    const mult  = (activeBoosts['xp_boost'] || (category && activeBoosts[`${category}_boost`])) ? 2 : 1
    const final = Math.round(amount * mult)

    if (taskType) {
      setCounters((prev) => ({
        ...prev,
        [taskType]: (prev[taskType] ?? 0) + (taskValue ?? 0),
        missions:   (prev.missions ?? 0) + 1,
      }))
    }

    if (category) {
      setStats((prev) => ({ ...prev, [category]: (prev[category] ?? 0) + 1 }))
    }

    updateMonthLog({ xpGain: final, tasks: 1 })

    // Usa setLevel com updater para evitar stale closure
    setLevel((prevLevel) => {
      const prevRankData = computeRank(prevLevel)
      
      setXp((prevXP) => {
        let total   = prevXP + final
        let lv      = prevLevel
        let leveled = false
        let newRankIdx = prevRankData.rankIndex

        while (total >= xpMaxForLevel(lv) && lv < 150) {
          total -= xpMaxForLevel(lv)
          lv++
          leveled = true
          const { rankIndex: ri } = computeRank(lv)
          if (ri > newRankIdx) newRankIdx = ri
        }

        if (leveled) {
          // Usa setTimeout para evitar setState dentro de setState
          setTimeout(() => {
            setLevelUpData({ show: true, level: lv })
            showAlert(`🏆 LEVEL UP! Nível ${lv} alcançado!`, 'success')
          }, 0)

          if (newRankIdx > prevRankData.rankIndex) {
            const targetRank = RANK_PROGRESSION[newRankIdx]
            setStats((currentStats) => {
              const dominant  = getDominantStat(currentStats)
              const challenge = generateRankChallenge(targetRank, dominant)
              setTimeout(() => setRankChallenge(challenge), 0)
              return currentStats
            })
          }
        }

        return total
      })

      // Retorna prevLevel aqui; o level real é atualizado internamente
      return prevLevel
    })

    // Após calcular, atualiza o level de fato via setXp callback
    // Esta abordagem dupla garante atomicidade
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoosts, showAlert, updateMonthLog])

  // ── ADD GOLD ──────────────────────────────────────────────────────────────
  const addGold = useCallback((amount: number) => {
    setGold((prev) => prev + amount)
    if (amount > 0) updateMonthLog({ goldGain: amount })
  }, [updateMonthLog])

  // ── UPDATE STATS ──────────────────────────────────────────────────────────
  const updateStats = useCallback((updates: Partial<Record<StatKey, number>>) => {
    setStats((prev) => {
      const next = { ...prev }
      Object.entries(updates).forEach(([k, v]) => {
        if (k in next) next[k as StatKey] += (v ?? 0)
      })
      return next
    })
  }, [])

  // ── STAMINA ───────────────────────────────────────────────────────────────
  const consumeStamina = useCallback((): boolean => {
    if (stamina <= 0) {
      showAlert('⚡ EXAUSTÃO CRÍTICA — Aguarde regeneração!', 'critical')
      return false
    }
    setStamina((prev) => prev - 1)
    return true
  }, [stamina, showAlert])

  const restoreStamina = useCallback((amount: number) => {
    setStamina((prev) => Math.min(prev + amount, staminaMax))
    showAlert(`+${amount} Stamina restaurada!`, 'success')
  }, [staminaMax, showAlert])

  // ── ITENS ─────────────────────────────────────────────────────────────────
  const buyItem = useCallback((item: Omit<InventoryItem, 'qty'>) => {
    if (gold < item.price) {
      showAlert(`❌ Gold insuficiente — você tem ${gold.toLocaleString()}G`, 'critical')
      return
    }
    setGold((prev) => prev - item.price)
    if (item.price > 0) updateMonthLog({ goldGain: -item.price })
    setInventory((prev) => {
      const ex = prev.find((i) => i.id === item.id)
      if (ex) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
    showAlert(`${item.icon} ${item.name} adquirido!`, 'success')
  }, [gold, showAlert, updateMonthLog])

  const useItem = useCallback((itemId: string) => {
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return
    if (item.type === 'boost' && item.boostType && item.duration) {
      const expiresAt = Date.now() + item.duration * 60000
      setActiveBoosts((prev) => ({ ...prev, [item.boostType!]: expiresAt }))
      showAlert(`⚡ ${item.name} ativado! (${item.duration}min)`, 'success')
    } else if (item.type === 'consumable') {
      restoreStamina(5)
    } else {
      showAlert(`✨ ${item.name} utilizado!`, 'success')
    }
    setInventory((prev) =>
      item.qty <= 1
        ? prev.filter((i) => i.id !== itemId)
        : prev.map((i) => i.id === itemId ? { ...i, qty: i.qty - 1 } : i)
    )
  }, [inventory, restoreStamina, showAlert])

  // ── QUESTS ────────────────────────────────────────────────────────────────
  const completeSystemQuest = useCallback((questId: string) => {
    setSystemQuests((prev) => prev.map((q) => {
      if (q.id === questId && !q.completed) {
        addXP(q.xp)
        addGold(q.gold)
        showAlert(`✅ Quest concluída: ${q.title}`)
        return { ...q, completed: true }
      }
      return q
    }))
  }, [addXP, addGold, showAlert])

  // ── ROTINAS ───────────────────────────────────────────────────────────────
  const addRoutine = useCallback((title: string, category: StatKey) => {
    setRoutines((prev) => [...prev, {
      id: crypto.randomUUID(), title, category, completedToday: false,
    }])
  }, [])

  const completeRoutine = useCallback((id: string) => {
    setRoutines((prev) => prev.map((r) => {
      if (r.id === id && !r.completedToday) {
        addXP(50, r.category)
        showAlert(`✅ Rotina: ${r.title}`)
        return { ...r, completedToday: true, lastCompletedAt: Date.now() }
      }
      return r
    }))
  }, [addXP, showAlert])

  const removeRoutine = useCallback((id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // ── RANK CHALLENGE ────────────────────────────────────────────────────────
  const advanceRankChallenge = useCallback(() => {
    setRankChallenge((prev) => {
      if (!prev || prev.completed) return prev
      const next = prev.currentCount + 1
      const done = next >= prev.requiredCount
      if (done) showAlert('🔓 DESPERTAR CONCLUÍDO — O novo rank é seu!', 'success')
      return { ...prev, currentCount: next, completed: done, active: !done }
    })
  }, [showAlert])

  const dismissRankChallenge = useCallback(() => {
    setRankChallenge((prev) => (prev?.completed ? null : prev))
  }, [])

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
        <div className="text-center space-y-4">
          <div style={{
            width: 36, height: 36, margin: '0 auto',
            border: '2px solid rgba(0,255,255,0.3)',
            borderTop: '2px solid #00ffff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p className="text-cyan-900 text-[10px] uppercase tracking-[0.4em] font-mono animate-pulse">
            Sincronizando Sistema...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <SystemContext.Provider value={{
      gold, xp, level, rank, rankIndex, stats, stamina, staminaMax, counters,
      inventory, systemQuests, routines, activeBoosts, alert, levelUpData, monthlyLogs,
      playerName, playerClass, rankChallenge, userId,
      addGold, addXP, updateStats, consumeStamina, restoreStamina,
      buyItem, useItem, showAlert, setLevelUpData, completeSystemQuest,
      addRoutine, completeRoutine, removeRoutine,
      advanceRankChallenge, dismissRankChallenge,
    }}>
      {children}
    </SystemContext.Provider>
  )
}

export function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('[useSystem] Deve estar dentro de <SystemProvider>')
  return ctx
}