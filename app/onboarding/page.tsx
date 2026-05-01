'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, ChevronRight } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ClassId =
  | 'executor' | 'arquiteto' | 'infiltrador'
  | 'alquimista' | 'sentinela' | 'oraculo'
  | 'ferreiro' | 'monarca' | 'vagabundo'

interface Classe {
  id: ClassId
  label: string
  icon: string
  desc: string
  flavor: string
  attrs: {
    strength: number; intelligence: number; agility: number
    vitality: number; mentality: number; reflex: number
  }
  color: string
  border: string
}

const CLASSES: Classe[] = [
  { id: 'executor',    label: 'Executor',    icon: '⚔️', desc: 'Força e disciplina inabaláveis. Faz acontecer antes de pensar duas vezes.',         flavor: '"Cada repetição é uma batalha vencida."',          attrs: { strength: 9,  intelligence: 3,  agility: 5,  vitality: 8,  mentality: 5, reflex: 4 }, color: '#ff4466', border: 'rgba(255,68,102,0.5)'  },
  { id: 'arquiteto',   label: 'Arquiteto',   icon: '🧠', desc: 'Inteligência máxima. Constrói sistemas, rotinas e automações de elite.',             flavor: '"Quem projeta o jogo, nunca perde."',              attrs: { strength: 2,  intelligence: 10, agility: 3,  vitality: 3,  mentality: 9, reflex: 5 }, color: '#9944ff', border: 'rgba(153,68,255,0.5)' },
  { id: 'infiltrador', label: 'Infiltrador', icon: '⚡', desc: 'Velocidade e reflexo no topo. Age sem ruído, executa sem desperdício.',              flavor: '"O slow é o único inimigo real."',                 attrs: { strength: 4,  intelligence: 4,  agility: 10, vitality: 3,  mentality: 3, reflex: 8 }, color: '#00ffff', border: 'rgba(0,255,255,0.5)'  },
  { id: 'alquimista',  label: 'Alquimista',  icon: '🧪', desc: 'Transforma hábitos em resultados. Especialista em otimizar processos humanos.',      flavor: '"Todo hábito tem um preço. Pague com ação."',      attrs: { strength: 3,  intelligence: 8,  agility: 4,  vitality: 5,  mentality: 7, reflex: 5 }, color: '#44ff88', border: 'rgba(68,255,136,0.5)' },
  { id: 'sentinela',   label: 'Sentinela',   icon: '🛡️', desc: 'Resistência extrema. Nunca quebra sob pressão, nunca atrasa.',                      flavor: '"Consistência derrota talento todo dia."',         attrs: { strength: 6,  intelligence: 4,  agility: 3,  vitality: 10, mentality: 8, reflex: 3 }, color: '#4488ff', border: 'rgba(68,136,255,0.5)' },
  { id: 'oraculo',     label: 'Oráculo',     icon: '👁️', desc: 'Percepção elevada. Enxerga padrões, antecipa problemas, toma decisões cirúrgicas.',  flavor: '"Informação é o verdadeiro poder."',               attrs: { strength: 2,  intelligence: 9,  agility: 4,  vitality: 3,  mentality: 6, reflex: 8 }, color: '#ffaa44', border: 'rgba(255,170,68,0.5)' },
  { id: 'ferreiro',    label: 'Ferreiro',    icon: '🔨', desc: 'Constância brutal. Forja resultados com repetição diária sem falhar.',                flavor: '"Ferro afia ferro. Todo dia."',                    attrs: { strength: 8,  intelligence: 4,  agility: 4,  vitality: 8,  mentality: 6, reflex: 2 }, color: '#ff8844', border: 'rgba(255,136,68,0.5)' },
  { id: 'monarca',     label: 'Monarca',     icon: '👑', desc: 'Liderança e carisma no pico. Comanda equipes e fecha negócios de alto impacto.',      flavor: '"Um monarca não pede permissão."',                 attrs: { strength: 5,  intelligence: 8,  agility: 4,  vitality: 5,  mentality: 7, reflex: 3 }, color: '#ffdd00', border: 'rgba(255,221,0,0.5)'  },
  { id: 'vagabundo',   label: 'Vagabundo',   icon: '🌀', desc: 'Atributos balanceados. Não tem ponto fraco — não tem ponto forte. Evolui em tudo.',   flavor: '"O generalista que vira especialista em tudo."',  attrs: { strength: 5,  intelligence: 5,  agility: 5,  vitality: 5,  mentality: 5, reflex: 5 }, color: '#888888', border: 'rgba(136,136,136,0.5)'},
]

const ATTR_LABELS: Record<string, string> = {
  strength: 'Força', intelligence: 'Inteligência', agility: 'Agilidade',
  vitality: 'Vitalidade', mentality: 'Mentalidade', reflex: 'Reflexo',
}

function AttrBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-slate-500 font-bold w-20 shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-[3px] bg-slate-900 overflow-hidden rounded-full">
        <div className="h-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span className="text-[10px] font-black tabular-nums w-4 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

type Step = 'name' | 'class' | 'confirm'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [playerName, setPlayerName] = useState('')
  const [selectedClass, setSelectedClass] = useState<ClassId | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animating, setAnimating] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth')
        return
      }
      setCheckingAuth(false)
    }
    checkSession()
  }, [router])

  function transitionTo(next: Step) {
    setAnimating(true)
    setTimeout(() => { setStep(next); setAnimating(false) }, 280)
  }

  function nextStep() {
    if (step === 'name') {
      const name = playerName.trim()
      if (!name || name.length < 2) { setError('Nome inválido — mínimo 2 caracteres.'); return }
      if (name.length > 20) { setError('Nome muito longo — máximo 20 caracteres.'); return }
      setError('')
      transitionTo('class')
    } else if (step === 'class') {
      if (!selectedClass) { setError('Selecione uma classe para continuar.'); return }
      setError('')
      transitionTo('confirm')
    }
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      // Pega sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.user) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const user = session.user
      const classe = CLASSES.find(c => c.id === selectedClass)!

      const initStats = {
        strength: classe.attrs.strength,
        agility: classe.attrs.agility,
        intelligence: classe.attrs.intelligence,
        vitality: classe.attrs.vitality,
        mentality: classe.attrs.mentality,
        reflex: classe.attrs.reflex,
        perception: 3,
        faith: 3,
        bodyControl: 3,
      }

      const playerData = {
        id: user.id,
        name: playerName.trim(),
        class: selectedClass,
        level: 1,
        xp: 0,
        gold: 1000,
        stamina: 20,
        rank: 'F',
        stats: initStats,
        inventory: [],
        routines: [],
        counters: {},
        monthly_logs: {},
        active_boosts: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Usa upsert com onConflict para lidar com registros existentes
      const { error: dbErr } = await supabase
        .from('players')
        .upsert(playerData, { onConflict: 'id' })

      if (dbErr) {
        console.error('DB Error:', dbErr)
        throw new Error(`Erro no banco: ${dbErr.message}`)
      }

      // Limpa o cookie player_class para forçar middleware a reler
      document.cookie = 'player_class=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

      setRegistered(true)
      setTimeout(() => router.replace('/Dashboard'), 2200)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setError(msg)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono">
        <p className="text-cyan-900 text-[10px] uppercase tracking-widest animate-pulse">Verificando sessão...</p>
      </div>
    )
  }

  const classe = CLASSES.find(c => c.id === selectedClass)

  if (registered) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono gap-6 p-4">
        <p className="text-[10px] text-slate-500 tracking-widest uppercase">// Registro concluído</p>
        <p
          className="text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] text-center"
          style={{ color: 'transparent', WebkitTextStroke: '1px rgba(0,255,255,0.9)', textShadow: '0 0 40px rgba(0,255,255,0.5)' }}
        >
          PLAYER REGISTRADO NO SISTEMA
        </p>
        <p className="text-[9px] text-cyan-500/50 tracking-widest">Inicializando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-mono">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,255,1) 1px,transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Indicador de steps */}
      <div className="flex justify-center pt-6 pb-2 gap-3 z-10">
        {(['name', 'class', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.8)]'
                  : (['name', 'class', 'confirm'] as Step[]).indexOf(step) > i
                    ? 'bg-cyan-800'
                    : 'bg-slate-800'
              }`}
            />
            {i < 2 && <div className="w-8 h-px bg-slate-800" />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div
          className="w-full max-w-lg mx-auto py-6"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateX(16px)' : 'none',
            transition: 'all 0.28s ease',
          }}
        >
          {/* STEP: NOME */}
          {step === 'name' && (
            <div className="space-y-6">
              <div>
                <p className="text-[9px] text-slate-600 tracking-[0.4em] uppercase mb-2">// Passo 01 — Identidade</p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Qual é o seu <span className="text-cyan-400">nome</span>?
                </h1>
                <p className="text-[11px] text-slate-500 mt-1">Este será seu identificador no sistema.</p>
              </div>
              <div>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nextStep()}
                  placeholder="SEU_CODINOME"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-black border border-slate-800 px-4 py-4 text-lg font-black text-cyan-300 placeholder:text-slate-800 outline-none focus:border-cyan-500 uppercase tracking-widest"
                />
                <div className="flex justify-between mt-1.5">
                  {error && <p className="text-[10px] text-red-400">// {error}</p>}
                  <p className="text-[9px] text-slate-700 ml-auto">{playerName.length}/20</p>
                </div>
              </div>
              <button
                onClick={nextStep}
                disabled={!playerName.trim()}
                className="flex items-center gap-2 px-6 py-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-black text-sm uppercase tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* STEP: CLASSE */}
          {step === 'class' && (
            <div className="space-y-5">
              <div>
                <p className="text-[9px] text-slate-600 tracking-[0.4em] uppercase mb-2">// Passo 02 — Classe inicial</p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Escolha sua <span className="text-cyan-400">classe</span>
                </h1>
                <p className="text-[11px] text-slate-500 mt-1">Define a distribuição inicial de atributos.</p>
              </div>
              <div className="space-y-2">
                {CLASSES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClass(c.id)}
                    className="w-full text-left p-3 border transition-all"
                    style={
                      selectedClass === c.id
                        ? { borderColor: c.border, background: `${c.color}08`, boxShadow: `0 0 16px ${c.color}18` }
                        : { borderColor: 'rgba(255,255,255,0.06)', background: 'transparent' }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 flex-shrink-0">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-black text-sm tracking-wider" style={{ color: selectedClass === c.id ? c.color : '#9ca3af' }}>
                            {c.label.toUpperCase()}
                          </p>
                          {selectedClass === c.id && (
                            <span className="text-[8px] px-1.5 py-0.5 font-black leading-none" style={{ background: `${c.color}22`, color: c.color }}>
                              SELECIONADO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{c.desc}</p>
                        {selectedClass === c.id && (
                          <div className="space-y-1.5">
                            {Object.entries(c.attrs).map(([k, v]) => (
                              <AttrBar key={k} label={ATTR_LABELS[k] ?? k} value={v} color={c.color} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {error && <p className="text-[10px] text-red-400">// {error}</p>}
              <button
                onClick={nextStep}
                disabled={!selectedClass}
                className="flex items-center gap-2 px-6 py-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-black text-sm uppercase tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* STEP: CONFIRMAÇÃO */}
          {step === 'confirm' && classe && (
            <div className="space-y-5">
              <div>
                <p className="text-[9px] text-slate-600 tracking-[0.4em] uppercase mb-2">// Passo 03 — Confirmação</p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Confirmar <span className="text-cyan-400">registro</span>?
                </h1>
              </div>
              <div
                className="border p-5 space-y-4"
                style={{ borderColor: `${classe.color}44`, background: `${classe.color}06` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{classe.icon}</span>
                  <div>
                    <p className="text-[9px] text-slate-600 tracking-widest uppercase">Jogador</p>
                    <p className="text-xl font-black text-white uppercase tracking-wider">{playerName}</p>
                    <p className="text-[11px] font-bold tracking-widest mt-0.5" style={{ color: classe.color }}>
                      Classe: {classe.label.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-900 pt-3 space-y-1.5">
                  {Object.entries(classe.attrs).map(([k, v]) => (
                    <AttrBar key={k} label={ATTR_LABELS[k] ?? k} value={v} color={classe.color} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic border-t border-slate-900 pt-3">{classe.flavor}</p>
              </div>
              {error && (
                <div className="border border-red-900/60 bg-red-950/20 px-3 py-2.5 text-[9px] text-red-400 font-bold">
                  // {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => transitionTo('class')}
                  disabled={loading}
                  className="px-4 py-3 border border-slate-800 text-slate-500 font-bold text-sm uppercase tracking-widest hover:border-slate-600 transition-all disabled:opacity-30"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40"
                  style={{ borderColor: `${classe.color}60`, background: `${classe.color}12`, color: classe.color }}
                >
                  {loading ? (
                    <><Loader2 size={14} className="animate-spin" /> Registrando...</>
                  ) : (
                    'Entrar no sistema ⚡'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}