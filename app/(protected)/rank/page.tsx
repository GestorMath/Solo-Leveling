'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useSystem, RANK_PROGRESSION, RANK_LEVEL_THRESHOLDS, xpMaxForLevel } from '@/app/context/SystemContext'
import { RANK_COLORS, RANK_NAMES } from '@/app/lib/RankConfig'
import { supabase } from '@/app/lib/supabase'
import { useState, useEffect } from 'react'
import {
  TrendingUp, Shield, Zap, Brain, Eye, Heart,
  Activity, Dumbbell, Sword, RotateCcw, Loader2, Lock,
} from 'lucide-react'

// ─── Ícones por stat ──────────────────────────────────────────────────────────

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

// ─── StatBar ──────────────────────────────────────────────────────────────────

function StatBar({ stat, value, max = 100 }: { stat: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const colors = ['#888', '#ffaa44', '#44ff88', '#4488ff', '#9944ff', '#00ffff', '#ff4466']
  const colorIdx = Math.min(Math.floor((pct / 100) * (colors.length - 1)), colors.length - 1)
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const S_RANK_INDEX = RANK_PROGRESSION.indexOf('S') // 17

export default function RankPage() {
  const [mounted, setMounted] = useState(false)
  const system = useSystem()

  // Reset de rank
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting,        setResetting]        = useState(false)
  const [resetSuccess,     setResetSuccess]      = useState(false)
  const [resetError,       setResetError]        = useState('')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-900 animate-pulse uppercase tracking-widest">
        Carregando Dados de Rank...
      </div>
    )
  }

  const { rank, rankIndex, level, xp, stats, setShadowBonusPct, shadowBonusPct, showAlert } = system

  const rankColor     = getRankColor(rank)
  const rankName      = RANK_NAMES[rank] ?? rank
  const prevRank      = RANK_PROGRESSION[rankIndex - 1]
  const nextRank      = RANK_PROGRESSION[rankIndex + 1]
  const nextRankLv    = RANK_LEVEL_THRESHOLDS[rankIndex + 1]
  const currentRankLv = RANK_LEVEL_THRESHOLDS[rankIndex]
  const levelsInRank      = nextRankLv ? nextRankLv - currentRankLv : 5
  const levelsCompleted   = nextRankLv ? Math.min(level - currentRankLv, levelsInRank) : levelsInRank
  const rankPct           = nextRankLv ? Math.round((levelsCompleted / levelsInRank) * 100) : 100
  const totalStats        = Object.values(stats).reduce((acc, v) => acc + v, 0)
  const isAtSRank         = rankIndex >= S_RANK_INDEX

  // XP barra do nível atual
  const xpForCurrentLevel = xpMaxForLevel(level)
  const xpPct = Math.min(Math.round((xp / xpForCurrentLevel) * 100), 100)

  // ── Reset de Rank ──────────────────────────────────────────────────────────

  async function handleRankReset() {
    setResetting(true)
    setResetError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')

      // Chamar a função SQL segura do Supabase (reseta xp=0, level=1, total_resets++)
      const { error } = await supabase.rpc('increment_player_resets', {
        player_id: user.id,
      })
      if (error) throw error

      // Atualizar o bonus de shadow no contexto (+5% por reset)
      const newBonus = shadowBonusPct + 5
      setShadowBonusPct(newBonus)

      setResetSuccess(true)
      setShowResetConfirm(false)
      showAlert('⚡ Rank resetado! Nova sombra disponível no Shadow Army.', 'success')

      // Recarregar página após 2s para refletir novos valores
      setTimeout(() => window.location.href = '/shadow-army', 2000)

    } catch (err: any) {
      setResetError(err.message ?? 'Erro desconhecido. Tente novamente.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">

      {/* Header */}
      <header className="mb-10 border-b border-cyan-900/30 pb-6">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Rank & Progressão</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
          Sistema de <span className="text-cyan-500">Classificação</span>
        </h1>
      </header>

      {/* Reset success banner */}
      {resetSuccess && (
        <div className="mb-6 p-4 border border-purple-500/40 bg-purple-950/20 text-[10px] text-purple-400 font-bold uppercase tracking-widest">
          ✅ Rank resetado com sucesso! Redirecionando para Shadow Army...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Coluna Esquerda: Rank atual ──────────────────────────────────── */}
        <div className="space-y-6">

          {/* Card do rank atual */}
          <div
            className="p-6 border text-center relative overflow-hidden"
            style={{ borderColor: `${rankColor}40`, background: `${rankColor}06` }}
          >
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
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">XP</p>
                <p className="text-xl font-black text-cyan-400">{xp.toLocaleString()}</p>
              </div>
            </div>

            {/* Barra de XP do nível atual — CORRIGIDA */}
            <div className="mt-4">
              <div className="flex justify-between text-[8px] mb-1">
                <span className="text-slate-600">XP do nível</span>
                <span className="text-cyan-600">{xp.toLocaleString()} / {xpForCurrentLevel.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-slate-900 overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${xpPct}%`,
                    background: rankColor,
                    boxShadow: `0 0 6px ${rankColor}`,
                  }}
                />
              </div>
              <p className="text-[7px] text-slate-700 mt-0.5 text-right">{xpPct}% para Nv.{level + 1}</p>
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
              <p className="text-lg font-black" style={{ color: prevRank ? getRankColor(prevRank) : '#333' }}>
                {prevRank ?? '—'}
              </p>
            </div>
            <div
              className="border p-3 text-center"
              style={{
                borderColor: nextRank ? `${getRankColor(nextRank)}40` : '#1f2937',
                background:  nextRank ? `${getRankColor(nextRank)}06` : 'transparent',
              }}
            >
              <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Próximo</p>
              <p className="text-lg font-black" style={{ color: nextRank ? getRankColor(nextRank) : '#333' }}>
                {nextRank ?? 'MAX'}
              </p>
            </div>
          </div>

          {/* ── Shadow Army Reset — só aparece em Rank S+ ─────────────────── */}
          {isAtSRank && (
            <div className="border border-purple-900/40 bg-purple-950/10 p-5">
              <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <RotateCcw size={12} /> Protocolo de Extração
              </p>
              <p className="text-[9px] text-slate-500 leading-relaxed mb-4">
                Resete seu rank para extrair uma{' '}
                <span className="text-purple-400 font-bold">Sombra</span> no Shadow Army.
                Cada reset concede <span className="text-yellow-400 font-bold">+5% XP permanente</span>.
              </p>
              <div className="mb-4 text-[9px] text-slate-600">
                <p>Bônus atual: <span className="text-yellow-400 font-bold">+{shadowBonusPct}%</span></p>
              </div>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2.5 border border-purple-500/50 text-purple-400 font-black text-[9px] uppercase tracking-widest hover:bg-purple-500/10 transition-all"
                >
                  Resetar Rank → Extrair Sombra
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 border border-red-900/40 bg-red-950/10">
                    <p className="text-[9px] text-red-400 font-bold mb-1">⚠ AÇÃO IRREVERSÍVEL</p>
                    <p className="text-[8px] text-slate-600">
                      Seu XP e Level serão resetados para 0 / Nv.1.
                      Stats, gold e inventário são mantidos.
                      Uma nova sombra (+5% XP) será liberada.
                    </p>
                  </div>
                  {resetError && (
                    <p className="text-[9px] text-red-400">❌ {resetError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleRankReset}
                      disabled={resetting}
                      className="flex-1 py-2.5 bg-purple-700 text-white font-black text-[9px] uppercase hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
                    >
                      {resetting
                        ? <><Loader2 size={11} className="animate-spin" /> Resetando...</>
                        : '⚡ Confirmar Reset'
                      }
                    </button>
                    <button
                      onClick={() => { setShowResetConfirm(false); setResetError('') }}
                      disabled={resetting}
                      className="flex-1 py-2.5 border border-slate-700 text-slate-400 font-black text-[9px] uppercase hover:border-slate-500 disabled:opacity-30 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bloqueado — abaixo de S */}
          {!isAtSRank && (
            <div className="border border-slate-900 bg-slate-950/40 p-5">
              <p className="text-[8px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Lock size={10} /> Reset de Rank
              </p>
              <p className="text-[9px] text-slate-700 mt-2">
                Disponível ao alcançar Rank S (Nv.130).
              </p>
              <div className="mt-3 h-1 bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-purple-800 transition-all"
                  style={{ width: `${Math.min((rankIndex / S_RANK_INDEX) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[7px] text-slate-800 mt-1">{rankIndex}/{S_RANK_INDEX} ranks</p>
            </div>
          )}
        </div>

        {/* ── Coluna Central/Direita ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Trilha completa de progressão */}
          <div className="bg-slate-950 border border-slate-900 p-6">
            <h2 className="text-[10px] font-black uppercase mb-5 text-slate-400 tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan-500" />
              Trilha de Progressão — F até SS+
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {RANK_PROGRESSION.map((r, idx) => {
                const rColor   = getRankColor(r)
                const isActive = r === rank
                const isPast   = idx < rankIndex
                const isLocked = idx > rankIndex

                return (
                  <div
                    key={r}
                    className="p-2 border text-center transition-all relative"
                    style={
                      isActive
                        ? {
                            borderColor: rColor,
                            borderWidth: 2,
                            background:  `${rColor}12`,
                            boxShadow:   `0 0 15px ${rColor}40`,
                          }
                        : {
                            borderColor: `${rColor}30`,
                            background:  isPast ? `${rColor}06` : 'transparent',
                            opacity:     isLocked ? 0.25 : isPast ? 0.65 : 1,
                          }
                    }
                  >
                    {isActive && (
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
                        style={{ background: rColor, borderColor: rColor, boxShadow: `0 0 8px ${rColor}` }}
                      />
                    )}
                    <p className="font-black text-sm leading-none mb-1" style={{ color: rColor }}>
                      {r}
                    </p>
                    <p className="text-[6px] text-slate-700 uppercase leading-none">
                      Nv.{RANK_LEVEL_THRESHOLDS[idx]}
                    </p>
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
                <Dumbbell size={14} className="text-cyan-500" /> Atributos do Caçador
              </h2>
              <div className="text-right">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-cyan-400">{totalStats}</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(stats).map(([stat, value]) => (
                <StatBar
                  key={stat}
                  stat={stat}
                  value={value}
                  max={Math.max(50, value + 10)}
                />
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