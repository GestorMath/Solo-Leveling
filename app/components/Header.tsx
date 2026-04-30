'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import {
  useSystem, RANK_PROGRESSION, RANK_LEVEL_THRESHOLDS,
  xpMaxForLevel, THEME_COLORS,
} from '../context/SystemContext'
import { User, Zap, Battery, Coins } from 'lucide-react'
import { RANK_COLORS } from '@/app/lib/RankConfig'
import Image from 'next/image'
import { memo } from 'react'

// FIX: memoizado — evita re-render por changes não relacionados ao header
const Header = memo(function Header() {
  const system = useSystem()

  if (!system) {
    return (
      <header className="w-full h-20 bg-black border-b border-cyan-900/30 animate-pulse flex-shrink-0" />
    )
  }

  const {
    xp, level, rank, stamina, staminaMax,
    playerName, gold, avatarUrl, colorTheme,
    shadowBonusPct,
  } = system

  // FIX: xpMax é o teto do nível ATUAL, não total acumulado.
  // A barra mostra o progresso DENTRO do nível atual.
  const xpMax     = xpMaxForLevel(level)
  // xp já vem "zerado" no início de cada nível pelo reducer (subtrai o teto ao level up)
  const xpPct     = Math.min(Math.round((xp / Math.max(xpMax, 1)) * 100), 100)

  const staminaPct  = Math.round((stamina / staminaMax) * 100)
  const rankColor   = RANK_COLORS[rank] ?? '#00ffff'
  const themeColor  = THEME_COLORS[colorTheme] ?? '#00ffff'
  const displayName = playerName || 'Caçador'

  const rankIdx  = RANK_PROGRESSION.indexOf(rank as never)
  const nextRank = RANK_PROGRESSION[rankIdx + 1]
  const nextLv   = RANK_LEVEL_THRESHOLDS[rankIdx + 1]

  const staminaColor = stamina > 10 ? '#22c55e' : stamina > 5 ? '#eab308' : '#ef4444'
  const staminaLow   = stamina <= 5

  return (
    <header
      className="w-full bg-black/90 backdrop-blur-md border-b px-4 py-3 sticky top-0 z-50 font-mono flex-shrink-0"
      style={{ borderBottomColor: `${themeColor}30` }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* ── Avatar + nome + nível ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-slate-900 overflow-hidden transition-all"
              style={{ borderColor: rankColor, boxShadow: `0 0 12px ${rankColor}55` }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  unoptimized // base64 não passa pelo next/image optimizer
                />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>

            {/* Rank badge */}
            <div
              className="absolute -bottom-1 -right-1 font-black leading-tight text-black text-center rounded-sm"
              style={{
                background: rankColor,
                fontSize:   '7px',
                padding:    '2px 4px',
                minWidth:   '20px',
                lineHeight: '1.2',
              }}
            >
              {rank}
            </div>
          </div>

          <div className="min-w-0">
            <p
              className="font-black text-sm uppercase tracking-wider leading-tight truncate max-w-[110px] sm:max-w-[160px]"
              style={{ color: themeColor }}
            >
              {displayName}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-white font-black text-base leading-none">Nv.{level}</span>

              {/* Shadow bonus badge */}
              {shadowBonusPct > 0 && (
                <span className="text-[7px] font-black text-purple-400 border border-purple-900/50 px-1 py-0.5 leading-none">
                  +{shadowBonusPct}%
                </span>
              )}

              {nextRank && nextLv && (
                <span className="hidden sm:inline text-[8px] text-slate-700 border border-slate-800 px-1 py-0.5 leading-snug whitespace-nowrap rounded-sm">
                  → {nextRank} Nv.{nextLv}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Barras XP e Stamina — desktop ─────────────────────────────── */}
        <div className="flex-1 max-w-md hidden md:flex gap-5">

          {/* XP — FIX: mostra progresso no nível atual, não XP total */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1.5">
              <span
                className="text-[8px] uppercase tracking-widest font-black"
                style={{ color: `${themeColor}88` }}
              >
                XP
              </span>
              <span className="text-[8px] font-mono tabular-nums" style={{ color: themeColor }}>
                {xp.toLocaleString()} / {xpMax.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width:     `${xpPct}%`,
                  background: themeColor,
                  boxShadow: `0 0 6px ${themeColor}`,
                }}
              />
            </div>
            <p className="text-[7px] mt-0.5" style={{ color: `${themeColor}60` }}>
              {xpPct}% para Nv.{level + 1}
            </p>
          </div>

          {/* Stamina */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1.5">
              <span
                className={`text-[8px] uppercase tracking-widest font-black flex items-center gap-0.5 ${
                  staminaLow ? 'animate-pulse' : ''
                }`}
                style={{ color: staminaColor }}
              >
                <Zap size={8} /> Stamina
              </span>
              <span
                className="text-[8px] font-mono tabular-nums"
                style={{ color: staminaColor }}
              >
                {stamina}/{staminaMax}
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 overflow-hidden rounded-full">
              <div
                className={`h-full transition-all duration-500 rounded-full ${staminaLow ? 'animate-pulse' : ''}`}
                style={{ width: `${staminaPct}%`, background: staminaColor }}
              />
            </div>
            {staminaLow && (
              <p className="text-[7px] mt-0.5 leading-none" style={{ color: staminaColor }}>
                regen +1/30min
              </p>
            )}
          </div>
        </div>

        {/* ── Gold + Battery ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-yellow-600" />
            <span className="font-black text-base text-yellow-500 tabular-nums leading-none">
              {gold.toLocaleString()}
              <span className="text-[9px] opacity-50 ml-0.5">G</span>
            </span>
          </div>

          <Battery
            size={18}
            style={{ color: staminaColor }}
            className={staminaLow ? 'animate-pulse' : ''}
          />
        </div>

      </div>
    </header>
  )
})

export default Header