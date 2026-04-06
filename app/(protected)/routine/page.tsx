'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { PlusCircle, Sparkles, Brain, Info, Loader2 } from 'lucide-react'

// ─── BUG CRÍTICO CORRIGIDO ────────────────────────────────────────────────────
// O arquivo original tinha:
//   const USER_ID = '00000000-0000-0000-0000-000000000000'
//
// Isso significa que TODAS as rotinas de TODOS os usuários eram gravadas
// e lidas com o mesmo UUID zero — todos viam as rotinas uns dos outros.
// É também um vetor de segurança crítico (bypass de autenticação total).
//
// SOLUÇÃO: userId obtido via supabase.auth.getUser() na inicialização.
// Também corrigido: loading state de userId para evitar operações antes de ter auth.
// ─────────────────────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('Fácil')
  const [freeCreations, setFreeCreations] = useState(4)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Obtém o userId real do usuário autenticado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      setAuthLoading(false)
    })
  }, [])

  async function createMission() {
    if (!title.trim() || !userId) return
    setLoading(true)

    const costXp   = freeCreations > 0 ? 0 : 20
    const costGold = freeCreations > 0 ? 0 : 10
    const rewards = { 'Fácil': [10, 10], 'Médio': [30, 20], 'Difícil': [50, 30] }
    const [xpRec, goldRec] = rewards[difficulty as keyof typeof rewards]

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_xp, gold')
      .eq('id', userId)
      .single()

    if (profile && (profile.current_xp < costXp || profile.gold < costGold)) {
      toast.error('SISTEMA: RECURSOS INSUFICIENTES', {
        description: `Faltam recursos. Custo: ${costXp}XP / ${costGold}G`,
      })
      setLoading(false)
      return
    }

    const { error } = await supabase.from('custom_routine').insert({
      user_id:     userId,
      title,
      difficulty,
      xp_reward:   xpRec,
      gold_reward: goldRec,
    })

    if (!error) {
      await supabase
        .from('profiles')
        .update({
          current_xp: (profile?.current_xp || 0) - costXp,
          gold:       (profile?.gold || 0) - costGold,
        })
        .eq('id', userId)

      if (freeCreations > 0) setFreeCreations((prev) => prev - 1)

      toast.success('DESTINO ARQUITETADO', {
        description: `A missão "${title}" foi integrada ao seu fluxo.`,
        icon: <Brain className="text-purple-400" />,
      })
      setTitle('')
    } else {
      toast.error('Erro ao criar rotina', { description: error.message })
    }

    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-purple-900 animate-pulse uppercase tracking-widest">
        Autenticando...
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-500 uppercase tracking-widest">
        Sessão expirada — faça login novamente.
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-purple-400 p-6 font-mono pb-32">
      <div className="max-w-md mx-auto">
        <header className="mb-8 border-b-2 border-purple-900 pb-4">
          <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Criação de Rotina</h1>
          <p className="text-[10px] text-purple-800 mt-1 uppercase tracking-[0.3em] font-bold">Forge suas próprias regras</p>
        </header>

        <div className="bg-slate-950 border-2 border-purple-900/40 p-6 space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(88,28,135,0.15)]">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={40} /></div>

          <div>
            <label className="text-[10px] uppercase font-black text-purple-600 block mb-2 tracking-widest">Definição da Tarefa</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-purple-900/50 p-4 text-white text-sm focus:border-purple-400 outline-none"
              placeholder="Digite o objetivo..."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-purple-600 block mb-2 tracking-widest">Dificuldade</label>
            <div className="flex gap-2">
              {['Fácil', 'Médio', 'Difícil'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-3 text-[10px] font-black border transition-all ${
                    difficulty === d
                      ? 'bg-purple-600 text-black border-purple-400'
                      : 'border-purple-900 text-purple-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createMission}
            disabled={loading || !title.trim()}
            className="w-full py-5 bg-purple-950/20 border-2 border-purple-500 text-purple-400 font-black uppercase text-xs hover:bg-purple-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> SINCRONIZANDO...</>
              : <><PlusCircle size={16} /> REGISTRAR NO SISTEMA</>
            }
          </button>

          <div className="flex items-center gap-2 justify-center bg-purple-950/10 p-3 border border-purple-900/30">
            <Info size={12} className="text-purple-600" />
            <p className="text-[9px] text-purple-700 italic font-bold uppercase text-center leading-tight">
              {freeCreations > 0
                ? `VOCÊ POSSUI ${freeCreations} CRIAÇÕES GRATUITAS`
                : 'CUSTO: 20 XP / 10 GOLD'
              }
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}