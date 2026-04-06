'use client'
import { useSystem } from '../context/SystemContext'

const ALERT_STYLES = {
  success:  'bg-black border-cyan-500 text-cyan-400',
  info:     'bg-black border-blue-500 text-blue-400',
  critical: 'bg-black border-red-500 text-red-400',
}

const BAR_COLORS = {
  success:  'bg-cyan-500',
  info:     'bg-blue-500',
  critical: 'bg-red-500',
}

export default function AlertPopup() {
  const { alert } = useSystem()

  if (!alert.show) return null

  const styleClass = ALERT_STYLES[alert.type] ?? ALERT_STYLES.success
  const barClass   = BAR_COLORS[alert.type]   ?? BAR_COLORS.success

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[10] px-6 py-3 border-2 shadow-lg max-w-xs w-full mx-4 ${styleClass}`}
      role="alert"
      aria-live="polite"
    >
      <p className="font-black italic uppercase tracking-wider text-xs text-center">
        {alert.msg}
      </p>
      {/* Barra de progresso do tempo */}
      <div className={`absolute bottom-0 left-0 h-[2px] animate-shrink ${barClass}`} />
    </div>
  )
}