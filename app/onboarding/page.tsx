'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase' // ML-01: singleton
import { Loader2 } from 'lucide-react'

// ─── Classes ──────────────────────────────────────────────────────────────────

const CLASSES = [
  {
    id: 'executor',
    name: 'Executor',
    icon: '⚔️',
    tagline: 'Força bruta e disciplina de ferro.',
    perks: ['Bônus de XP em treinos físicos', '+10% ganho de Força', 'Stamina inicial +2'],
    color: '#ef4444',
  },
  {
    id: 'arquiteto',
    name: 'Arquiteto',
    icon: '🏗️',
    tagline: 'Visão estratégica. Construção constante.',
    perks: ['Bônus de XP em produtividade', '+10% ganho de Inteligência', 'Gold inicial +300'],
    color: '#3b82f6',
  },
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    icon: '🗡️',
    tagline: 'Velocidade. Precisão. Oportunidade.',
    perks: ['Bônus de XP em tarefas rápidas', '+10% ganho de Agilidade', 'Quests diárias +1'],
    color: '#8b5cf6',
  },
  {
    id: 'alquimista',
    name: 'Alquimista',
    icon: '⚗️',
    tagline: 'Transformação é poder.',
    perks: ['Bônus de XP em estudos', '+10% ganho de Percepção', 'Itens na loja -15%'],
    color: '#10b981',
  },
  {
    id: 'sentinela',
    name: 'Sentinela',
    icon: '🛡️',
    tagline: 'Resistência inabalável.',
    perks: ['Bônus de XP em hábitos de saúde', '+10% ganho de Vitalidade', 'Regen stamina 2x mais rápida'],
    color: '#f59e0b',
  },
  {
    id: 'oraculo',
    name: 'Oráculo',
    icon: '👁️',
    tagline: 'Clareza mental. Intuição aguçada.',
    perks: ['Bônus de XP em meditação', '+10% ganho de Mentalidade', 'Rank Challenge recarregamento -20%'],
    color: '#06b6d4',
  },
  {
    id: 'ferreiro',
    name: 'Ferreiro',
    icon: '🔨',
    tagline: 'Cria. Forja. Entrega.',
    perks: ['Bônus de XP em organização', '+10% ganho de Controle Corporal', 'Dungeons +1 uso diário'],
    color: '#f97316',
  },
  {
    id: 'monarca',
    name: 'Monarca',
    icon: '👑',
    tagline: 'Nasce para liderar.',
    perks: ['Bônus de XP em liderança', 'Todos os atributos +5%', 'Gold inicial +500'],
    color: '#eab308',
  },
  {
    id: 'vagabundo',
    name: 'Vagabundo',
    icon: '🎲',
    tagline: 'Sem regras. Sem limites.',
    perks: ['Bônus aleatório a cada level up', 'Stats aleatórias +15%', 'Rotina de XP variável'],
    color: '#ec4899',
  },
] as const

type ClassId = typeof CLASSES[number]['id']

type Step = 'name' | 'class' | 'confirm'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step,      setStep]      = useState<Step>('name')
  const [name,      setName]      = useState('')
  const [selected,  setSelected]  = useState<ClassId | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // SEC: anti-double-submit
  const submitLockRef = useRef(false)

  // Prevenir que usuário com classe já definida refaça o onboarding
  useEffect(() => {
    let cancelled = false
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: player } = await supabase
        .from('players')
        .select('class')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      if (player?.class) router.replace('/Dashboard')
    }
    checkExisting()
    return () => { cancelled = true }
  }, [router])

  async function handleConfirm() {
    if (loading || submitLockRef.current) return
    if (!name.trim() || !selected) return

    // SEC: lock para prevenir double click
    submitLockRef.current = true
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada — faça login novamente.')

      // Verificar se player já existe (previne duplicate entry)
      const { data: existing } = await supabase
        .from('players')
        .select('id, class')
        .eq('id', user.id)
        .maybeSingle()

      if (existing?.class) {
        // Já tem classe — ir direto
        router.replace('/Dashboard')
        return
      }

      const playerData = {
        id:           user.id,
        name:         name.trim(),
        class:        selected,
        xp:           0,
        level:        1,
        gold:         selected === 'monarca' ? 1500 : selected === 'arquiteto' ? 1300 : 1000,
        stamina:      selected === 'sentinela' ? 22 : 20,
        stats: {
          strength:     0, agility:      0, reflex:    0,
          vitality:     0, intelligence: 0, perception:0,
          mentality:    0, faith:        0, bodyControl:0,
        },
        inventory:      [],
        routines:       [],
        counters: {
          water: 0, pushups: 0, reading: 0, missions: 0, squats: 0,
          plank: 0, focus: 0, meditation: 0, bed: 0, dishes: 0,
          stretch: 0, organize: 0,
        },
        monthly_logs:   {},
        active_boosts:  {},
        total_resets:   0,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from('players')
        .upsert(playerData, { onConflict: 'id', ignoreDuplicates: false })

      if (upsertError) throw upsertError

      // Setar cookie de classe para o middleware (HTTPONLY é setado server-side no middleware)
      // Apenas navegamos — middleware vai pegar a classe do banco e setar o cookie
      router.replace('/Dashboard')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
      setLoading(false)
      submitLockRef.current = false
    }
  }

  const selectedClass = CLASSES.find(c => c.id === selected)

  return (
    <div className="min-h-screen bg-black font-mono text-white pb-24">

      {/* Header */}
      <div className="border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.5em]">// PROTOCOLO DE INICIALIZAÇÃO</p>
        <div className="flex gap-2">
          {(['name', 'class', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className="w-2 h-2 rounded-full"
              style={{
                background: step === s ? '#00ffff'
                  : (step === 'class' && s === 'name') || step === 'confirm' ? '#00ffff40'
                  : '#1e293b',
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">

        {/* STEP 1 — NOME */}
        {step === 'name' && (
          <div style={{ animation: 'slideIn 0.35s both' }}>
            <p className="text-[9px] text-cyan-600 uppercase tracking-[0.5em] mb-2">01 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Identificação do <span className="text-cyan-400">Caçador</span>
            </h1>
            <p className="text-[11px] text-slate-500 mb-8">
              Este nome será exibido no sistema. Escolha com cuidado.
            </p>

            <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">
              // NOME DE COMBATE
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && setStep('class')}
              placeholder="Sung Jin-Woo..."
              maxLength={24}
              autoFocus
              className="w-full bg-black border border-slate-800 px-4 py-3 text-base text-cyan-300 outline-none focus:border-cyan-500 mb-2 transition-all"
            />
            <p className="text-[8px] text-slate-700 mb-8">
              {name.length}/24 caracteres
            </p>

            <button
              onClick={() => name.trim().length >= 2 && setStep('class')}
              disabled={name.trim().length < 2}
              className="px-8 py-3 border border-cyan-500/50 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próximo →
            </button>
          </div>
        )}

        {/* STEP 2 — CLASSE */}
        {step === 'class' && (
          <div style={{ animation: 'slideIn 0.35s both' }}>
            <p className="text-[9px] text-cyan-600 uppercase tracking-[0.5em] mb-2">02 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Escolha sua <span className="text-cyan-400">Classe</span>
            </h1>
            <p className="text-[11px] text-slate-500 mb-8">
              Sua classe define seus bônus iniciais. Pode ser alterada futuramente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {CLASSES.map(c => {
                const isSelected = selected === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className="text-left p-4 border transition-all"
                    style={{
                      borderColor:  isSelected ? c.color : '#1e293b',
                      background:   isSelected ? `${c.color}10` : 'transparent',
                      boxShadow:    isSelected ? `0 0 14px ${c.color}30` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{c.icon}</span>
                      <span
                        className="font-black text-sm uppercase tracking-wider"
                        style={{ color: isSelected ? c.color : '#cbd5e1' }}
                      >
                        {c.name}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 mb-3 italic">{c.tagline}</p>
                    <div className="space-y-1">
                      {c.perks.map((perk, i) => (
                        <p key={i} className="text-[8px] text-slate-600 flex items-start gap-1">
                          <span style={{ color: c.color }}>›</span> {perk}
                        </p>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('name')}
                className="px-6 py-3 border border-slate-800 text-slate-500 font-black uppercase tracking-widest hover:border-slate-600 transition-all text-[10px]"
              >
                ← Voltar
              </button>
              <button
                onClick={() => selected && setStep('confirm')}
                disabled={!selected}
                className="px-8 py-3 border border-cyan-500/50 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — CONFIRMAR */}
        {step === 'confirm' && selectedClass && (
          <div style={{ animation: 'slideIn 0.35s both' }}>
            <p className="text-[9px] text-cyan-600 uppercase tracking-[0.5em] mb-2">03 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Confirmar <span className="text-cyan-400">Identidade</span>
            </h1>
            <p className="text-[11px] text-slate-500 mb-8">
              Revise seus dados antes de entrar no sistema.
            </p>

            <div
              className="border p-6 mb-8"
              style={{
                borderColor: `${selectedClass.color}40`,
                background:  `${selectedClass.color}08`,
                boxShadow:   `0 0 30px ${selectedClass.color}15`,
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{selectedClass.icon}</span>
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Caçador</p>
                  <p className="text-xl font-black uppercase text-white">{name}</p>
                  <p className="font-black uppercase tracking-wider text-sm" style={{ color: selectedClass.color }}>
                    {selectedClass.name}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 space-y-2">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">Vantagens iniciais</p>
                {selectedClass.perks.map((perk, i) => (
                  <p key={i} className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span className="text-lg" style={{ color: selectedClass.color }}>✓</span> {perk}
                  </p>
                ))}
              </div>

              <div className="border-t border-slate-900 pt-4 mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Gold</p>
                  <p className="font-black text-yellow-400">
                    {selected === 'monarca' ? '1.500' : selected === 'arquiteto' ? '1.300' : '1.000'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Level</p>
                  <p className="font-black text-cyan-400">1</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Rank</p>
                  <p className="font-black text-white">F</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="border border-red-900/60 bg-red-950/30 px-3 py-2.5 text-[9px] text-red-400 font-bold mb-4">
                ERRO — {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('class')}
                disabled={loading}
                className="px-6 py-3 border border-slate-800 text-slate-500 font-black uppercase tracking-widest hover:border-slate-600 disabled:opacity-30 transition-all text-[10px]"
              >
                ← Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3.5 border font-black uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                style={{
                  borderColor: `${selectedClass.color}60`,
                  color:       selectedClass.color,
                  background:  `${selectedClass.color}12`,
                }}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Inicializando...</>
                  : <>{selectedClass.icon} ENTRAR NO SISTEMA</>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}