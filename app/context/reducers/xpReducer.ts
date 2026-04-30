// app/context/reducers/xpReducer.ts

export type StatKey = 'strength' | 'agility' | 'reflex' | 'vitality' | 'intelligence' | 'perception' | 'mentality' | 'faith' | 'bodyControl';

export interface Stats extends Record<StatKey, number> {}

export interface Counters extends Record<string, number> {
  missions: number;
}

export interface MonthLog {
  xpGain: number;
  goldGain: number;
  tasks: number;
  [key: string]: number;
}

export interface XPState {
  xp: number
  level: number
  gold: number
  stats: Stats
  counters: Counters
  monthlyLogs: Record<number, MonthLog>
}

// ✅ VERSÃO SEM payload - compatível com seu dispatch atual
export type XPAction =
  | { type: 'ADD_XP'; amount: number; category?: StatKey; taskType?: string; taskValue?: number; activeBoosts: Record<string, number>; shadowBonusPct?: number }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'SPEND_GOLD'; amount: number }
  | { type: 'LOAD'; state: Partial<XPState> }

// Funções Auxiliares
const xpMaxForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));
const emptyMonthLog = (): MonthLog => ({ xpGain: 0, goldGain: 0, tasks: 0 });

// Rank progression
const RANK_PROGRESSION = ['F', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+', 'SS-', 'SS', 'SS+'];
const RANK_LEVEL_THRESHOLDS = [1, 5, 10, 15, 20, 27, 34, 42, 50, 58, 67, 77, 87, 97, 108, 119, 125, 130, 135, 140, 145, 150];

const computeRankIndex = (level: number): number => {
  let idx = 0
  for (let i = RANK_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (level >= RANK_LEVEL_THRESHOLDS[i]) { idx = i; break }
  }
  return idx
}

export function xpReducer(state: XPState, action: XPAction): XPState {
  switch (action.type) {
    case 'ADD_XP': {
      // ✅ SEM payload - direto do action
      const { amount, category, taskType, taskValue, activeBoosts, shadowBonusPct = 0 } = action
      const now = Date.now()
      const boostActive = (activeBoosts['xp_boost'] ?? 0) > now ||
        (category && (activeBoosts[`${category}_boost`] ?? 0) > now)
      const multiplier = (boostActive ? 2 : 1) * (1 + shadowBonusPct / 100)
      const final = Math.round(amount * multiplier)

      let newXP = state.xp + final
      let newLevel = state.level
      const prevRankIdx = computeRankIndex(state.level)
      let newRankIdx = prevRankIdx

      while (newXP >= xpMaxForLevel(newLevel) && newLevel < 150) {
        newXP -= xpMaxForLevel(newLevel)
        newLevel++
        const ri = computeRankIndex(newLevel)
        if (ri > newRankIdx) newRankIdx = ri
      }

      const newCounters = { ...state.counters }
      if (taskType) {
        newCounters[taskType] = (newCounters[taskType] ?? 0) + (taskValue ?? 0)
        newCounters.missions = (newCounters.missions ?? 0) + 1
      }

      const newStats = { ...state.stats }
      if (category) newStats[category] = (newStats[category] ?? 0) + 1

      const month = new Date().getMonth()
      const cur = state.monthlyLogs[month] ?? emptyMonthLog()
      const newLog: MonthLog = { ...cur, xpGain: cur.xpGain + final, tasks: cur.tasks + 1 }

      if (taskType && taskValue != null) {
        newLog[taskType] = (cur[taskType] ?? 0) + taskValue
      }

      const result = {
        ...state,
        xp: newXP,
        level: newLevel,
        stats: newStats,
        counters: newCounters,
        monthlyLogs: { ...state.monthlyLogs, [month]: newLog },
      } as XPState & { _leveledUp?: number; _newRankIdx?: number }
      
      if (newLevel > state.level) result._leveledUp = newLevel
      if (newRankIdx > prevRankIdx) result._newRankIdx = newRankIdx
      
      return result
    }

    case 'ADD_GOLD': {
      const month = new Date().getMonth()
      const cur = state.monthlyLogs[month] ?? emptyMonthLog()
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
      const month = new Date().getMonth()
      const cur = state.monthlyLogs[month] ?? emptyMonthLog()
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
      return { ...state, ...action.state }

    default:
      return state
  }
}