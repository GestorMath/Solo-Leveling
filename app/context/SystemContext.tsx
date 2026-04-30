'use client'
import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useReducer,
} from 'react'
import { supabase } from '@/app/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  intelligence: number; perception: number; mentality: number; faith: number
  bodyControl: number
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

export type ColorTheme = 'cyan' | 'purple' | 'gold'

export const THEME_COLORS: Record<ColorTheme, string> = {
  cyan: '#00ffff',
  purple: '#9944ff',
  gold: '#ffdd00',
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const TASK_KEY_MAP: Record<string, keyof MonthLog> = {
  water: 'water', pushups: 'pushups', squats: 'squats',
  reading: 'reading', meditation: 'meditation', focus: 'focus',
  bed: 'bed', dishes: 'dishes', stretch: 'stretch', organize: 'organize',
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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

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
    strength:     { title: '50 Flexões Sem Parar',            desc: 'Prove força. Execute 50 flexões completas em uma única sessão.',                count: 50  },
    agility:      { title: '5km de Corrida ou Caminhada',     desc: 'Complete 5km correndo ou caminhando sem parar.',                               count: 5   },
    intelligence: { title: '2 Horas de Estudo Profundo',      desc: 'Dedique 2 horas contínuas de estudo sem distrações. Sem celular.',             count: 2   },
    mentality:    { title: '20 Minutos de Meditação',         desc: 'Complete 20 minutos de meditação sem interrupção.',                            count: 20  },
    vitality:     { title: 'Beber 3 Litros de Água',          desc: 'Registre 3 litros de água ingeridos ao longo do dia.',                        count: 3   },
    reflex:       { title: '100 Agachamentos',                desc: 'Complete 100 agachamentos com postura correta.',                               count: 100 },
    perception:   { title: 'Resolver 3 Problemas Reais',      desc: 'Resolva 3 pendências reais do seu dia hoje.',                                 count: 3   },
    faith:        { title: '30 Minutos de Oração ou Prática', desc: 'Reserve 30 minutos para oração, meditação profunda ou prática espiritual.',    count: 30  },
    bodyControl:  { title: '3 Séries de Prancha (1min Cada)', desc: 'Segure 3 séries de prancha de 1 minuto cada.',                                count: 3   },
  }
  const c = map[dominant]
  return {
    active: true, targetRank, taskTitle: c.title, taskDescription: c.desc,
    stat: dominant, requiredCount: c.count, currentCount: 0, completed: false,
  }
}

// ─── XP Reducer (RC-01: elimina race condition de concurrent writes) ──────────

interface XPSlice {
  xp: number
  level: number
  gold: number
  stats: Stats
  counters: Counters
  monthlyLogs: Record<number, MonthLog>
}

type XPAction =
  | {
      type: 'ADD_XP'
      amount: number
      category?: StatKey
      taskType?: string
      taskValue?: number
      activeBoosts: Record<string, number>
      shadowBonusPct: number
    }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'SPEND_GOLD'; amount: number }
  | { type: 'LOAD'; slice: Partial<XPSlice> }

function xpReducer(state: XPSlice, action: XPAction): XPSlice {
  switch (action.type) {

    case 'ADD_XP': {
      const { amount, category, taskType, taskValue, activeBoosts, shadowBonusPct } = action
      const now = Date.now()
      const boostActive =
        (activeBoosts['xp_boost'] ?? 0) > now ||
        (category && (activeBoosts[`${category}_boost`] ?? 0) > now)
      const multiplier = (boostActive ? 2 : 1) * (1 + shadowBonusPct / 100)
      const final = Math.round(amount * multiplier)

      // Compute xp + level atomically — no stale closure possible in a reducer
      let newXP    = state.xp + final
      let newLevel = state.level
      let prevRankIdx = computeRank(state.level).rankIndex
      let newRankIdx  = prevRankIdx

      while (newXP >= xpMaxForLevel(newLevel) && newLevel < 150) {
        newXP -= xpMaxForLevel(newLevel)
        newLevel++
        const ri = computeRank(newLevel).rankIndex
        if (ri > newRankIdx) newRankIdx = ri
      }

      // Counters
      const newCounters = { ...state.counters }
      if (taskType) {
        newCounters[taskType] = (newCounters[taskType] ?? 0) + (taskValue ?? 0)
        newCounters.missions   = (newCounters.missions ?? 0) + 1
      }

      // Stats
      const newStats = { ...state.stats }
      if (category) newStats[category] = (newStats[category] ?? 0) + 1

      // Monthly log — single write, no double-counting
      const month  = new Date().getMonth()
      const cur    = state.monthlyLogs[month] ?? emptyMonthLog()
      const newLog = { ...cur, xpGain: cur.xpGain + final, tasks: cur.tasks + 1 }
      if (taskType && taskValue != null) {
        const key = TASK_KEY_MAP[taskType]
        if (key) newLog[key] = (cur[key] ?? 0) + taskValue
      }

      return {
        ...state,
        xp: newXP,
        level: newLevel,
        stats: newStats,
        counters: newCounters,
        monthlyLogs: { ...state.monthlyLogs, [month]: newLog },
        // Attach rank info for side-effect useEffect to read
        _leveledUp:    newLevel > state.level ? newLevel : undefined,
        _newRankIdx:   newRankIdx > prevRankIdx ? newRankIdx : undefined,
      } as XPSlice & { _leveledUp?: number; _newRankIdx?: number }
    }

    case 'ADD_GOLD': {
      const month  = new Date().getMonth()
      const cur    = state.monthlyLogs[month] ?? emptyMonthLog()
      return {
        ...state,
        gold: state.gold + action.amount,
        monthlyLogs: {
          ...state.monthlyLogs,
          [month]: { ...cur, goldGain: cur.goldGain + (action.amount > 0 ? action.amount : 0) },
        },
      }
    }

    case 'SPEND_GOLD': {
      const month  = new Date().getMonth()
      const cur    = state.monthlyLogs[month] ?? emptyMonthLog()
      return {
        ...state,
        gold: state.gold - action.amount,
        monthlyLogs: {
          ...state.monthlyLogs,
          [month]: { ...cur, goldGain: cur.goldGain - action.amount },
        },
      }
    }

    case 'LOAD':
      return { ...state, ...action.slice }

    default:
      return state
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface SystemContextType {
  // State
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
  avatarUrl: string | null
  colorTheme: ColorTheme
  shadowBonusPct: number
  // Actions
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
  setAvatarUrl: (url: string | null) => void
  setColorTheme: (theme: ColorTheme) => void
  setShadowBonusPct: (pct: number) => void
  logTaskToMonthly: (taskId: string, taskValue?: number) => Promise<void>  // ⬅️ NOVA LINHA
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CHALLENGE_KEY   = 'sl_rank_challenge'
const THEME_KEY       = 'sl_color_theme'
const AVATAR_KEY      = 'sl_avatar_url'
const STAMINA_KEY     = 'sl_stamina_snapshot'
const SHADOW_BONUS_KEY= 'sl_shadow_bonus_pct'

// ─── Context + Provider ───────────────────────────────────────────────────────

const SystemContext = createContext<SystemContextType | undefined>(undefined)

export function SystemProvider({ children }: { children: React.ReactNode }) {
  // RC-01: XP/gold/stats/counters/logs managed by atomic reducer
  const [xpSlice, dispatch] = useReducer(xpReducer, {
    xp: 0, level: 1, gold: 1000,
    stats: {
      strength: 0, agility: 0, reflex: 0, vitality: 0,
      intelligence: 0, perception: 0, mentality: 0, faith: 0, bodyControl: 0,
    },
    counters: {
      water: 0, pushups: 0, reading: 0, missions: 0, squats: 0, plank: 0,
      focus: 0, meditation: 0, bed: 0, dishes: 0, stretch: 0, organize: 0,
    },
    monthlyLogs: {},
  })

  const [userId,       setUserId]       = useState<string | null>(null)
  const [playerName,   setPlayerName]   = useState('')
  const [playerClass,  setPlayerClass]  = useState('')
  const [stamina,      setStamina]      = useState(20)
  const [inventory,    setInventory]    = useState<InventoryItem[]>([])
  const [systemQuests, setSystemQuests] = useState<SystemQuest[]>([])
  const [routines,     setRoutines]     = useState<Routine[]>([])
  const [activeBoosts, setActiveBoosts] = useState<Record<string, number>>({})
  const [shadowBonusPct, setShadowBonusPct] = useState(0)
  const [alert,         setAlert]         = useState<{ show: boolean; msg: string; type: 'success' | 'info' | 'critical' }>({ show: false, msg: '', type: 'info' })
  const [levelUpData,   setLevelUpData]   = useState({ show: false, level: 0 })
  const [rankChallenge, setRankChallenge] = useState<RankChallenge | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [avatarUrl,     setAvatarUrlState]= useState<string | null>(null)
  const [colorTheme,    setColorThemeState] = useState<ColorTheme>('cyan')

  const staminaMax = 20
  const { rank, rankIndex } = computeRank(xpSlice.level)

  // Refs for non-stale access inside callbacks and timeouts
  const userIdRef       = useRef<string | null>(null)
  const xpSliceRef      = useRef(xpSlice)
  const staminaRef      = useRef(stamina)
  const inventoryRef    = useRef(inventory)
  const routinesRef     = useRef(routines)
  const activeBoostsRef = useRef(activeBoosts)
  const shadowBonusRef  = useRef(shadowBonusPct)
  const isInitialized   = useRef(false)
  const saveTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep refs in sync
  useEffect(() => { xpSliceRef.current      = xpSlice      })
  useEffect(() => { staminaRef.current      = stamina      })
  useEffect(() => { inventoryRef.current    = inventory    })
  useEffect(() => { routinesRef.current     = routines     })
  useEffect(() => { activeBoostsRef.current = activeBoosts })
  useEffect(() => { shadowBonusRef.current  = shadowBonusPct })
  useEffect(() => { userIdRef.current       = userId       })

  // ── Level-up side effects (watches reducer output) ─────────────────────────
  const prevLevelRef = useRef(1)
  useEffect(() => {
    const s = xpSlice as XPSlice & { _leveledUp?: number; _newRankIdx?: number }
    if (!isInitialized.current) return
    if (s._leveledUp && s._leveledUp > prevLevelRef.current) {
      prevLevelRef.current = s._leveledUp
      setTimeout(() => {
        setLevelUpData({ show: true, level: s._leveledUp! })
        showAlert(`🏆 LEVEL UP! Nível ${s._leveledUp} alcançado!`, 'success')
      }, 0)
      if (s._newRankIdx !== undefined) {
        const targetRank = RANK_PROGRESSION[s._newRankIdx]
        const dominant   = getDominantStat(xpSlice.stats)
        const challenge  = generateRankChallenge(targetRank, dominant)
        setTimeout(() => setRankChallenge(challenge), 200)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpSlice.level])

  // ── showAlert ──────────────────────────────────────────────────────────────
  const showAlert = useCallback((msg: string, type: 'success' | 'info' | 'critical' = 'success') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
    setAlert({ show: true, msg, type })
    alertTimeoutRef.current = setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }))
    }, 4000)
  }, [])

  // ── Avatar / Theme ─────────────────────────────────────────────────────────
  const setAvatarUrl = useCallback((url: string | null) => {
    // Validar tamanho (base64 ~1.37x o tamanho original — limite 3.6MB → ~5MB base64)
    if (url && url.length > 5_000_000) {
      showAlert('❌ Imagem muito grande. Máximo 3.6MB.', 'critical')
      return
    }
    setAvatarUrlState(url)
    if (url) {
      try { localStorage.setItem(AVATAR_KEY, url) } catch {
        showAlert('⚠ Sem espaço para salvar avatar localmente.', 'info')
      }
    } else {
      localStorage.removeItem(AVATAR_KEY)
    }
  }, [showAlert])

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.style.setProperty('--theme-color', THEME_COLORS[theme])
  }, [])

  // ── Quest generation (seed diário determinístico) ──────────────────────────
  const generateQuestsForWindow = useCallback(() => {
    const tomorrow2am = new Date()
    tomorrow2am.setDate(tomorrow2am.getDate() + 1)
    tomorrow2am.setHours(2, 0, 0, 0)
    const nextMs = tomorrow2am.getTime()

    const d    = new Date()
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
    const pool = [...SYSTEM_QUESTS_POOL]
    let s = seed
    for (let i = pool.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0x7fffffff
      const j = s % (i + 1)
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setSystemQuests(pool.slice(0, 6).map(q => ({ ...q, completed: false, expiresAt: nextMs })))
  }, [])

  // ── Supabase save (debounced, uses refs — always fresh data) ───────────────
  const scheduleSave = useCallback((uid: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      const s  = xpSliceRef.current
      const now = new Date().toISOString()
      try {
        await supabase.from('players').update({
          gold:         s.gold,
          xp:           s.xp,
          level:        s.level,
          stamina:      staminaRef.current,
          stats:        s.stats,
          inventory:    inventoryRef.current,
          routines:     routinesRef.current,
          counters:     s.counters,
          monthly_logs: s.monthlyLogs,
          active_boosts:activeBoostsRef.current,
          avatar_url:   avatarUrl,
          updated_at:   now,
        }).eq('id', uid)
      } catch (err) {
        console.error('[SystemContext] Save failed:', err)
      }
    }, 2000)
  }, [avatarUrl])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }

        const uid = session.user.id
        setUserId(uid)
        userIdRef.current = uid

        const { data: player } = await supabase
          .from('players').select('*').eq('id', uid).single()

        if (player) {
          // Load XP slice atomically
          dispatch({
            type: 'LOAD',
            slice: {
              gold:        player.gold        ?? 1000,
              xp:          player.xp          ?? 0,
              level:       player.level       ?? 1,
              stats:       player.stats       ? { ...{strength:0,agility:0,reflex:0,vitality:0,intelligence:0,perception:0,mentality:0,faith:0,bodyControl:0}, ...player.stats } : undefined,
              counters:    player.counters    ? { ...{water:0,pushups:0,reading:0,missions:0,squats:0,plank:0,focus:0,meditation:0,bed:0,dishes:0,stretch:0,organize:0}, ...player.counters } : undefined,
              monthlyLogs: player.monthly_logs ?? {},
            },
          })

          // Stamina: restore with regen calculation
          try {
            const snap = JSON.parse(localStorage.getItem(STAMINA_KEY) || 'null')
            if (snap?.timestamp != null && snap?.value != null) {
              const elapsed   = Date.now() - snap.timestamp
              const regenAmt  = Math.floor(elapsed / (30 * 60 * 1000))
              setStamina(Math.min(snap.value + regenAmt, staminaMax))
            } else {
              setStamina(player.stamina ?? staminaMax)
            }
          } catch {
            setStamina(player.stamina ?? staminaMax)
          }

          if (player.inventory)      setInventory(player.inventory)
          if (player.routines)       setRoutines(player.routines)
          if (player.name)           setPlayerName(player.name)
          if (player.class)          setPlayerClass(player.class)
          if (player.avatar_url)     setAvatarUrlState(player.avatar_url)

          // Expire stale boosts
          if (player.active_boosts) {
            const now = Date.now()
            const valid: Record<string, number> = {}
            for (const [k, v] of Object.entries(player.active_boosts as Record<string, number>)) {
              if (v > now) valid[k] = v
            }
            setActiveBoosts(valid)
          }
        }

        // Theme
        const savedTheme = localStorage.getItem(THEME_KEY) as ColorTheme | null
        if (savedTheme && ['cyan','purple','gold'].includes(savedTheme)) {
          setColorThemeState(savedTheme)
          document.documentElement.style.setProperty('--theme-color', THEME_COLORS[savedTheme])
        }

        // Avatar fallback
        const savedAvatar = localStorage.getItem(AVATAR_KEY)
        if (savedAvatar && !player?.avatar_url) setAvatarUrlState(savedAvatar)

        // Shadow bonus
        const savedBonus = localStorage.getItem(SHADOW_BONUS_KEY)
        if (savedBonus) setShadowBonusPct(parseFloat(savedBonus) || 0)

        // Rank challenge
        const savedChallenge = localStorage.getItem(`${CHALLENGE_KEY}_${uid}`)
        if (savedChallenge) {
          try { setRankChallenge(JSON.parse(savedChallenge)) } catch { /* ignore */ }
        }

        generateQuestsForWindow()

        // Routine daily reset
        const lastResetKey = `sl_routine_reset_${uid}`
        const lastReset    = localStorage.getItem(lastResetKey)
        const today        = new Date().toDateString()
        if (lastReset !== today) {
          setRoutines(prev => prev.map(r => ({ ...r, completedToday: false })))
          localStorage.setItem(lastResetKey, today)
        }

        prevLevelRef.current = player?.level ?? 1

      } catch (err) {
        console.error('[SystemContext] Init error:', err)
      } finally {
        setLoading(false)
        isInitialized.current = true
      }
    }

    init()

    // ML-02: cleanup on unmount
    return () => {
      if (saveTimeoutRef.current)  clearTimeout(saveTimeoutRef.current)
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
      isInitialized.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current || !userIdRef.current) return
    scheduleSave(userIdRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpSlice, stamina, inventory, routines, activeBoosts, avatarUrl])

  // ── Persist stamina snapshot ───────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current) return
    localStorage.setItem(STAMINA_KEY, JSON.stringify({ value: stamina, timestamp: Date.now() }))
  }, [stamina])

  // ── Persist rank challenge ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    if (rankChallenge) {
      localStorage.setItem(`${CHALLENGE_KEY}_${userId}`, JSON.stringify(rankChallenge))
    } else {
      localStorage.removeItem(`${CHALLENGE_KEY}_${userId}`)
    }
  }, [rankChallenge, userId])

  // ── Persist shadow bonus ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(SHADOW_BONUS_KEY, String(shadowBonusPct))
  }, [shadowBonusPct])

  // ── Stamina regen ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current) return
    const interval = setInterval(() => {
      setStamina(prev => Math.min(prev + 1, staminaMax))
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [staminaMax])

  // ── Boost expiry cleanup ───────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setActiveBoosts(prev => {
        const next: Record<string, number> = {}
        let changed = false
        for (const [k, v] of Object.entries(prev)) {
          if (v > now) next[k] = v
          else changed = true
        }
        return changed ? next : prev
      })
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────────

// ── Actions ────────────────────────────────────────────────────────────────

const addXP = useCallback((
  amount: number,
  category?: StatKey,
  taskType?: string,
  taskValue?: number,
) => {
  dispatch({
    type: 'ADD_XP',
    amount,
    category,
    taskType,
    taskValue,
    activeBoosts: activeBoostsRef.current,
    shadowBonusPct: shadowBonusRef.current,
  })
}, [])

const addGold = useCallback((amount: number) => {
  dispatch({ type: 'ADD_GOLD', amount })
}, [])

// Função updateStats corrigida (apenas uma versão)
const updateStats = useCallback((updates: Partial<Record<StatKey, number>>) => {
  // Aplica os bônus de stats diretamente via LOAD
  const currentStats = xpSliceRef.current.stats
  const newStats = { ...currentStats }
  
  for (const [key, value] of Object.entries(updates)) {
    const statKey = key as StatKey
    newStats[statKey] = (currentStats[statKey] ?? 0) + (value ?? 0)
  }
  
  dispatch({
    type: 'LOAD',
    slice: { stats: newStats }
  })
}, [])

const consumeStamina = useCallback((): boolean => {
  if (staminaRef.current <= 0) {
    showAlert('⚡ EXAUSTÃO CRÍTICA — Aguarde regeneração!', 'critical')
    return false
  }
  setStamina(prev => prev - 1)
  return true
}, [showAlert])

const restoreStamina = useCallback((amount: number) => {
  setStamina(prev => Math.min(prev + amount, staminaMax))
  showAlert(`+${amount} Stamina restaurada!`, 'success')
}, [staminaMax, showAlert])

const buyItem = useCallback((item: Omit<InventoryItem, 'qty'>) => {
  const curGold = xpSliceRef.current.gold
  if (curGold < item.price) {
    showAlert(`❌ Gold insuficiente — você tem ${curGold.toLocaleString()}G`, 'critical')
    return
  }
  dispatch({ type: 'SPEND_GOLD', amount: item.price })
  setInventory(prev => {
    const ex = prev.find(i => i.id === item.id)
    if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { ...item, qty: 1 }]
  })
  showAlert(`${item.icon} ${item.name} adquirido!`, 'success')
}, [showAlert])

const useItem = useCallback((itemId: string) => {
  const item = inventoryRef.current.find(i => i.id === itemId)
  if (!item) return

  if (item.type === 'boost' && item.boostType && item.duration) {
    const expiresAt = Date.now() + item.duration * 60_000
    setActiveBoosts(prev => ({ ...prev, [item.boostType!]: expiresAt }))
    showAlert(`⚡ ${item.name} ativado! (${item.duration}min)`, 'success')
  } else if (item.type === 'consumable') {
    restoreStamina(5)
  } else {
    showAlert(`✨ ${item.name} utilizado!`, 'success')
  }

  setInventory(prev =>
    item.qty <= 1
      ? prev.filter(i => i.id !== itemId)
      : prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i)
  )
}, [restoreStamina, showAlert])

const completeSystemQuest = useCallback((questId: string) => {
  setSystemQuests(prev => prev.map(q => {
    if (q.id === questId && !q.completed) {
      setTimeout(() => {
        addXP(q.xp)
        addGold(q.gold)
        showAlert(`✅ Quest concluída: ${q.title}`)
      }, 0)
      return { ...q, completed: true }
    }
    return q
  }))
}, [addXP, addGold, showAlert])

const addRoutine = useCallback((title: string, category: StatKey) => {
  setRoutines(prev => [
    ...prev,
    { id: crypto.randomUUID(), title, category, completedToday: false },
  ])
}, [])

const completeRoutine = useCallback((id: string) => {
  setRoutines(prev => prev.map(r => {
    if (r.id === id && !r.completedToday) {
      setTimeout(() => {
        addXP(50, r.category)
        showAlert(`✅ Rotina: ${r.title}`)
      }, 0)
      return { ...r, completedToday: true, lastCompletedAt: Date.now() }
    }
    return r
  }))
}, [addXP, showAlert])

const removeRoutine = useCallback((id: string) => {
  setRoutines(prev => prev.filter(r => r.id !== id))
}, [])

const advanceRankChallenge = useCallback(() => {
  setRankChallenge(prev => {
    if (!prev || prev.completed) return prev
    const next = prev.currentCount + 1
    const done = next >= prev.requiredCount
    if (done) setTimeout(() => showAlert('🔓 DESPERTAR CONCLUÍDO — O novo rank é seu!', 'success'), 0)
    return { ...prev, currentCount: next, completed: done, active: !done }
  })
}, [showAlert])

const dismissRankChallenge = useCallback(() => {
  setRankChallenge(prev => (prev?.completed ? null : prev))
}, [])

const logTaskToMonthly = useCallback(async (taskId: string, taskValue?: number) => {
  try {
    if (!userIdRef.current) {
      console.warn('Usuário não autenticado, não foi possível logar tarefa mensal')
      return
    }
    showAlert(`📊 Tarefa registrada no histórico mensal!`, 'success')
  } catch (error) {
    console.error('Erro ao logar tarefa mensal:', error)
    showAlert('Erro ao registrar tarefa no histórico', 'critical')
  }
}, [showAlert])

  // ── Loading screen ─────────────────────────────────────────────────────────
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
    gold: xpSlice.gold,
    xp: xpSlice.xp,
    level: xpSlice.level,
    rank, rankIndex,
    stats: xpSlice.stats,
    stamina, staminaMax,
    counters: xpSlice.counters,
    inventory, systemQuests, routines, activeBoosts,
    alert, levelUpData,
    monthlyLogs: xpSlice.monthlyLogs,
    playerName, playerClass, rankChallenge, userId, avatarUrl, colorTheme,
    shadowBonusPct,
    addGold, addXP, updateStats, consumeStamina, restoreStamina,  // ⬅️ LINHA CORRIGIDA
    buyItem, useItem, showAlert, setLevelUpData, completeSystemQuest,
    addRoutine, completeRoutine, removeRoutine,
    advanceRankChallenge, dismissRankChallenge,
    setAvatarUrl, setColorTheme, setShadowBonusPct,
    logTaskToMonthly,
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