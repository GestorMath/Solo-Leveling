'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { Loader2, Check } from 'lucide-react'

// ─── Classes ──────────────────────────────────────────────────────────────────

const CLASSES = [
  {
    id: 'executor',
    name: 'Executor',
    icon: '⚔️',
    tagline: 'Força bruta e disciplina de ferro.',
    perks: ['Bônus de XP em treinos físicos', '+10% ganho de Força', 'Stamina inicial +2'],
    color: '#ff4466',
  },
  {
    id: 'arquiteto',
    name: 'Arquiteto',
    icon: '🏗️',
    tagline: 'Visão estratégica. Construção constante.',
    perks: ['Bônus de XP em produtividade', '+10% ganho de Inteligência', 'Gold inicial +300'],
    color: '#4488ff',
  },
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    icon: '🗡️',
    tagline: 'Velocidade. Precisão. Oportunidade.',
    perks: ['Bônus de XP em tarefas rápidas', '+10% ganho de Agilidade', 'Quests diárias +1'],
    color: '#00ffff',
  },
  {
    id: 'alquimista',
    name: 'Alquimista',
    icon: '⚗️',
    tagline: 'Transformação é poder.',
    perks: ['Bônus de XP em estudos', '+10% ganho de Percepção', 'Itens na loja -15%'],
    color: '#44ff88',
  },
  {
    id: 'sentinela',
    name: 'Sentinela',
    icon: '🛡️',
    tagline: 'Resistência inabalável.',
    perks: ['Bônus de XP em hábitos de saúde', '+10% ganho de Vitalidade', 'Regen stamina 2x mais rápida'],
    color: '#ffaa44',
  },
  {
    id: 'oraculo',
    name: 'Oráculo',
    icon: '👁️',
    tagline: 'Clareza mental. Intuição aguçada.',
    perks: ['Bônus de XP em meditação', '+10% ganho de Mentalidade', 'Rank Challenge recarregamento -20%'],
    color: '#cc88ff',
  },
  {
    id: 'ferreiro',
    name: 'Ferreiro',
    icon: '🔨',
    tagline: 'Cria. Forja. Entrega.',
    perks: ['Bônus de XP em organização', '+10% ganho de Controle Corporal', 'Dungeons +1 uso diário'],
    color: '#ff8844',
  },
  {
    id: 'monarca',
    name: 'Monarca',
    icon: '👑',
    tagline: 'Nasce para liderar.',
    perks: ['Bônus de XP em liderança', 'Todos os atributos +5%', 'Gold inicial +500'],
    color: '#ffdd00',
  },
  {
    id: 'vagabundo',
    name: 'Vagabundo',
    icon: '🎲',
    tagline: 'Sem regras. Sem limites.',
    perks: ['Bônus aleatório a cada level up', 'Stats aleatórias +15%', 'Rotina de XP variável'],
    color: '#ff66cc',
  },
] as const

type ClassId = typeof CLASSES[number]['id']
type Step = 'name' | 'class' | 'confirm'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step,     setStep]     = useState<Step>('name')
  const [name,     setName]     = useState('')
  const [selected, setSelected] = useState<ClassId | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [animKey,  setAnimKey]  = useState(0)

  // Anti double-submit
  const submitLockRef = useRef(false)

  // Verificar se usuário já tem classe (evita refazer onboarding)
  useEffect(() => {
    let cancelled = false
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: player } = await supabase
        .from('players').select('class').eq('id', user.id).maybeSingle()
      if (cancelled) return
      if (player?.class) router.replace('/Dashboard')
    }
    checkExisting()
    return () => { cancelled = true }
  }, [router])

  function goTo(next: Step) {
    setAnimKey(k => k + 1)
    setStep(next)
    setError('')
  }

  // ── Confirmar criação do personagem ──────────────────────────────────────

  async function handleConfirm() {
    if (loading || submitLockRef.current) return
    if (!name.trim() || !selected) return

    submitLockRef.current = true
    setLoading(true)
    setError('')

    try {
      // 1. Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Sessão expirada. Faça login novamente.')

      // 2. Verificar se player já existe
      const { data: existing } = await supabase
        .from('players').select('id, class').eq('id', user.id).maybeSingle()

      if (existing?.class) {
        router.replace('/Dashboard')
        return
      }

      // 3. Montar dados do player
      const gold = selected === 'monarca' ? 1500 : selected === 'arquiteto' ? 1300 : 1000
      const stamina = selected === 'sentinela' ? 22 : 20

      const playerData = {
        id:           user.id,
        name:         name.trim(),
        class:        selected,
        xp:           0,
        level:        1,
        gold,
        stamina,
        stats: {
          strength: 0, agility: 0, reflex: 0, vitality: 0,
          intelligence: 0, perception: 0, mentality: 0, faith: 0, bodyControl: 0,
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
        // total_resets: omitido aqui — tem DEFAULT 0 no banco
        // Se a coluna não existir ainda no banco, omitir evita o erro
        updated_at:     new Date().toISOString(),
        created_at:     new Date().toISOString(),
      }

      // 4. Upsert — ignora conflito de id se já existir sem classe
      const { error: upsertError } = await supabase
        .from('players')
        .upsert(playerData, { onConflict: 'id' })

      if (upsertError) {
        // Fallback: tentar INSERT simples se upsert falhar
        const { error: insertError } = await supabase
          .from('players')
          .insert(playerData)

        if (insertError) {
          // Último fallback: update se o registro já existe
          const { error: updateError } = await supabase
            .from('players')
            .update({
              name:     playerData.name,
              class:    playerData.class,
              gold:     playerData.gold,
              stamina:  playerData.stamina,
              updated_at: playerData.updated_at,
            })
            .eq('id', user.id)

          if (updateError) throw updateError
        }
      }

      // 5. Limpar cookie de classe para o middleware re-validar
      document.cookie = 'player_class=; Max-Age=0; path=/'

      // 6. Navegar para o dashboard
      router.replace('/Dashboard')

    } catch (err: unknown) {
      console.error('[Onboarding] Error:', err)
      const msg = err instanceof Error ? err.message : 'Erro desconhecido. Tente novamente.'
      setError(msg)
      setLoading(false)
      submitLockRef.current = false
    }
  }

  const selectedClass = CLASSES.find(c => c.id === selected)

  return (
    <div className="min-h-screen bg-black font-mono text-white pb-24">

      {/* Header com steps */}
      <div className="border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-sm z-10">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.5em]">
          // PROTOCOLO DE INICIALIZAÇÃO
        </p>
        <div className="flex gap-2 items-center">
          {(['name', 'class', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    step === s ? '#00ffff'
                    : (i === 0 && (step === 'class' || step === 'confirm')) || (i === 1 && step === 'confirm')
                      ? 'rgba(0,255,255,0.4)'
                      : '#1e293b',
                  boxShadow: step === s ? '0 0 8px #00ffff' : 'none',
                }}
              />
              {i < 2 && <div className="w-6 h-px bg-slate-800" />}
            </div>
          ))}
        </div>
      </div>

      <div
        key={animKey}
        className="max-w-3xl mx-auto px-4 pt-10"
        style={{ animation: 'slideIn 0.3s ease-out both' }}
      >

        {/* ── STEP 1 — NOME ───────────────────────────────────────────────── */}
        {step === 'name' && (
          <div>
            <p className="text-[9px] text-cyan-500 uppercase tracking-[0.5em] mb-2">01 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Identificação do <span className="text-cyan-400" style={{ textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>Caçador</span>
            </h1>
            <p className="text-[11px] text-slate-400 mb-8">
              Este nome será exibido no sistema e no ranking global.
            </p>

            <label className="text-[8px] text-cyan-600 uppercase tracking-widest font-bold mb-2 block">
              // NOME DE COMBATE
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && goTo('class')}
              placeholder="Ex: SungJinWoo..."
              maxLength={24}
              autoFocus
              className="w-full bg-black border border-slate-700 px-4 py-3 text-base text-cyan-300 outline-none focus:border-cyan-500 mb-2 transition-all font-mono"
              style={{ boxShadow: name.length >= 2 ? '0 0 0 1px rgba(0,255,255,0.2)' : 'none' }}
            />
            <p className="text-[8px] text-slate-700 mb-8">{name.length}/24 caracteres</p>

            <button
              onClick={() => name.trim().length >= 2 && goTo('class')}
              disabled={name.trim().length < 2}
              className="px-8 py-3 border font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: name.trim().length >= 2 ? '#00ffff80' : '#334155',
                color: name.trim().length >= 2 ? '#00ffff' : '#475569',
                background: name.trim().length >= 2 ? 'rgba(0,255,255,0.08)' : 'transparent',
                boxShadow: name.trim().length >= 2 ? '0 0 16px rgba(0,255,255,0.15)' : 'none',
              }}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* ── STEP 2 — CLASSE ─────────────────────────────────────────────── */}
        {step === 'class' && (
          <div>
            <p className="text-[9px] text-cyan-500 uppercase tracking-[0.5em] mb-2">02 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Escolha sua <span className="text-cyan-400" style={{ textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>Classe</span>
            </h1>
            <p className="text-[11px] text-slate-400 mb-8">
              Sua classe define seus bônus iniciais. Pode ser alterada futuramente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {CLASSES.map(c => {
                const isSelected = selected === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className="text-left p-4 border transition-all duration-200"
                    style={{
                      borderColor:  isSelected ? c.color : 'rgba(51,65,85,0.8)',
                      background:   isSelected ? `${c.color}15` : 'rgba(15,23,42,0.6)',
                      boxShadow:    isSelected ? `0 0 20px ${c.color}30, inset 0 0 20px ${c.color}08` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{c.icon}</span>
                      {/* FIX: nome da classe com cor neon visível */}
                      <span
                        className="font-black text-sm uppercase tracking-wider"
                        style={{
                          color:      c.color,
                          textShadow: isSelected ? `0 0 12px ${c.color}80` : `0 0 6px ${c.color}40`,
                        }}
                      >
                        {c.name}
                      </span>
                    </div>

                    {/* Tagline visível */}
                    <p
                      className="text-[9px] mb-3 italic font-medium"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(148,163,184,0.9)' }}
                    >
                      {c.tagline}
                    </p>

                    {/* Perks com texto neon */}
                    <div className="space-y-1">
                      {c.perks.map((perk, i) => (
                        <p
                          key={i}
                          className="text-[8px] flex items-start gap-1.5"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(148,163,184,0.85)' }}
                        >
                          <span style={{ color: c.color, flexShrink: 0 }}>›</span>
                          {perk}
                        </p>
                      ))}
                    </div>

                    {isSelected && (
                      <div
                        className="mt-3 text-[7px] font-black uppercase tracking-widest text-center py-1"
                        style={{ color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}40` }}
                      >
                        SELECIONADA
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goTo('name')}
                className="px-6 py-3 border border-slate-700 text-slate-400 font-black uppercase tracking-widest hover:border-slate-500 transition-all text-[10px]"
              >
                ← Voltar
              </button>
              <button
                onClick={() => selected && goTo('confirm')}
                disabled={!selected}
                className="px-8 py-3 border font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  borderColor: selected ? '#00ffff80' : '#334155',
                  color: selected ? '#00ffff' : '#475569',
                  background: selected ? 'rgba(0,255,255,0.08)' : 'transparent',
                  boxShadow: selected ? '0 0 16px rgba(0,255,255,0.15)' : 'none',
                }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — CONFIRMAR ──────────────────────────────────────────── */}
        {step === 'confirm' && selectedClass && (
          <div>
            <p className="text-[9px] text-cyan-500 uppercase tracking-[0.5em] mb-2">03 / 03</p>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Confirmar <span className="text-cyan-400" style={{ textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>Identidade</span>
            </h1>
            <p className="text-[11px] text-slate-400 mb-8">
              Revise seus dados antes de entrar no sistema.
            </p>

            <div
              className="border p-6 mb-6"
              style={{
                borderColor: `${selectedClass.color}50`,
                background:  `${selectedClass.color}08`,
                boxShadow:   `0 0 30px ${selectedClass.color}15`,
              }}
            >
              {/* Identidade */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{selectedClass.icon}</span>
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Caçador</p>
                  <p className="text-xl font-black uppercase text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                    {name}
                  </p>
                  <p
                    className="font-black uppercase tracking-wider text-sm mt-0.5"
                    style={{ color: selectedClass.color, textShadow: `0 0 10px ${selectedClass.color}60` }}
                  >
                    {selectedClass.name}
                  </p>
                </div>
              </div>

              {/* Perks */}
              <div className="border-t border-slate-900 pt-4 space-y-2 mb-4">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">
                  Vantagens iniciais
                </p>
                {selectedClass.perks.map((perk, i) => (
                  <p key={i} className="text-[10px] text-slate-300 flex items-center gap-2">
                    <Check size={14} style={{ color: selectedClass.color, flexShrink: 0 }} />
                    {perk}
                  </p>
                ))}
              </div>

              {/* Stats iniciais */}
              <div className="border-t border-slate-900 pt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest">Gold</p>
                  <p className="font-black text-yellow-400">
                    {(selected === 'monarca' ? 1500 : selected === 'arquiteto' ? 1300 : 1000).toLocaleString()}
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

            {/* Erro */}
            {error && (
              <div className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-[9px] text-red-400 font-bold mb-4">
                ERRO — {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => goTo('class')}
                disabled={loading}
                className="px-6 py-3 border border-slate-700 text-slate-400 font-black uppercase tracking-widest hover:border-slate-500 disabled:opacity-30 transition-all text-[10px]"
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
                  boxShadow:   loading ? 'none' : `0 0 20px ${selectedClass.color}20`,
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
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}