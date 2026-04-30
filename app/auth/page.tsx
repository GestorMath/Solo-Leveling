'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/app/lib/supabase' // ML-01: singleton

type Tab = 'login' | 'cadastro'

function GridDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-[3px] h-[3px] rounded-full bg-cyan-500/20"
      style={{
        left:              `${x}%`,
        top:               `${y}%`,
        animationName:     'dotPulse',
        animationDuration: '3s',
        animationDelay:    `${delay}s`,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      }}
    />
  )
}

export default function AuthPage() {
  const router = useRouter()

  const [tab,        setTab]        = useState<Tab>('login')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [dots,       setDots]       = useState<{ x: number; y: number; delay: number }[]>([])
  const [mounted,    setMounted]    = useState(false)

  // SEC-04: debounce ref para prevenir double-submit
  const submitLockRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    const arr = Array.from({ length: 80 }, (_, i) => ({
      x:     (i % 10) * 11.5 + Math.random() * 4,
      y:     Math.floor(i / 10) * 13 + Math.random() * 4,
      delay: Math.random() * 3,
    }))
    setDots(arr)
  }, [])

  async function handleSubmit() {
    // SEC-04: previne double click / race condition no submit
    if (loading || submitLockRef.current) return
    submitLockRef.current = true

    setError('')
    setSuccessMsg('')

    if (!email.trim() || !password) {
      setError('CAMPOS OBRIGATÓRIOS — Preencha e-mail e senha.')
      submitLockRef.current = false
      return
    }

    if (password.length < 6) {
      setError('SENHA MUITO CURTA — Mínimo 6 caracteres.')
      submitLockRef.current = false
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
          const { data: playerData } = await supabase
            .from('players')
            .select('class')
            .eq('id', data.user.id)
            .maybeSingle()

          window.location.href = (!playerData?.class) ? '/onboarding' : '/Dashboard'
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (authError) throw authError

        if (data.session) {
          window.location.href = '/onboarding'
        } else {
          setSuccessMsg('CONTA CRIADA — Verifique seu e-mail para confirmar.')
          setLoading(false)
          submitLockRef.current = false
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      // Traduzir mensagens comuns do Supabase
      if (msg.includes('Invalid login credentials')) {
        setError('ERRO — E-mail ou senha incorretos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('ERRO — Confirme seu e-mail antes de entrar.')
      } else if (msg.includes('User already registered')) {
        setError('ERRO — Este e-mail já está cadastrado. Faça login.')
      } else {
        setError(`ERRO — ${msg}`)
      }
      setLoading(false)
      submitLockRef.current = false
    }
  }

  async function handleGoogle() {
    if (loading || submitLockRef.current) return
    submitLockRef.current = true
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (authError) {
      setError('ERRO COM GOOGLE — Tente novamente.')
      setLoading(false)
      submitLockRef.current = false
    }
    // Se não houve erro, o redirect acontece automaticamente
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-mono">

      {/* Grid animado */}
      <div className="absolute inset-0 pointer-events-none">
        {dots.map((d, i) => <GridDot key={i} {...d} />)}
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,1) 1px, transparent 1px)`,
          backgroundSize:  '80px 80px',
        }}
      />
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-25" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4" style={{ animation: 'cardIn 0.5s both' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <svg width="52" height="46" viewBox="0 0 48 42">
              <polygon
                points="24,2 44,13 44,29 24,40 4,29 4,13"
                fill="none"
                stroke="rgba(0,255,255,0.8)"
                strokeWidth="1.5"
              />
              <text x="24" y="27" textAnchor="middle" fill="rgba(0,255,255,0.9)" fontSize="14" fontWeight="bold">S</text>
            </svg>
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.3em] text-white">PROJETO S</h1>
          <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mt-1">SISTEMA DE EVOLUÇÃO PESSOAL</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border border-slate-800">
          {(['login', 'cadastro'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccessMsg('') }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {t === 'login' ? 'LOGIN' : 'CADASTRO'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">

          <div>
            <label className="text-[8px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-1.5 block">
              // E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="player@projetoS.io"
              disabled={loading}
              className="w-full bg-black border border-slate-800 px-4 py-3 text-sm text-cyan-300 outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-[8px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-1.5 block">
              // SENHA
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-black border border-slate-800 px-4 py-3 pr-10 text-sm text-cyan-300 outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="border border-red-900/60 bg-red-950/30 px-3 py-2.5 text-[9px] text-red-400 font-bold tracking-wider flex items-start gap-2">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="border border-cyan-900/60 bg-cyan-950/20 px-3 py-2.5 text-[9px] text-cyan-400 font-bold tracking-wider">
              // {successMsg}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> PROCESSANDO...</>
              : tab === 'login' ? 'ENTRAR NO SISTEMA' : 'CRIAR CONTA'
            }
          </button>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 bg-black border border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="mr-1" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.7;  transform: scale(1.8); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scanline {
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px);
        }
      `}</style>
    </div>
  )
}