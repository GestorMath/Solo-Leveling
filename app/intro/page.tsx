'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase' // ML-01: usa singleton, não createBrowserClient local

const LINES = [
  'CONEXÃO COM O SISTEMA ESTABELECIDA...',
  'VERIFICANDO IDENTIDADE DO JOGADOR...',
  'CARREGANDO DADOS DA DUNGEON...',
  'INICIALIZANDO PROTOCOLO DE RANKING...',
  'SISTEMA PRONTO.',
]

export default function IntroPage() {
  const router    = useRouter()
  const [phase,     setPhase]     = useState<'boot' | 'lines' | 'arise' | 'fade'>('boot')
  const [lineIndex, setLineIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; size: number }[]>([])
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const pts = Array.from({ length: 24 }, (_, i) => ({
      id:    i,
      x:     20 + Math.random() * 60,
      delay: Math.random() * 3,
      size:  4 + Math.random() * 12,
    }))
    setParticles(pts)
    const t = setTimeout(() => setPhase('lines'), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'lines') return
    const currentLine = LINES[lineIndex]
    if (!currentLine) {
      const t = setTimeout(() => setPhase('arise'), 600)
      return () => clearTimeout(t)
    }

    let charIdx = 0
    setTypedText('')

    const type = () => {
      charIdx++
      setTypedText(currentLine.slice(0, charIdx))
      if (charIdx < currentLine.length) {
        typingRef.current = setTimeout(type, 28)
      } else {
        typingRef.current = setTimeout(() => setLineIndex(i => i + 1), 340)
      }
    }
    type()

    return () => { if (typingRef.current) clearTimeout(typingRef.current) }
  }, [phase, lineIndex])

  useEffect(() => {
    if (phase !== 'arise') return
    const t = setTimeout(() => setPhase('fade'), 1400)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fade') return

    let cancelled = false

    async function checkAndRedirect() {
      // ML-01: usa singleton supabase, não cria nova instância local
      // SEC: usa getUser() (server-validated) em vez de getSession() (client-only)
      const { data: { user } } = await supabase.auth.getUser()

      if (cancelled) return

      await new Promise(r => setTimeout(r, 800)) // fade out delay

      if (cancelled) return

      if (!user) {
        router.replace('/auth')
        return
      }

      // Verificar se tem classe (onboarding completo)
      const { data: player } = await supabase
        .from('players')
        .select('class')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      router.replace(player?.class ? '/Dashboard' : '/onboarding')
    }

    checkAndRedirect()
    return () => { cancelled = true }
  }, [phase, router])

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden font-mono"
      style={{ opacity: phase === 'fade' ? 0 : 1, transition: 'opacity 0.8s ease' }}
    >
      {/* Partículas */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left:       `${p.x}%`,
            width:      p.size,
            height:     p.size,
            background: 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, transparent 70%)',
            animation:  `smokeRise ${4 + Math.random() * 4}s ${p.delay}s infinite ease-out`,
          }}
        />
      ))}

      <div className="scanline opacity-30" />

      {/* Logo */}
      <div className="relative mb-12 flex items-center justify-center">
        <svg width="140" height="120" viewBox="0 0 140 120">
          <polygon
            points="70,8 128,40 128,80 70,112 12,80 12,40"
            fill="none"
            stroke="cyan"
            strokeWidth="2"
            style={{ animation: 'hexPulse 1.8s infinite ease-in-out' }}
          />
          <text x="70" y="68" textAnchor="middle" fill="cyan" fontSize="32" fontWeight="bold">S</text>
        </svg>
      </div>

      {/* Linhas de boot */}
      <div
        className={`w-full max-w-md px-8 space-y-1.5 transition-opacity duration-500 ${
          (phase === 'arise' || phase === 'fade') ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {LINES.slice(0, lineIndex).map((line, i) => (
          <div key={i} className="text-[10px] text-slate-500 truncate">
            {'>'} {line} <span className="text-cyan-500 float-right">✓</span>
          </div>
        ))}
        {phase === 'lines' && typedText && (
          <div className="text-[10px] text-cyan-300">{'>'} {typedText}</div>
        )}
      </div>

      {/* ARISE */}
      {phase === 'arise' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-cyan-400 text-6xl font-black tracking-widest animate-pulse select-none">
            ARISE
          </p>
        </div>
      )}

      <style>{`
        @keyframes smokeRise {
          0%   { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-60vh) scale(3); opacity: 0; }
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.9; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}