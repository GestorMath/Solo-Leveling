'use client'
import { useSystem, RANK_PROGRESSION, RANK_LEVEL_THRESHOLDS, xpMaxForLevel } from '../context/SystemContext'
import { User, Zap, Battery, Coins } from 'lucide-react'
import { RANK_COLORS } from '@/app/lib/RankConfig'

export default function Header() {
  const system = useSystem()

  // Fallback de loading — evita layout shift
  if (!system) {
    return (
      <header className="w-full h-14 bg-black border-b border-cyan-900/30 animate-pulse flex-shrink-0" />
    )
  }

  const { xp, level, rank, stamina, staminaMax, playerName, gold } = system

  const xpMax       = xpMaxForLevel(level)
  const xpPct       = Math.min(Math.round((xp / Math.max(xpMax, 1)) * 100), 100)
  const staminaPct  = Math.round((stamina / staminaMax) * 100)
  const rankColor   = RANK_COLORS[rank] ?? '#00ffff'
  const displayName = playerName || 'Jogador'

  const rankIdx  = RANK_PROGRESSION.indexOf(rank as never)
  const nextRank = RANK_PROGRESSION[rankIdx + 1]
  const nextLv   = RANK_LEVEL_THRESHOLDS[rankIdx + 1]

  return (
    <header className="w-full bg-black/90 backdrop-blur-md border-b border-cyan-900/30 px-4 py-2.5 sticky top-0 z-50 font-mono flex-shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

        {/* ── Avatar + nome + nível ─────────────────────── */}
        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center bg-slate-900 transition-all"
              style={{ borderColor: rankColor, boxShadow: `0 0 8px ${rankColor}44` }}
            >
              <User size={16} className="text-slate-400" />
            </div>
            {/* Badge de rank */}
            <div
              className="absolute -bottom-0.5 -right-0.5 font-black leading-tight text-black text-center"
              style={{
                background: rankColor,
                fontSize: '7px',
                padding: '1px 3px',
                minWidth: '18px',
                lineHeight: '1.2',
              }}
            >
              {rank}
            </div>
          </div>

          <div className="min-w-0">
            <p
              className="font-black text-[10px] uppercase tracking-wider leading-none truncate max-w-[100px] sm:max-w-[140px]"
              style={{ color: rankColor }}
            >
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-white font-black text-sm leading-none">Nv.{level}</span>
              {nextRank && (
                <span className="hidden sm:inline text-[8px] text-slate-700 border border-slate-800 px-1 leading-snug whitespace-nowrap">
                  → {nextRank} em Nv.{nextLv}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Barras de XP e Stamina — desktop ─────────── */}
        <div className="flex-1 max-w-sm hidden md:flex gap-5">

          {/* XP */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
              <span className="text-[7px] uppercase tracking-widest font-black" style={{ color: `${rankColor}88` }}>
                XP
              </span>
              <span className="text-[7px] font-mono tabular-nums" style={{ color: rankColor }}>
                {xp.toLocaleString()} / {xpMax.toLocaleString()}
              </span>
            </div>
            <div className="h-1 bg-slate-900 overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${xpPct}%`,
                  background: rankColor,
                  boxShadow: `0 0 4px ${rankColor}`,
                }}
              />
            </div>
          </div>

          {/* Stamina */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
              <span
                className={`text-[7px] uppercase tracking-widest font-black flex items-center gap-0.5 ${
                  stamina <= 5 ? 'text-red-600 animate-pulse' : 'text-red-900'
                }`}
              >
                <Zap size={6} /> Stamina
              </span>
              <span
                className={`text-[7px] font-mono tabular-nums ${
                  stamina <= 5 ? 'text-red-400 animate-pulse' : 'text-red-500'
                }`}
              >
                {stamina}/{staminaMax}
              </span>
            </div>
            <div className="h-1 bg-slate-900 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stamina <= 5 ? 'bg-red-600' : 'bg-red-500'
                }`}
                style={{ width: `${staminaPct}%` }}
              />
            </div>
            {stamina <= 5 && (
              <p className="text-[6px] text-red-800 mt-0.5 animate-pulse leading-none">
                regen +1/30min
              </p>
            )}
          </div>
        </div>

        {/* ── Gold + Battery icon ───────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <Coins size={12} className="text-yellow-600" />
            <span className="font-black text-sm text-yellow-500 tabular-nums leading-none">
              {gold.toLocaleString()}
              <span className="text-[9px] opacity-50 ml-0.5">G</span>
            </span>
          </div>
          <Battery
            size={16}
            className={
              stamina > 10 ? 'text-green-500' :
              stamina > 5  ? 'text-yellow-500' :
              'text-red-500 animate-pulse'
            }
          />
        </div>

      </div>
    </header>
  )
}