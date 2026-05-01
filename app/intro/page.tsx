'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

const LINES = [
  'CONEXÃO COM O SISTEMA ESTABELECIDA...',
  'VERIFICANDO IDENTIDADE DO JOGADOR...',
  'CARREGANDO DADOS DA DUNGEON...',
  'INICIALIZANDO PROTOCOLO DE RANKING...',
  'SISTEMA PRONTO.',
]

export default function IntroPage() {
  const router    = useRouter()
  const [phase,     setPhase]     = useState<'boot' | 'lines' | 'evolua' | 'fade'>('boot')
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
      const t = setTimeout(() => setPhase('evolua'), 600)
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
    if (phase !== 'evolua') return
    const t = setTimeout(() => setPhase('fade'), 1800)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fade') return
    let cancelled = false
    async function checkAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      await new Promise(r => setTimeout(r, 800))
      if (cancelled) return
      if (!user) { router.replace('/auth'); return }
      const { data: player } = await supabase
        .from('players').select('class').eq('id', user.id).maybeSingle()
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
          className="absolute bottom-0 rounded-full pointer-events-none"
          style={{
            left:       `${p.x}%`,
            width:      p.size,
            height:     p.size,
            background: 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, transparent 70%)',
            animation:  `smokeRise ${4 + Math.random() * 4}s ${p.delay}s infinite ease-out`,
          }}
        />
      ))}

      <div className="scanline opacity-30 pointer-events-none" />

      {/* Logo — só visível na fase lines/boot */}
      <div
        className="relative mb-12 flex items-center justify-center transition-opacity duration-500"
        style={{ opacity: phase === 'evolua' || phase === 'fade' ? 0 : 1 }}
      >
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
          phase === 'evolua' || phase === 'fade' ? 'opacity-0' : 'opacity-100'
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

      {/* EVOLUA — aparece em tela cheia SEM sobrepor o conteúdo anterior */}
      {phase === 'evolua' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ animation: 'fadeInScale 0.5s ease-out both' }}
        >
          {/* Logo grande */}
          <svg width="100" height="86" viewBox="0 0 140 120" className="mb-8" style={{ animation: 'hexPulse 1.4s infinite ease-in-out' }}>
            <polygon
              points="70,8 128,40 128,80 70,112 12,80 12,40"
              fill="none"
              stroke="cyan"
              strokeWidth="2"
            />
            <text x="70" y="68" textAnchor="middle" fill="cyan" fontSize="32" fontWeight="bold">S</text>
          </svg>

          {/* Texto EVOLUA */}
          <p
            className="text-6xl md:text-7xl font-black tracking-[0.3em] uppercase select-none"
            style={{
              color:           'transparent',
              WebkitTextStroke: '2px rgba(0,255,255,0.9)',
              textShadow:      '0 0 40px rgba(0,255,255,0.7), 0 0 80px rgba(0,255,255,0.3)',
              animation:       'evolua-pulse 0.8s ease-in-out infinite',
            }}
          >
            EVOLUA
          </p>

          <p className="text-[10px] text-cyan-500/50 uppercase tracking-[0.5em] mt-4">
            sistema de evolução pessoal
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
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes evolua-pulse {
          0%, 100% { text-shadow: 0 0 40px rgba(0,255,255,0.7), 0 0 80px rgba(0,255,255,0.3); }
          50%       { text-shadow: 0 0 80px rgba(0,255,255,1),   0 0 120px rgba(0,255,255,0.6); }
        }
        .scanline {
          position: fixed; inset: 0; z-index: 9998; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px);
        }
      `}</style>
    </div>
  )
}