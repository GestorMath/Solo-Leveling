'use client'
import { useSystem, RANK_PROGRESSION, RANK_LEVEL_THRESHOLDS } from '@/app/context/SystemContext'
import { RANK_COLORS, RANK_NAMES } from '@/app/lib/RankConfig'
import { useState, useEffect } from 'react'
import { TrendingUp, Shield, Zap, Brain, Eye, Heart, Activity, Dumbbell, Sword } from 'lucide-react'

const STAT_ICONS: Record<string, React.ReactNode> = {
  strength:     <Sword size={12} />,
  agility:      <Zap size={12} />,
  intelligence: <Brain size={12} />,
  vitality:     <Heart size={12} />,
  mentality:    <Shield size={12} />,
  reflex:       <Activity size={12} />,
  perception:   <Eye size={12} />,
  faith:        <TrendingUp size={12} />,
  bodyControl:  <Dumbbell size={12} />,
}

const STAT_LABELS: Record<string, string> = {
  strength: 'Força', agility: 'Agilidade', intelligence: 'Inteligência',
  vitality: 'Vitalidade', mentality: 'Mentalidade', reflex: 'Reflexo',
  perception: 'Percepção', faith: 'Fé', bodyControl: 'Controle Corporal',
}

function getRankColor(rank: string): string {
  return RANK_COLORS[rank] ?? '#888888'
}

function StatBar({ stat, value, max = 100 }: { stat: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const colors = ['#888', '#ffaa44', '#44ff88', '#4488ff', '#9944ff', '#00ffff', '#ff4466']
  const colorIdx = Math.floor((pct / 100) * (colors.length - 1))
  const color = colors[colorIdx]

  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-500 flex-shrink-0 w-4 flex items-center justify-center">
        {STAT_ICONS[stat]}
      </div>
      <span className="text-[9px] text-slate-500 font-bold w-28 shrink-0 uppercase tracking-wide">
        {STAT_LABELS[stat] ?? stat}
      </span>
      <div className="flex-1 h-[3px] bg-slate-900 overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="text-[10px] font-black tabular-nums w-8 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export default function RankPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-900 animate-pulse uppercase tracking-widest">
        Carregando Dados de Rank...
      </div>
    )
  }

  const { rank, rankIndex, level, xp, stats } = system
  const rankColor = getRankColor(rank)
  const rankName  = RANK_NAMES[rank] ?? rank

  // Rank anterior e próximo
  const prevRank     = RANK_PROGRESSION[rankIndex - 1]
  const nextRank     = RANK_PROGRESSION[rankIndex + 1]
  const nextRankLv   = RANK_LEVEL_THRESHOLDS[rankIndex + 1]
  const currentRankLv = RANK_LEVEL_THRESHOLDS[rankIndex]

  // Progresso dentro do rank atual
  const levelsInRank    = nextRankLv ? nextRankLv - currentRankLv : 5
  const levelsCompleted = nextRankLv ? Math.min(level - currentRankLv, levelsInRank) : levelsInRank
  const rankPct         = nextRankLv ? Math.round((levelsCompleted / levelsInRank) * 100) : 100

  // Atributos totais
  const totalStats = Object.values(stats).reduce((acc, v) => acc + v, 0)

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">

      {/* Header */}
      <header className="mb-10 border-b border-cyan-900/30 pb-6">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Tela 08 — Rank & Progressão</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
          Sistema de <span className="text-cyan-500">Classificação</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── COLUNA ESQUERDA: Rank atual ───────────────────────────────── */}
        <div className="space-y-6">

          {/* Card do rank atual */}
          <div
            className="p-6 border text-center relative overflow-hidden"
            style={{ borderColor: `${rankColor}40`, background: `${rankColor}06` }}
          >
            {/* Glow de fundo */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${rankColor}10 0%, transparent 70%)` }}
            />

            <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-3">Rank Atual</p>
            <div
              className="text-7xl font-black italic mb-2 tracking-tighter"
              style={{ color: rankColor, textShadow: `0 0 30px ${rankColor}80` }}
            >
              {rank}
            </div>
            <p className="font-bold text-sm tracking-widest uppercase" style={{ color: `${rankColor}cc` }}>
              {rankName}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-900 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Nível</p>
                <p className="text-xl font-black text-white">{level}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">XP Total</p>
                <p className="text-xl font-black text-cyan-400">{xp.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Progresso para próximo rank */}
          {nextRank && (
            <div className="bg-slate-950 border border-slate-900 p-5">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-3">
                Progresso → Rank {nextRank}
              </p>
              <div className="flex justify-between text-[9px] mb-2">
                <span className="font-bold" style={{ color: rankColor }}>Nv.{currentRankLv}</span>
                <span className="text-slate-500">Nv.{nextRankLv} para {nextRank}</span>
              </div>
              <div className="h-2 bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${rankPct}%`,
                    background: `linear-gradient(90deg, ${rankColor}, ${getRankColor(nextRank)})`,
                    boxShadow: `0 0 10px ${rankColor}60`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] mt-1.5">
                <span className="text-slate-600">{levelsCompleted}/{levelsInRank} níveis</span>
                <span style={{ color: rankColor }}>{rankPct}%</span>
              </div>
            </div>
          )}

          {/* Rank anterior / próximo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-900 p-3 text-center">
              <p className="text-[7px] text-slate-700 uppercase tracking-widest mb-1">Anterior</p>
              <p
                className="text-lg font-black"
                style={{ color: prevRank ? getRankColor(prevRank) : '#333' }}
              >
                {prevRank ?? '—'}
              </p>
            </div>
            <div
              className="border p-3 text-center"
              style={{ borderColor: nextRank ? `${getRankColor(nextRank)}40` : '#1f2937', background: nextRank ? `${getRankColor(nextRank)}06` : 'transparent' }}
            >
              <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Próximo</p>
              <p
                className="text-lg font-black"
                style={{ color: nextRank ? getRankColor(nextRank) : '#333' }}
              >
                {nextRank ?? 'MAX'}
              </p>
            </div>
          </div>
        </div>

        {/* ── COLUNA CENTRAL/DIREITA: Track de ranks + atributos ─────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Trilha completa de progressão */}
          <div className="bg-slate-950 border border-slate-900 p-6">
            <h2 className="text-[10px] font-black uppercase mb-5 text-slate-400 tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan-500" />
              Trilha de Progressão — F até SS+
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {RANK_PROGRESSION.map((r, idx) => {
                const rColor     = getRankColor(r)
                const isActive   = r === rank
                const isPast     = idx < rankIndex
                const isLocked   = idx > rankIndex

                return (
                  <div
                    key={r}
                    className={`p-2 border text-center transition-all relative ${
                      isActive
                        ? 'border-2'
                        : isPast
                          ? 'border opacity-60'
                          : 'border opacity-25'
                    }`}
                    style={isActive
                      ? { borderColor: rColor, background: `${rColor}12`, boxShadow: `0 0 15px ${rColor}40` }
                      : { borderColor: `${rColor}30`, background: isPast ? `${rColor}06` : 'transparent' }
                    }
                  >
                    {isActive && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
                        style={{ background: rColor, borderColor: rColor, boxShadow: `0 0 8px ${rColor}` }} />
                    )}
                    <p className="font-black text-sm leading-none mb-1" style={{ color: isLocked ? '#333' : rColor }}>
                      {r}
                    </p>
                    <p className="text-[6px] text-slate-700 uppercase leading-none">Nv.{RANK_LEVEL_THRESHOLDS[idx]}</p>
                    {isPast && (
                      <p className="text-[6px] mt-1" style={{ color: `${rColor}80` }}>✓</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Painel de atributos */}
          <div className="bg-slate-950 border border-slate-900 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Dumbbell size={14} className="text-cyan-500" /> Atributos do Player
              </h2>
              <div className="text-right">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-cyan-400">{totalStats}</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(stats).map(([stat, value]) => (
                <StatBar key={stat} stat={stat} value={value} max={Math.max(50, value + 10)} />
              ))}
            </div>

            <p className="text-[8px] text-slate-700 mt-5 border-t border-slate-900 pt-3">
              // Atributos crescem ao completar missões e rotinas vinculadas a cada stat.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}