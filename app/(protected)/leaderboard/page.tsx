'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Trophy, Crown, Zap, User } from 'lucide-react'
import { RANK_COLORS, RANK_NAMES } from '@/app/lib/RankConfig'

interface LeaderboardPlayer {
  id: string; name: string; rank: string; level: number; xp: number; class: string
  isReal?: boolean
}

// Fictional players to populate the leaderboard
const FICTIONAL_PLAYERS: LeaderboardPlayer[] = [
  { id: 'f1',  name: 'ShadowKing_BR',    rank: 'C+', level: 62, xp: 145820, class: 'monarca' },
  { id: 'f2',  name: 'IronWill2077',     rank: 'C',  level: 55, xp: 121300, class: 'executor' },
  { id: 'f3',  name: 'AriseProtocol',    rank: 'C-', level: 48, xp: 98750,  class: 'infiltrador' },
  { id: 'f4',  name: 'NightCrawler_X',   rank: 'D+', level: 39, xp: 78400,  class: 'arquiteto' },
  { id: 'f5',  name: 'VoidWalker99',     rank: 'D+', level: 36, xp: 71200,  class: 'sentinela' },
  { id: 'f6',  name: 'PhantomElite',     rank: 'D',  level: 31, xp: 58900,  class: 'oraculo' },
  { id: 'f7',  name: 'SilentBlade_BR',   rank: 'D',  level: 28, xp: 51400,  class: 'infiltrador' },
  { id: 'f8',  name: 'GrindMaster2024',  rank: 'D-', level: 24, xp: 42100,  class: 'ferreiro' },
  { id: 'f9',  name: 'QuantumRunner',    rank: 'D-', level: 22, xp: 38500,  class: 'alquimista' },
  { id: 'f10', name: 'DarkProtocol',     rank: 'E+', level: 18, xp: 31200,  class: 'executor' },
  { id: 'f11', name: 'SteelMind_RJ',     rank: 'E+', level: 16, xp: 27800,  class: 'arquiteto' },
  { id: 'f12', name: 'FlowState_777',    rank: 'E',  level: 13, xp: 21400,  class: 'vagabundo' },
  { id: 'f13', name: 'AscendingPath',    rank: 'E',  level: 11, xp: 17600,  class: 'sentinela' },
  { id: 'f14', name: 'NovaSpark_SP',     rank: 'E-', level: 8,  xp: 12300,  class: 'monarca' },
  { id: 'f15', name: 'BeginnerHero_MG',  rank: 'F',  level: 3,  xp: 4800,   class: 'vagabundo' },
]

export default function LeaderboardPage() {
  const [mounted,  setMounted]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [players,  setPlayers]  = useState<LeaderboardPlayer[]>([])
  const [userId,   setUserId]   = useState('')
  const [myPlayer, setMyPlayer] = useState<LeaderboardPlayer | null>(null)

  useEffect(() => {
    setMounted(true)
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          const { data: player } = await supabase
            .from('players')
            .select('id, name, rank, level, xp, class')
            .eq('id', session.user.id)
            .single()
          if (player) {
            setMyPlayer({ ...player, isReal: true })
          }
        }
      } catch (e) { /* ignore */ }

      // Load real players from Supabase
      try {
        const { data: realPlayers } = await supabase
          .from('players')
          .select('id, name, rank, level, xp, class')
          .order('xp', { ascending: false })
          .limit(50)

        const realWithFlag = (realPlayers || []).map((p: any) => ({ ...p, isReal: true }))
        
        // Merge real players with fictional, remove duplicates, sort by XP
        const combined = [...realWithFlag, ...FICTIONAL_PLAYERS]
        const unique = combined.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx)
        unique.sort((a, b) => b.xp - a.xp)
        setPlayers(unique)
      } catch {
        setPlayers([...FICTIONAL_PLAYERS].sort((a, b) => b.xp - a.xp))
      }

      setLoading(false)
    }
    load()
  }, [])

  if (!mounted || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <p className="text-cyan-900 text-[10px] uppercase tracking-widest animate-pulse">Carregando Ranking...</p>
    </div>
  )

  // Find my position
  const myPosition = myPlayer ? players.findIndex(p => p.id === userId) + 1 : null

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-32">
      <header className="mb-8 pb-5 border-b border-cyan-900/30">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Ranking Global</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight flex items-center gap-3">
          <Trophy size={26} className="text-yellow-500" />
          Ranking dos <span className="text-cyan-500">Caçadores</span>
        </h1>
        {myPosition && (
          <p className="text-[10px] text-cyan-500/60 mt-1">
            Sua posição: <span className="text-cyan-400 font-black">#{myPosition}</span>
          </p>
        )}
      </header>

      {/* Podium top 3 */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
        {[players[1], players[0], players[2]].map((p, visualIdx) => {
          if (!p) return <div key={visualIdx} />
          const realIdx = [1, 0, 2][visualIdx]
          const color = RANK_COLORS[p.rank] ?? '#888'
          const podiumColors = ['#9ca3af', '#fbbf24', '#d97706']
          const podiumSize = ['w-16 h-16', 'w-20 h-20', 'w-16 h-16']
          return (
            <div key={p.id} className={`flex flex-col items-center ${realIdx === 0 ? 'mt-0' : 'mt-6'}`}>
              <div
                className={`${podiumSize[visualIdx]} rounded-full flex items-center justify-center text-[8px] font-black border-2 mb-2`}
                style={{ background: `${color}18`, borderColor: color, color }}>
                <User size={realIdx === 0 ? 24 : 20} />
              </div>
              <div className="text-center">
                <div className="text-[9px] font-black" style={{ color: podiumColors[visualIdx] }}>#{realIdx + 1}</div>
                <p className="text-[8px] font-black text-white truncate max-w-[60px]">{p.name}</p>
                <p className="text-[7px] text-slate-600">{p.rank}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {players.map((p, idx) => {
          const color = RANK_COLORS[p.rank] ?? '#888'
          const isMe = p.id === userId
          const isTop3 = idx < 3

          return (
            <div key={p.id}
              className={`flex items-center gap-3 p-3 border transition-all ${
                isMe
                  ? 'border-cyan-500/40 bg-cyan-950/10'
                  : isTop3
                    ? 'border-yellow-900/40 bg-yellow-950/05'
                    : 'border-slate-900 hover:border-slate-700'
              }`}>
              {/* Position */}
              <div className="w-8 text-center flex-shrink-0">
                {idx === 0 ? <Crown size={16} className="text-yellow-400 mx-auto" />
                : idx === 1 ? <span className="text-[11px] font-black text-slate-400">#2</span>
                : idx === 2 ? <span className="text-[11px] font-black text-yellow-700">#3</span>
                : <span className="text-[10px] font-black text-slate-600">#{idx + 1}</span>}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}60`, color }}>
                {p.rank}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-black text-white truncate">{p.name}</p>
                  {isMe && <span className="text-[7px] text-cyan-600 font-bold border border-cyan-900 px-1">você</span>}
                  {!p.isReal && <span className="text-[6px] text-slate-700 border border-slate-900 px-1">bot</span>}
                </div>
                <p className="text-[7px] text-slate-600 uppercase">{RANK_NAMES[p.rank] ?? p.rank} · Nv.{p.level}</p>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] font-black tabular-nums" style={{ color }}>{p.xp.toLocaleString()}</p>
                <p className="text-[7px] text-slate-700">XP</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}