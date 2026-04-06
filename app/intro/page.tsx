'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const LINES = [
  'CONEXÃO COM O SISTEMA ESTABELECIDA...',
  'VERIFICANDO IDENTIDADE DO JOGADOR...',
  'CARREGANDO DADOS DA DUNGEON...',
  'INICIALIZANDO PROTOCOLO DE RANKING...',
  'SISTEMA PRONTO.',
]

export default function IntroPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [phase, setPhase] = useState<'boot' | 'lines' | 'arise' | 'fade'>('boot')
  const [lineIndex, setLineIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; size: number }[]>([])
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const pts = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      delay: Math.random() * 3,
      size: 4 + Math.random() * 12,
    }))
    setParticles(pts)
    const t = setTimeout(() => setPhase('lines'), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'lines') return
    const currentLine = LINES[lineIndex]
    if (!currentLine) {
      setTimeout(() => setPhase('arise'), 600)
      return
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
    setTimeout(() => setPhase('fade'), 1400)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fade') return
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setTimeout(() => {
        router.replace(session ? '/Dashboard' : '/auth')
      }, 800)
    }
    checkSession()
  }, [phase, router, supabase])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden font-mono" style={{ opacity: phase === 'fade' ? 0 : 1, transition: 'opacity 0.8s ease' }}>
      {particles.map(p => (
        <div key={p.id} className="absolute bottom-0 rounded-full" style={{ left: `${p.x}%`, width: p.size, height: p.size, background: 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, transparent 70%)', animation: `smokeRise ${4+Math.random()*4}s ${p.delay}s infinite ease-out` }} />
      ))}
      <div className="scanline opacity-30" />
      <div className="relative mb-12 flex items-center justify-center">
        <svg width="140" height="120" viewBox="0 0 140 120">
          <polygon points="70,8 128,40 128,80 70,112 12,80 12,40" fill="none" stroke="cyan" strokeWidth="2" style={{ animation: 'hexPulse 1.8s infinite ease-in-out' }} />
          <text x="70" y="68" textAnchor="middle" fill="cyan" fontSize="32" fontWeight="bold">S</text>
        </svg>
      </div>

      <div className={`w-full max-w-md px-8 space-y-1.5 transition-opacity duration-500 ${(phase === 'arise' || phase === 'fade') ? 'opacity-0' : 'opacity-100'}`}>
        {LINES.slice(0, lineIndex).map((line, i) => (
          <div key={i} className="text-[10px] text-slate-500 truncate">{'>'} {line} <span className="text-cyan-500 float-right">✓</span></div>
        ))}
        {phase === 'lines' && typedText && <div className="text-[10px] text-cyan-300">{'>'} {typedText}</div>}
      </div>

      {phase === 'arise' && <div className="absolute inset-0 flex items-center justify-center text-cyan-400 text-6xl font-black tracking-widest animate-pulse">ARISE</div>}

      <style>{`
        @keyframes smokeRise { 0% { transform: translateY(0) scale(1); opacity: 0.6; } 100% { transform: translateY(-60vh) scale(3); opacity: 0; } }
        @keyframes hexPulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}