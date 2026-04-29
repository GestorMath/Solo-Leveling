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

export type XPAction =
  | { type: 'ADD_XP'; payload: { amount: number; category?: StatKey; taskType?: string; taskValue?: number; activeBoosts: Record<string, number> } }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'LOAD'; state: Partial<XPState> }

// Funções Auxiliares
const xpMaxForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));
const emptyMonthLog = (): MonthLog => ({ xpGain: 0, goldGain: 0, tasks: 0 });

export function xpReducer(state: XPState, action: XPAction): XPState {
  switch (action.type) {
    case 'ADD_XP': {
      const { amount, category, taskType, taskValue, activeBoosts } = action.payload
      const now = Date.now()
      const boosted = (activeBoosts['xp_boost'] ?? 0) > now ||
        (category && (activeBoosts[`${category}_boost`] ?? 0) > now)
      const final = Math.round(amount * (boosted ? 2 : 1))

      let newXP = state.xp + final
      let newLevel = state.level
      
      // Lógica Atômica de Level Up
      while (newXP >= xpMaxForLevel(newLevel) && newLevel < 150) {
        newXP -= xpMaxForLevel(newLevel)
        newLevel++
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
      const newLog = { ...cur, xpGain: cur.xpGain + final, tasks: cur.tasks + 1 }
      
      if (taskType && taskValue != null) {
        newLog[taskType] = (cur[taskType] ?? 0) + taskValue
      }

      return {
        ...state,
        xp: newXP,
        level: newLevel,
        stats: newStats,
        counters: newCounters,
        monthlyLogs: { ...state.monthlyLogs, [month]: newLog },
      }
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

    case 'LOAD':
      return { ...state, ...action.state }

    default:
      return state
  }
}