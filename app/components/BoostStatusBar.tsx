'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useSystem } from '../context/SystemContext'
import { Zap, Timer } from 'lucide-react'
import { useState, useEffect, memo } from 'react'

// ─── Mapeamento de boostType → nome amigável ──────────────────────────────────
// FIX: antes exibia "PROTOCOL_XP_BOOST" — agora mostra nome legível

const BOOST_NAMES: Record<string, string> = {
  xp_boost:            'Bônus de XP',
  strength_boost:      'Bônus de Força',
  agility_boost:       'Bônus de Agilidade',
  intelligence_boost:  'Bônus de Inteligência',
  vitality_boost:      'Bônus de Vitalidade',
  mentality_boost:     'Bônus de Mentalidade',
  reflex_boost:        'Bônus de Reflexo',
  perception_boost:    'Bônus de Percepção',
  faith_boost:         'Bônus de Fé',
  bodyControl_boost:   'Controle Corporal',
  gold_boost:          'Bônus de Gold',
  all_boost:           'Bônus Geral',
  no_stamina_cost:     'Sem Custo de Stamina',
  shadow_bonus:        'Bônus Shadow Army',
}

const BOOST_ICONS: Record<string, string> = {
  xp_boost:           '⚡',
  strength_boost:     '💪',
  agility_boost:      '⚡',
  intelligence_boost: '🧠',
  vitality_boost:     '💧',
  mentality_boost:    '🌙',
  reflex_boost:       '🎯',
  perception_boost:   '👁️',
  faith_boost:        '✝️',
  bodyControl_boost:  '🤸',
  gold_boost:         '🪙',
  all_boost:          '🌟',
  no_stamina_cost:    '🔋',
  shadow_bonus:       '👥',
}

const BOOST_COLORS: Record<string, string> = {
  xp_boost:           '#00ffff',
  strength_boost:     '#ef4444',
  agility_boost:      '#f59e0b',
  intelligence_boost: '#8b5cf6',
  vitality_boost:     '#3b82f6',
  mentality_boost:    '#ec4899',
  reflex_boost:       '#10b981',
  perception_boost:   '#06b6d4',
  faith_boost:        '#fbbf24',
  bodyControl_boost:  '#84cc16',
  gold_boost:         '#eab308',
  all_boost:          '#fbbf24',
  no_stamina_cost:    '#22c55e',
  shadow_bonus:       '#a855f7',
}

function getBoostName(id: string): string {
  return BOOST_NAMES[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getBoostIcon(id: string): string {
  return BOOST_ICONS[id] ?? '⚡'
}

function getBoostColor(id: string): string {
  return BOOST_COLORS[id] ?? '#00ffff'
}

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSecs = Math.ceil(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// ─── Componente individual de boost ──────────────────────────────────────────

function BoostPill({ id, endTime, now }: { id: string; endTime: number; now: number }) {
  const remaining = Math.max(0, endTime - now)
  const color     = getBoostColor(id)
  const isExpiring = remaining < 60_000 // menos de 1 minuto

  return (
    <div
      className="pointer-events-auto backdrop-blur-xl px-3 py-2 flex items-center gap-3 shadow-lg"
      style={{
        background:  'rgba(0,0,0,0.92)',
        border:      `1px solid ${color}50`,
        boxShadow:   `0 0 16px ${color}20`,
        animation:   'slideDown 0.3s ease-out both',
      }}
    >
      {/* Ícone */}
      <div className="relative flex-shrink-0">
        <span className="text-base">{getBoostIcon(id)}</span>
        {isExpiring && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: color }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span
          className="text-[9px] font-black uppercase tracking-widest leading-none truncate"
          style={{ color }}
        >
          {getBoostName(id)}
        </span>

        {/* Timer */}
        <div className="flex items-center gap-1 mt-1">
          <Timer size={9} style={{ color: `${color}80` }} />
          <span
            className="text-[10px] font-mono font-bold leading-none"
            style={{ color: isExpiring ? '#ef4444' : color }}
          >
            {formatTime(remaining)}
          </span>
          {isExpiring && (
            <span className="text-[8px] text-red-500 font-bold animate-pulse ml-1">
              EXPIRANDO
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso do tempo restante (visual) */}
      <div className="w-1 h-8 bg-slate-900 overflow-hidden flex-shrink-0 rounded-full">
        <div
          className="w-full transition-none rounded-full"
          style={{
            height:     `${Math.min(100, (remaining / (60 * 60_000)) * 100)}%`,
            background: color,
            marginTop:  'auto',
          }}
        />
      </div>
    </div>
  )
}

// ─── Container principal — memoizado para evitar re-renders desnecessários ────

const BoostStatusBar = memo(function BoostStatusBar() {
  const { activeBoosts } = useSystem()
  const [now, setNow] = useState(Date.now())

  // IR-02: timer local — não propaga re-render para o contexto inteiro
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Filtrar apenas boosts ainda ativos
  const activeEntries = Object.entries(activeBoosts).filter(
    ([, endTime]) => endTime > now
  )

  if (activeEntries.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[998] flex flex-col items-end gap-2 pointer-events-none">
      {activeEntries.map(([id, endTime]) => (
        <BoostPill key={id} id={id} endTime={endTime} now={now} />
      ))}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
})

export default BoostStatusBar