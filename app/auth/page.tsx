'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'

type Tab = 'login' | 'cadastro'

function GridDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-[3px] h-[3px] rounded-full bg-cyan-500/20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationName: 'dotPulse',
        animationDuration: '3s',
        animationDelay: `${delay}s`,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      }}
    />
  )
}

export default function AuthPage() {
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [dots, setDots] = useState<{ x: number; y: number; delay: number }[]>([])
  const [mounted, setMounted] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const arr = Array.from({ length: 80 }, (_, i) => ({
      x: (i % 10) * 11.5 + Math.random() * 4,
      y: Math.floor(i / 10) * 13 + Math.random() * 4,
      delay: Math.random() * 3,
    }))
    setDots(arr)
  }, [])

  async function handleSubmit() {
    if (loading) return
    setError('')
    setSuccessMsg('')

    if (!email.trim() || !password) {
      setError('CAMPOS OBRIGATÓRIOS — Preencha e-mail e senha.')
      return
    }
    
    setLoading(true)

    try {
      if (tab === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (authError) throw authError

        if (data?.user) {
          // VERIFICAÇÃO DE SEGURANÇA: O player já existe na tabela 'players'?
          const { data: playerData } = await supabase
            .from('players')
            .select('class')
            .eq('id', data.user.id)
            .single()

          // Se não tem classe definida, é um player novo ou incompleto -> Onboarding
          if (!playerData || !playerData.class) {
            window.location.href = '/onboarding'
          } else {
            window.location.href = '/Dashboard'
          }
        }
      } else {
        // FLUXO DE CADASTRO (NOVO JOGADOR)
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (authError) throw authError

        // Se a sessão foi criada imediatamente (sem confirmação de email pendente)
        if (data.session) {
          window.location.href = '/onboarding'
        } else {
          setSuccessMsg('CONTA CRIADA — Verifique seu e-mail para confirmar o acesso.')
          setLoading(false)
        }
      }
    } catch (err: any) {
      setError(`ERRO DO SISTEMA — ${err.message}`)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    if (loading) return
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`, // Força ir para onboarding no primeiro acesso Google
      },
    })

    if (authError) {
      setError('ERRO COM GOOGLE — Tente novamente.')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none">
        {dots.map((d, i) => <GridDot key={i} {...d} />)}
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-25" />

      <div className="relative z-10 w-full max-w-sm mx-4" style={{ animation: 'cardIn 0.5s both' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <svg width="48" height="42" viewBox="0 0 48 42">
              <polygon points="24,2 44,13 44,29 24,40 4,29 4,13" fill="none" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
              <text x="24" y="27" textAnchor="middle" fill="rgba(0,255,255,0.9)" fontSize="14" fontWeight="bold">S</text>
            </svg>
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.3em] text-white">SOLO LEVELING</h1>
          <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mt-1">SISTEMA DE EVOLUÇÃO PESSOAL</p>
        </div>

        <div className="flex mb-6 border border-slate-800">
          {(['login', 'cadastro'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccessMsg('') }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-600'
              }`}
            >
              {t === 'login' ? 'LOGIN' : 'CADASTRO'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[8px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-1.5 block">// E-MAIL</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="player@sistema.io"
              className="w-full bg-black border border-slate-800 px-4 py-3 text-sm text-cyan-300 outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[8px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-1.5 block">// SENHA</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full bg-black border border-slate-800 px-4 py-3 pr-10 text-sm text-cyan-300 outline-none focus:border-cyan-500 transition-all"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div className="border border-red-900/60 bg-red-950/30 px-3 py-2.5 text-[9px] text-red-400 font-bold tracking-wider">// {error}</div>}
          {successMsg && <div className="border border-cyan-900/60 bg-cyan-950/20 px-3 py-2.5 text-[9px] text-cyan-400 font-bold tracking-wider">// {successMsg}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-cyan-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> PROCESSANDO...</> : tab === 'login' ? 'ENTRAR NO SISTEMA' : 'CRIAR CONTA'}
          </button>

          <button onClick={handleGoogle} disabled={loading} className="w-full py-3 bg-black border border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-slate-600 flex items-center justify-center gap-2">
            Continuar com Google
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.8); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .scanline { background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px); }
      `}</style>
    </div>
  )
}