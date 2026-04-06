'use client'
import { useEffect, useState } from 'react'
import { useSystem, STAT_LABELS } from '../context/SystemContext'

export default function DespertarModal() {
  const { rankChallenge, advanceRankChallenge, dismissRankChallenge } = useSystem()
  const [shake, setShake]       = useState(false)
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; delay: number }[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        color: i % 3 === 0
          ? 'rgba(0,255,255,0.8)'
          : i % 3 === 1
            ? 'rgba(147,51,234,0.8)'
            : 'rgba(255,68,102,0.5)',
        delay: Math.random() * 3,
      }))
    )
  }, [])

  // Nada a mostrar
  if (!rankChallenge || (!rankChallenge.active && !rankChallenge.completed)) return null

  function tryDismiss() {
    if (!rankChallenge?.completed) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    dismissRankChallenge()
  }

  const pct       = Math.min((rankChallenge.currentCount / rankChallenge.requiredCount) * 100, 100)
  const completed = rankChallenge.completed
  const accent    = completed ? '#00ffff' : '#a855f7'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000,
      background: 'rgba(0,0,0,0.97)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: 'monospace',
    }}>
      {/* Partículas flutuantes */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: 5, height: 5, borderRadius: '50%',
          background: p.color, pointerEvents: 'none',
          animation: `floatParticle ${2.5 + Math.random()}s ${p.delay}s ease-in-out infinite alternate`,
          opacity: 0.7,
        }} />
      ))}

      {/* Grid de fundo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(0,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,255,1) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Correntes laterais (só enquanto não completado) */}
      {!completed && (
        <>
          {[{ side: 'left' as const, flip: false }, { side: 'right' as const, flip: true }].map(({ side, flip }) => (
            <div key={side} style={{
              position: 'absolute',
              [side]: 0,
              top: '50%', transform: `translateY(-50%)${flip ? ' scaleX(-1)' : ''}`,
              display: 'flex', flexDirection: 'column', gap: 4, padding: '0 6px',
              animation: shake
                ? 'chainShakeModal 0.12s ease-in-out 5'
                : `floatChain ${side === 'left' ? '3s' : '3.5s'} ease-in-out infinite alternate`,
            }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ color: `rgba(107,33,168,${0.4 + i * 0.05})` }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M10 8H6a4 4 0 0 0 0 8h4m4-8h4a4 4 0 0 1 0 8h-4M8 12h8"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Glow central */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 480, height: 480, borderRadius: '50%', pointerEvents: 'none',
        background: completed
          ? 'radial-gradient(circle, rgba(0,255,255,0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(147,51,234,0.10) 0%, transparent 70%)',
        animation: 'glowPulse 3s ease-in-out infinite',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 540,
        margin: '0 40px',
        border: `1px solid ${completed ? 'rgba(0,255,255,0.4)' : 'rgba(147,51,234,0.4)'}`,
        background: completed ? 'rgba(0,20,30,0.97)' : 'rgba(10,0,20,0.97)',
        padding: 32,
        animation: 'despertarIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        boxShadow: completed
          ? '0 0 60px rgba(0,255,255,0.25), inset 0 0 40px rgba(0,255,255,0.04)'
          : '0 0 60px rgba(147,51,234,0.25), inset 0 0 40px rgba(147,51,234,0.04)',
      }}>

        {/* Topo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 52, marginBottom: 12,
            animation: completed ? 'iconFloat 2s ease-in-out infinite' : 'iconShake 4s ease-in-out infinite',
          }}>
            {completed ? '⚡' : '⛓️'}
          </div>

          <p style={{ fontSize: 9, color: '#475569', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 8 }}>
            // Protocolo de Ascensão — Rank {rankChallenge.targetRank}
          </p>

          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', margin: '0 0 10px 0',
            color: 'transparent',
            WebkitTextStroke: `1px ${accent}`,
            animation: 'titleGlow 2s ease-in-out infinite',
          }}>
            {completed ? 'Despertar Concluído' : 'Despertar'}
          </h1>

          <p style={{ fontSize: 11, color: '#94a3b8', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
            {completed
              ? `Você provou sua força interior. O Rank ${rankChallenge.targetRank} aguarda por você.`
              : 'O Sistema detectou sua evolução. Antes de ascender ao próximo rank, você deve provar que está pronto.'
            }
          </p>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: `${accent}30`, margin: '20px 0' }} />

        {/* Tarefa */}
        <div style={{
          background: `${accent}08`,
          border: `1px solid ${accent}25`,
          padding: '16px 18px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 8, color: '#475569', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 8 }}>
            // Tarefa do Sistema · Atributo Dominante: {STAT_LABELS[rankChallenge.stat]}
          </p>
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {rankChallenge.taskTitle}
          </p>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
            {rankChallenge.taskDescription}
          </p>
        </div>

        {/* Progresso */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Progresso</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: accent }}>
              {rankChallenge.currentCount} / {rankChallenge.requiredCount}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: completed
                ? 'linear-gradient(90deg, #00ffff, #22ffff)'
                : 'linear-gradient(90deg, #7e22ce, #a855f7)',
              borderRadius: 3, transition: 'width 0.6s ease',
              boxShadow: `0 0 12px ${accent}80`,
            }} />
          </div>
          <p style={{ fontSize: 8, color: '#334155', marginTop: 4, textAlign: 'right' }}>{Math.round(pct)}%</p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!completed && (
            <button
              onClick={advanceRankChallenge}
              style={{
                flex: 1, padding: '13px 0',
                background: 'rgba(147,51,234,0.15)',
                border: '1px solid rgba(147,51,234,0.55)',
                color: '#d8b4fe',
                fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em',
                cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s',
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.background = 'rgba(147,51,234,0.28)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.background = 'rgba(147,51,234,0.15)')}
            >
              ✓ Marcar Execução (+1)
            </button>
          )}

          <button
            onClick={tryDismiss}
            style={{
              flex: completed ? 1 : 0.55,
              padding: '13px 0',
              background: completed ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${completed ? 'rgba(0,255,255,0.5)' : 'rgba(71,85,105,0.3)'}`,
              color: completed ? '#22d3ee' : '#475569',
              fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em',
              cursor: completed ? 'pointer' : 'not-allowed',
              fontFamily: 'monospace', transition: 'all 0.2s',
            }}
          >
            {completed ? `⚡ Ascender — ${rankChallenge.targetRank}` : '🔒 Bloqueado'}
          </button>
        </div>

        {/* Aviso */}
        {!completed && (
          <p style={{ fontSize: 8, color: '#334155', textAlign: 'center', marginTop: 12, letterSpacing: '0.1em' }}>
            // O aplicativo está bloqueado até que o desafio seja concluído.
          </p>
        )}
      </div>

      <style>{`
        @keyframes floatParticle {
          from { transform: translateY(0) scale(1); opacity: 0.7; }
          to   { transform: translateY(-25px) scale(0.5); opacity: 0.1; }
        }
        @keyframes chainShakeModal {
          0%,100% { transform: translateY(-50%) translateX(0); }
          25%      { transform: translateY(-50%) translateX(-5px); }
          75%      { transform: translateY(-50%) translateX(5px); }
        }
        @keyframes floatChain {
          from { transform: translateY(-50%) translateX(0); }
          to   { transform: translateY(calc(-50% - 8px)) translateX(3px); }
        }
        @keyframes despertarIn {
          from { opacity: 0; transform: scale(0.75); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes titleGlow {
          0%,100% { text-shadow: 0 0 20px rgba(0,255,255,0.4); }
          50%      { text-shadow: 0 0 50px rgba(0,255,255,1), 0 0 80px rgba(147,51,234,0.5); }
        }
        @keyframes iconFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes iconShake {
          0%,90%,100% { transform: rotate(0deg); }
          93%          { transform: rotate(-3deg); }
          97%          { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  )
}